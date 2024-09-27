const { existsSync, mkdirSync, copyFileSync } = require('fs');
const { join } = require('path');

const srcPath = join(__dirname, 'src/storage/data/connections.json');
const destDir = join(__dirname, 'dist/storage/data');

if (!existsSync(destDir)){
  mkdirSync(destDir, { recursive: true });
}

copyFileSync(srcPath, join(destDir, 'connections.json'));

console.log('Arquivo connections.json copiado com sucesso!');
