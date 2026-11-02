import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const { plugins, dshVersion } = JSON.parse(await readFile(join(root, 'plugins.json'), 'utf8'));
const out = join(root, '.artifacts/checks');
await mkdir(out, { recursive: true });
const pending = [...plugins];
const results = [];
async function check(plugin) {
  const directory = join(root, 'plugins', plugin.name);
  const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  if (pkg.name !== `@lightjunction/${plugin.name}` || pkg.engines.dsh !== dshVersion) throw new Error(`Manifest mismatch: ${plugin.name}`);
  const patch = parse(await readFile(join(directory, 'cordis.patch.yml'), 'utf8'));
  if (patch[0]?.insert?.[0]?.name !== pkg.name) throw new Error(`Bundle mismatch: ${plugin.name}`);
  parse(await readFile(join(directory, '.github/workflows/release.yml'), 'utf8'));
  const started = performance.now();
  const result = await new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'check', '--workspace', pkg.name], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', chunk => { log += chunk; });
    child.stderr.on('data', chunk => { log += chunk; });
    child.on('error', reject);
    child.on('close', code => resolve({ name: plugin.name, code, log, seconds: Math.round((performance.now() - started) / 100) / 10 }));
  });
  await writeFile(join(out, `${plugin.name}.log`), result.log);
  const tests = Number(result.log.match(/^# tests (\d+)/m)?.[1] ?? 0);
  if (result.code === 0 && tests === 0) { result.code = 1; result.log += '\nNo behavior tests were executed.\n'; }
  results.push({ name: result.name, code: result.code, tests, seconds: result.seconds });
  console.log(`${result.code === 0 ? 'PASS' : 'FAIL'} ${plugin.name}: ${tests} tests (${result.seconds}s)`);
  if (result.code !== 0) process.stderr.write(result.log);
}
await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
  for (let plugin; (plugin = pending.shift());) {
    try { await check(plugin); }
    catch (error) { results.push({ name: plugin.name, code: 1, error: String(error) }); console.error(plugin.name, error); }
  }
}));
await writeFile(join(out, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), node: process.version, dshVersion, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.code === 0).length}/${plugins.length} plugins passed; ${results.reduce((n, r) => n + (r.tests ?? 0), 0)} tests. Logs: .artifacts/checks/`);
if (results.some(r => r.code !== 0)) process.exitCode = 1;
