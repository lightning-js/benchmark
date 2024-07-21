// @ts-nocheck - Shelljs has no types, so it trips up the TypeScript compiler
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import shell from 'shelljs';

// get configuration
dotenv.config();

// lookup frameworks
const dirs = fs.readdirSync('./frameworks', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => process.env[name] === 'true');

if (dirs.length === 0) {
    console.error('No frameworks to build, please ensure you have at least one framework enabled in the .env file');
    process.exit(1);
}

// clear dist
shell.rm('-rf', 'dist');
shell.mkdir('dist');

// build & copy
dirs.forEach((name) => {
  console.log('Building', name, '...');
  shell.cd(`frameworks/${name}`);
  shell.exec('npm install');
  shell.exec('npm run dist');
  shell.cp('-r', 'dist', `../../dist/${name}`);
  shell.cd('../..');
});
