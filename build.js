import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { execSync } from 'child_process';

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
execSync('rm -rf dist', { shell: true  });
execSync('mkdir dist', { shell: true  });

// build & copy
dirs.forEach((name) => {
  console.log('Building', name, '...');
  execSync(`cd frameworks/${name} && npm install && npm run dist`, { shell: true  });
  execSync(`cp -r frameworks/${name}/dist dist/${name}`);
});
