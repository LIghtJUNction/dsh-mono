import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const { plugins } = JSON.parse(await readFile(join(root, 'plugins.json'), 'utf8'));
const out = join(root, '.artifacts/packages');
await mkdir(out, { recursive: true });
await exec('npm', ['run', 'build', '--workspaces'], { cwd: root, maxBuffer: 4 * 1024 * 1024 });
const sums = [];
const records = [];
for (const plugin of plugins) {
  const directory = join(root, 'plugins', plugin.name);
  const { stdout } = await exec('npm', ['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', out], { cwd: directory });
  const packed = JSON.parse(stdout);
  const [record] = Array.isArray(packed) ? packed : Object.values(packed);
  if (!record || record.name !== `@lightjunction/${plugin.name}`) throw new Error(`Unexpected npm pack result for ${plugin.name}`);
  const paths = record.files.map(f => f.path);
  for (const required of ['dist/index.js', 'dist/index.d.ts', 'cordis.patch.yml', 'README.md', 'UPSTREAM.md', 'LICENSE']) {
    if (!paths.includes(required)) throw new Error(`${plugin.name} package missing ${required}`);
  }
  if (paths.some(p => p.startsWith('test/') || p.startsWith('node_modules/') || /(^|\/)\.env($|\.)/.test(p))) throw new Error(`Unexpected package content: ${plugin.name}`);
  const sha256 = createHash('sha256').update(await readFile(join(out, record.filename))).digest('hex');
  sums.push(`${sha256}  ${record.filename}`);
  records.push({ name: record.name, version: record.version, filename: record.filename, sha256, bytes: record.size });
  console.log(`PACK ${record.filename} (${record.size} bytes)`);
}
await writeFile(join(out, 'SHA256SUMS'), sums.join('\n') + '\n');
await writeFile(join(out, 'catalog.json'), JSON.stringify(records, null, 2) + '\n');

const hostPackages = ['dsh-agent-loop', 'dsh-fs-local', 'dsh-token-meter', 'dsh-session-projection'].map(name => `@deepseek-ai/${name}@0.2.1-rc.2`);
const queue = [...records];
async function standalone(record) {
  const directory = await mkdtemp(join(tmpdir(), 'dsh-mono-single-'));
  try {
    await writeFile(join(directory, 'package.json'), JSON.stringify({ name: 'dsh-single-package-smoke', private: true, type: 'module' }));
    await exec('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(out, record.filename), ...hostPackages], { cwd: directory, maxBuffer: 4 * 1024 * 1024 });
    await writeFile(join(directory, 'host.ts'), await readFile(join(root, 'templates/host.ts')));
    await writeFile(join(directory, 'smoke.mjs'), `
import { createHost } from './host.ts';
const host = await createHost();
try {
  const plugin = await import(${JSON.stringify(record.name)});
  const fiber = await host.ctx.plugin(plugin, ${record.name.endsWith('/dsh-caffeinate') ? '{ enabled: false }' : '{}'});
  if (fiber.state !== 2) throw new Error('Plugin did not activate');
  if (!${JSON.stringify(record.name)}.endsWith('/dsh-dotenv') && !host.ctx.tools.schemas().length) throw new Error('No tools registered');
} finally { await host.close(); }
`);
    await exec('node', ['smoke.mjs'], { cwd: directory, maxBuffer: 4 * 1024 * 1024 });
    console.log(`STANDALONE ${record.name}`);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
const singleResults = await Promise.allSettled(Array.from({ length: 3 }, async () => {
  for (let record; (record = queue.shift());) await standalone(record);
}));
const singleFailure = singleResults.find(result => result.status === 'rejected');
if (singleFailure) throw singleFailure.reason;

// Install the exact archives in a fresh project to catch undeclared dependencies
// and workspace-only imports before publishing them.
const staging = await mkdtemp(join(tmpdir(), 'dsh-mono-pack-'));
try {
  await writeFile(join(staging, 'package.json'), JSON.stringify({ name: 'dsh-packed-smoke', private: true, type: 'module' }));
  const archives = records.map(p => join(out, p.filename));
  const install = await exec('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...archives, ...hostPackages], { cwd: staging, maxBuffer: 4 * 1024 * 1024 });
  await writeFile(join(root, '.artifacts/install.log'), install.stdout + install.stderr);
  const program = `
import { createHost, toolResponse, textResponse } from './host.ts';
import { MessageId } from '@deepseek-ai/dsh-llm';
const host = await createHost(${JSON.stringify(staging)});
const {ctx, errors} = host;
try {
  for (const name of ${JSON.stringify(records.map(p => p.name))}) {
    const plugin = await import(name);
    if (typeof plugin.apply !== 'function' || !plugin.name || !Array.isArray(plugin.inject)) throw new Error('Invalid entry: ' + name);
    const before = ctx.tools.schemas().length;
    const fiber = await ctx.plugin(plugin, name.endsWith('/dsh-caffeinate') ? { enabled: false } : {});
    if (fiber.state !== 2) throw new Error('Plugin did not activate: ' + name + ', state=' + fiber.state);
    if (!name.endsWith('/dsh-dotenv') && ctx.tools.schemas().length <= before) throw new Error('No tools registered: ' + name);
    console.log('LOAD ' + name);
  }
  host.model.responses.push(toolResponse('hashline_read', { path: 'fixture.ts' }), textResponse('Packed plugins work together.'));
  const {agent} = await host.create('packed-integration');
  agent.followup({ id: MessageId('packed-prompt'), role: 'user', source: {kind: 'user'}, content: [{type: 'text', text: 'Read fixture.ts using hashline_read.'}] });
  await agent.whenIdle();
  if (host.model.requests.length !== 2) throw new Error('Expected model/tool/model round trip');
  const response = host.model.requests[1].messages.find(message => message.role === 'tool');
  if (!response || JSON.stringify(response).includes('UNKNOWN_TOOL') || !JSON.stringify(response).includes('answer')) throw new Error('Packed tool output did not reach the model');
  console.log('PASS packed model/tool/model round trip with all ten plugins mounted');
  if (errors.length) throw new Error(errors.join('\\n'));
} finally { await host.close(); }
`;
  await writeFile(join(staging, 'host.ts'), await readFile(join(root, 'templates/host.ts')));
  await writeFile(join(staging, 'fixture.ts'), 'export const answer = 42;\n');
  await writeFile(join(staging, 'smoke.mjs'), program);
  const smoke = await exec('node', ['smoke.mjs'], { cwd: staging, maxBuffer: 4 * 1024 * 1024 });
  process.stdout.write(smoke.stdout);
  if (smoke.stderr) process.stderr.write(smoke.stderr);
  await writeFile(join(root, '.artifacts/packed-smoke.log'), smoke.stdout + smoke.stderr);
} finally { await rm(staging, { recursive: true, force: true }); }
