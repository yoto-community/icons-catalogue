/**
 * Copie la feuille de style de l'éditeur dans `dist/`, à côté du JavaScript
 * compilé. Elle est exposée via l'export `./styles.css` du paquet.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await mkdir(resolve(packageRoot, 'dist'), { recursive: true });
await copyFile(resolve(packageRoot, 'src/styles.css'), resolve(packageRoot, 'dist/styles.css'));
