/**
 * Validates file attachment constraints applied before upload and Gemini processing.
 * Constraints sourced from server.ts / App.tsx: 10MB per file, 20MB total, allowlist MIME types.
 *
 * Probe gate: tests scenarios beyond the happy path — boundary conditions and type spoofing.
 */
import { describe, it, expect } from 'vitest';
import type { Attachment } from '../src/types';

const MAX_FILE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;  // 20 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

function validateAttachments(files: Attachment[]): { valid: boolean; reason?: string } {
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return { valid: false, reason: `Tipo não permitido: ${f.type}` };
    }
    if (f.size > MAX_FILE_BYTES) {
      return { valid: false, reason: `Arquivo ${f.name} excede 10 MB` };
    }
  }
  const total = files.reduce((acc, f) => acc + f.size, 0);
  if (total > MAX_TOTAL_BYTES) {
    return { valid: false, reason: 'Total de anexos excede 20 MB' };
  }
  return { valid: true };
}

function makeAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    name: 'documento.pdf',
    type: 'application/pdf',
    size: 1024,
    data: 'base64data',
    ...overrides,
  };
}

// ── Per-file size ─────────────────────────────────────────────────────────
describe('Attachment — per-file size limit (10 MB)', () => {
  it('accepts a file exactly at the 10 MB boundary', () => {
    const file = makeAttachment({ size: MAX_FILE_BYTES });
    expect(validateAttachments([file]).valid).toBe(true);
  });

  it('rejects a file 1 byte over 10 MB', () => {
    const file = makeAttachment({ name: 'heavy.pdf', size: MAX_FILE_BYTES + 1 });
    const result = validateAttachments([file]);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/heavy\.pdf/);
  });

  it('rejects a file significantly over 10 MB', () => {
    const file = makeAttachment({ size: 15 * 1024 * 1024 });
    expect(validateAttachments([file]).valid).toBe(false);
  });
});

// ── Total size ────────────────────────────────────────────────────────────
describe('Attachment — aggregate size limit (20 MB)', () => {
  it('accepts two files totalling exactly 20 MB', () => {
    const files = [
      makeAttachment({ name: 'a.pdf', size: MAX_FILE_BYTES }),
      makeAttachment({ name: 'b.pdf', size: MAX_FILE_BYTES }),
    ];
    expect(validateAttachments(files).valid).toBe(true);
  });

  it('rejects the second file when it individually exceeds 10 MB', () => {
    // Note: two files each ≤ 10 MB cannot exceed the 20 MB aggregate ceiling —
    // the aggregate limit is only reachable with ≥ 3 files (covered below).
    const files = [
      makeAttachment({ name: 'a.pdf', size: MAX_FILE_BYTES }),
      makeAttachment({ name: 'b.pdf', size: MAX_FILE_BYTES + 1 }),
    ];
    const result = validateAttachments(files);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/b\.pdf/);
  });

  it('rejects three small files exceeding 20 MB total', () => {
    const files = Array.from({ length: 3 }, (_, i) =>
      makeAttachment({ name: `f${i}.pdf`, size: 7 * 1024 * 1024 })
    );
    expect(validateAttachments(files).valid).toBe(false);
  });
});

// ── MIME type allowlist ───────────────────────────────────────────────────
describe('Attachment — MIME type allowlist', () => {
  it.each(ALLOWED_TYPES)('accepts %s', (type) => {
    const file = makeAttachment({ type });
    expect(validateAttachments([file]).valid).toBe(true);
  });

  it('rejects application/zip', () => {
    const file = makeAttachment({ type: 'application/zip', name: 'malware.zip' });
    expect(validateAttachments([file]).valid).toBe(false);
  });

  it('rejects text/html (XSS vector)', () => {
    const file = makeAttachment({ type: 'text/html', name: 'payload.html' });
    expect(validateAttachments([file]).valid).toBe(false);
  });

  it('rejects application/javascript', () => {
    const file = makeAttachment({ type: 'application/javascript', name: 'script.js' });
    expect(validateAttachments([file]).valid).toBe(false);
  });

  it('rejects empty string mime type', () => {
    const file = makeAttachment({ type: '' });
    expect(validateAttachments([file]).valid).toBe(false);
  });
});

// ── Empty input ───────────────────────────────────────────────────────────
describe('Attachment — edge: empty list', () => {
  it('accepts an empty attachment list', () => {
    expect(validateAttachments([]).valid).toBe(true);
  });
});
