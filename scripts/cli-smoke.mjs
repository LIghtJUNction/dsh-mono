import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const packages = join(root, '.artifacts/packages');
const records = JSON.parse(await readFile(join(packages, 'catalog.json'), 'utf8'));
const home = await mkdtemp(join(tmpdir(), 'dsh-mono-cli-'));
const env = { ...process.env, DSH_HOME: home, AGENTS_HOME: join(home, 'agents'), CI: 'true' };
let log = '';
try {
  const version = await exec('dsh', ['--version'], { env });
  if (version.stdout.trim() !== '0.2.1-rc.2') throw new Error('CLI smoke requires dsh 0.2.1-rc.2');
  const install = await exec('dsh', ['plugin', '--profile', 'headless', 'add', ...records.map(r => join(packages, r.filename)), '--ignore-scripts'], { env, timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
  log += install.stdout + install.stderr;
  const dump = await exec('dsh', ['--profile', 'headless', '--dump-config'], { env, timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  log += dump.stderr;
  for (const record of records) {
    if (!dump.stdout.includes(record.name)) throw new Error(`Bundle was not composed by DSH CLI: ${record.name}`);
  }
  const help = await exec('dsh', ['--profile', 'headless', '--help'], { env, timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  log += help.stdout + help.stderr;
  console.log('PASS isolated dsh CLI installation, bundle composition and headless startup for all ten archives');
} catch (error) {
  log += String(error) + '\n' + (error.stdout ?? '') + (error.stderr ?? '');
  throw error;
} finally {
  await mkdir(join(root, '.artifacts'), { recursive: true });
  await writeFile(join(root, '.artifacts/cli-smoke.log'), log);
  await rm(home, { recursive: true, force: true });
}
