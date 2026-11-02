// Fails the build when any image in src/ or public/ carries GPS location (phone
// photos usually do) or is in a format browsers can't display. Runs before
// `astro build`, so Cloudflare refuses to publish such a file.
//   node scripts/check-images.mjs [root=.]
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';

const root = path.resolve(process.argv[2] ?? '.');
const SCAN = ['src', 'public'];
const SKIP = new Set(['node_modules', 'dist', '.astro']);
const CHECKED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const UNSUPPORTED = new Set(['.heic', '.heif', '.tif', '.tiff']);

// exifr doesn't read WebP, so pull the EXIF chunk out of the RIFF container and
// hand exifr the TIFF data inside it. Returns null when the file has no EXIF;
// throws when the file isn't a WebP at all.
function webpExif(buf) {
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP file');
  }
  for (let at = 12; at + 8 <= buf.length; ) {
    const id = buf.toString('latin1', at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === 'EXIF') {
      const data = buf.subarray(at + 8, at + 8 + size);
      return data.toString('latin1', 0, 6) === 'Exif\0\0' ? data.subarray(6) : data;
    }
    at += 8 + size + (size & 1);
  }
  return null;
}

async function gpsOf(file, ext) {
  if (ext !== '.webp') return exifr.gps(file);
  const exif = webpExif(await readFile(file));
  return exif ? exifr.gps(exif) : null;
}

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
      // A file whose metadata can't be read fails: it might be hiding a location.
      let gps;
      try {
        gps = await gpsOf(file, ext);
      } catch {
        problems.push(`Could not read metadata: ${rel}`);
        continue;
      }
      if (gps && Number.isFinite(gps.latitude)) problems.push(`GPS location found: ${rel}`);
    }
  }
}

if (problems.length > 0) {
  console.log(problems.join('\n'));
  console.log('\nRemove location data (re-export or upload through /admin, which converts to WebP) and try again.');
  process.exit(1);
}
