import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const exec = promisify(execFile);
export async function scaffold({ name, description, upstream, destination = join(root, 'plugins', name) }) {
  if (!/^dsh-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error('Use a dsh-kebab-case name');
  try { await access(destination); throw new Error(`Destination already exists: ${destination}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const dir of ['src', 'test', '.github/workflows']) await mkdir(join(destination, dir), { recursive: true });
  const peers = Object.fromEntries(['cordis', 'dsh-tools', 'dsh-agent', 'dsh-llm', 'dsh-working-directory'].map(n => [`@deepseek-ai/${n}`, n === 'cordis' ? '4.0.5' : '0.2.1-rc.2']));
  const manifest = {
    name: `@lightjunction/${name}`, version: '0.1.0', description, type: 'module', license: 'MIT',
    repository: { type: 'git', url: `git+https://github.com/LIghtJUNction/${name}.git` },
    homepage: `https://github.com/LIghtJUNction/${name}#readme`,
    bugs: { url: `https://github.com/LIghtJUNction/${name}/issues` },
    main: './dist/index.js', types: './dist/index.d.ts',
    exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' }, './package.json': './package.json' },
    files: ['dist', 'cordis.patch.yml', 'README.md', 'UPSTREAM.md', 'LICENSE', 'NOTICE'],
    keywords: ['dsh-plugin', 'deepseek-harness', 'pi-extension'], engines: { node: '>=24', dsh: '0.2.1-rc.2' },
    dsh: { bundle: { patch: './cordis.patch.yml' } }, publishConfig: { access: 'public' },
    scripts: { build: 'tsc -p tsconfig.json', typecheck: 'tsc --noEmit -p tsconfig.json && tsc -p tsconfig.test.json', test: 'node --import tsx --test --test-reporter=tap test/*.test.ts', check: 'npm run typecheck && npm test && npm run build', prepack: 'npm run build' },
    peerDependencies: peers,
    dependencies: { '@deepseek-ai/schemastery': '3.18.5' },
    devDependencies: { ...peers, '@deepseek-ai/dsh-fs-local': '0.2.1-rc.2', '@deepseek-ai/dsh-agent-loop': '0.2.1-rc.2', '@deepseek-ai/dsh-session': '0.2.1-rc.2', '@deepseek-ai/dsh-session-projection': '0.2.1-rc.2', '@deepseek-ai/dsh-system-prompt': '0.2.1-rc.2', '@deepseek-ai/dsh-token-meter': '0.2.1-rc.2', typescript: '5.9.3', tsx: '4.23.15', '@types/node': '24.19.2' },
  };
  await writeFile(join(destination, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
  const compilerOptions = { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true, esModuleInterop: true, skipLibCheck: true, declaration: true, rootDir: 'src', outDir: 'dist' };
  await writeFile(join(destination, 'tsconfig.json'), JSON.stringify({ compilerOptions, include: ['src/**/*.ts'] }, null, 2) + '\n');
  await writeFile(join(destination, 'tsconfig.test.json'), JSON.stringify({ extends: './tsconfig.json', compilerOptions: { noEmit: true, rootDir: '.', declaration: false }, include: ['src/**/*.ts', 'test/**/*.ts'] }, null, 2) + '\n');
  await writeFile(join(destination, 'cordis.patch.yml'), `- insert:\n    - id: ${name}\n      name: '@lightjunction/${name}'\n      config: {}\n`);
  await writeFile(join(destination, '.gitignore'), 'node_modules/\ndist/\n*.tgz\ncoverage/\n');
  await writeFile(join(destination, 'UPSTREAM.md'), `# Upstream\n\nBehavior port from ${upstream}.\n\nThis is an independent DSH implementation, not a drop-in Pi runtime adapter.\n`);
  for (const [from, to] of [['LICENSE', 'LICENSE'], ['templates/host.ts', 'test/host.ts'], ['templates/support.ts', 'src/support.ts'], ['templates/release.yml', '.github/workflows/release.yml']]) {
    await writeFile(join(destination, to), await readFile(join(root, from)));
  }
  // Resolve an independent release lock without installing dependencies or
  // allowing npm to select the parent workspace and update its lock instead.
  await exec('npm', ['install', '--package-lock-only', '--workspaces=false', '--ignore-scripts', '--no-audit', '--no-fund', '--include=dev', '--include=peer'], { cwd: destination });
  return destination;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [name, description, upstream] = process.argv.slice(2);
  if (!name || !description || !upstream) throw new Error('Usage: node scripts/new-plugin.mjs dsh-name "description" "upstream URL"');
  console.log(await scaffold({ name, description, upstream }));
}
