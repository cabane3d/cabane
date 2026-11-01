import * as Y from 'yjs';
import { type Mm, mm } from '../units';

/**
 * Layout of the project's Yjs document (ADR-0004). Only `core` reads and writes these
 * structures; everything else goes through commands and the typed read model.
 *
 * ```
 * project (Y.Map)
 *   schemaVersion: number
 *   wallDefaults (Y.Map): thickness, height        (mm)
 *   levels (Y.Array of Y.Map): id, name, elevation (mm), height (mm), elements (Y.Array)
 * ```
 */

/** Version of the document layout above; bumped with a migration on every breaking change. */
export const SCHEMA_VERSION = 1;

const ROOT = 'project';

export type YRecord = Y.Map<unknown>;

export function getRoot(doc: Y.Doc): YRecord {
  return doc.getMap(ROOT);
}

class SchemaError extends Error {
  override name = 'SchemaError';
}

export function readString(record: YRecord, key: string): string {
  const value = record.get(key);
  if (typeof value !== 'string') throw new SchemaError(`Expected a string at "${key}"`);
  return value;
}

export function readLength(record: YRecord, key: string): Mm {
  const value = record.get(key);
  if (typeof value !== 'number') throw new SchemaError(`Expected a length at "${key}"`);
  return mm(value);
}

export function readRecord(record: YRecord, key: string): YRecord {
  const value = record.get(key);
  if (!(value instanceof Y.Map)) throw new SchemaError(`Expected a map at "${key}"`);
  return value;
}

export function readRecords(record: YRecord, key: string): Y.Array<YRecord> {
  const value = record.get(key);
  if (!(value instanceof Y.Array)) throw new SchemaError(`Expected a list at "${key}"`);
  for (const item of value) {
    if (!(item instanceof Y.Map)) throw new SchemaError(`Expected a list of maps at "${key}"`);
  }
  return value;
}

export function createRecord(entries: Readonly<Record<string, unknown>>): YRecord {
  const record: YRecord = new Y.Map();
  for (const [key, value] of Object.entries(entries)) record.set(key, value);
  return record;
}
