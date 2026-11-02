import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';
import { parseYamlList } from './strict-yaml';

/**
 * Content loader for a YAML list file (path relative to the project root).
 * Unlike Astro's built-in `file()` loader, which logs and skips bad entries,
 * this one fails the build on invalid YAML, a missing id or a duplicate id.
 * In `astro dev` it reloads when the file changes.
 */
export function yamlList(relativePath: string): Loader {
  return {
    name: 'strict-yaml-list',
    async load({ config, store, parseData, watcher, logger }) {
      const filePath = fileURLToPath(new URL(relativePath, config.root));

      const sync = async () => {
        const entries = parseYamlList(await readFile(filePath, 'utf8'), relativePath);
        store.clear();
        for (const entry of entries) {
          const data = await parseData({ id: entry.id, data: entry });
          store.set({ id: entry.id, data, filePath: relativePath });
        }
      };

      await sync();

      watcher?.add(filePath);
      watcher?.on('change', async (changed) => {
        if (changed !== filePath) return;
        try {
          await sync();
        } catch (error) {
          logger.error((error as Error).message);
        }
      });
    },
  };
}
