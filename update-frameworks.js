import { execSync } from 'child_process';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRAMEWORKS_DIR = join(__dirname, 'frameworks');

const frameworkDirs = readdirSync(FRAMEWORKS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => join(FRAMEWORKS_DIR, d.name));

let totalUpdated = 0;

for (const frameworkDir of frameworkDirs) {
    const name = basename(frameworkDir);
    const pkgPath = join(frameworkDir, 'package.json');

    if (!existsSync(pkgPath)) {
        console.log(`Skipping ${name} — no package.json`);
        continue;
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    // Collect @lightningjs/* packages, excluding file: local paths
    const lightningProdDeps = Object.entries(deps)
        .filter(([n, v]) => n.startsWith('@lightningjs/') && !v.startsWith('file:'))
        .map(([n]) => n);

    const lightningDevDeps = Object.entries(devDeps)
        .filter(([n, v]) => n.startsWith('@lightningjs/') && !v.startsWith('file:'))
        .map(([n]) => n);

    if (lightningProdDeps.length === 0 && lightningDevDeps.length === 0) {
        console.log(`Skipping ${name} — no @lightningjs packages`);
        continue;
    }

    console.log(`\n[${name}]`);

    if (lightningProdDeps.length > 0) {
        const pkgArgs = lightningProdDeps.map(p => `${p}@latest`).join(' ');
        console.log(`  Installing (prod): ${pkgArgs}`);
        execSync(`npm install --save-exact ${pkgArgs}`, {
            cwd: frameworkDir,
            stdio: 'inherit',
        });
    }

    if (lightningDevDeps.length > 0) {
        const pkgArgs = lightningDevDeps.map(p => `${p}@latest`).join(' ');
        console.log(`  Installing (dev): ${pkgArgs}`);
        execSync(`npm install --save-dev --save-exact ${pkgArgs}`, {
            cwd: frameworkDir,
            stdio: 'inherit',
        });
    }

    // Read back installed versions and report changes
    const updatedPkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    for (const pkgName of [...lightningProdDeps, ...lightningDevDeps]) {
        const oldVer = deps[pkgName] ?? devDeps[pkgName];
        const newVer = updatedPkg.dependencies?.[pkgName] ?? updatedPkg.devDependencies?.[pkgName];
        if (oldVer !== newVer) {
            console.log(`  ${pkgName}: ${oldVer} -> ${newVer}`);
        } else {
            console.log(`  ${pkgName}: already at latest (${newVer})`);
        }
    }

    totalUpdated++;
}

console.log(`\nDone. Updated ${totalUpdated} framework(s).`);
