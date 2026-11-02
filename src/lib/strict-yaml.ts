import { parse } from 'yaml';

export interface YamlEntry {
  id: string;
  [key: string]: unknown;
}

/**
 * Parse a YAML list of entries and fail loudly on anything that would make an
 * entry silently disappear: invalid YAML, a non-list file, a missing id, or a
 * duplicate id. `label` names the file in error messages.
 */
export function parseYamlList(text: string, label: string): YamlEntry[] {
  let data: unknown;
  try {
    data = parse(text);
  } catch (error) {
    throw new Error(`${label}: invalid YAML. ${(error as Error).message}`);
  }
  if (!Array.isArray(data)) {
    throw new Error(`${label}: expected a list of entries (each line starting with "- id: …")`);
  }

  const seen = new Set<string>();
  return data.map((item: unknown, index: number) => {
    const position = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${label}: entry ${position} is not a set of fields`);
    }
    const raw = (item as Record<string, unknown>).id;
    const id = raw == null ? '' : String(raw).trim();
    if (!id) {
      throw new Error(`${label}: entry ${position} has no id (${JSON.stringify(item).slice(0, 80)})`);
    }
    if (seen.has(id)) {
      throw new Error(`${label}: duplicate id "${id}" (entry ${position})`);
    }
    seen.add(id);
    return { ...(item as Record<string, unknown>), id };
  });
}
