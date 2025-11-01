import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distRoot = resolve('dist', 'atualizacaoMonetaria', 'browser');
const csrIndex = resolve(distRoot, 'index.csr.html');
const targets = [
  resolve(distRoot, 'index.html'),
  resolve(distRoot, '404.html')
];
const redirectsFile = resolve(distRoot, '_redirects');

if (!existsSync(csrIndex)) {
  console.error(`Could not find ${csrIndex}. Did the Angular build complete successfully?`);
  process.exit(1);
}

for (const target of targets) {
  copyFileSync(csrIndex, target);
}

if (!existsSync(redirectsFile)) {
  writeFileSync(redirectsFile, '/* /index.html 200\n');
}

const relativePaths = [
  ...targets,
  redirectsFile
].map((target) => target.replace(`${process.cwd()}/`, ''));

console.log('Prepared Netlify publish assets:', relativePaths.join(', '));