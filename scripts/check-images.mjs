// Fails the build when any image in src/ or public/ carries GPS location (phone
// photos usually do) or is in a format browsers can't display. Runs before
// `astro build`, so Cloudflare refuses to publish such a file.
//   node scripts/check-images.mjs [root=.]
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';

const root = path.resolve(process.argv[2] ?? '.');
const SCAN = ['src', 'public'];
const SKIP = new Set(['node_modules', 'dist', '.astro']);
const CHECKED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const UNSUPPORTED = new Set(['.heic', '.heif', '.tif', '.tiff']);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const problems = [];
for (const top of SCAN) {
  for await (const file of walk(path.join(root, top))) {
    const ext = path.extname(file).toLowerCase();
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (UNSUPPORTED.has(ext)) {
      problems.push(`Unsupported format (use JPEG/PNG/WebP): ${rel}`);
    } else if (CHECKED.has(ext)) {
      const gps = await exifr.gps(file).catch(() => null);
      if (gps && Number.isFinite(gps.latitude)) problems.push(`GPS location found: ${rel}`);
    }
  }
}

if (problems.length > 0) {
  console.log(problems.join('\n'));
  console.log('\nRemove location data (re-export or upload through /admin, which converts to WebP) and try again.');
  process.exit(1);
}
