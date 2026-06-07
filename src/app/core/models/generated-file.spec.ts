import { describe, it, expect } from 'vitest';
import { GeneratedFile } from './generated-file';

describe('GeneratedFile', () => {
  it('holds path and content', () => {
    const file: GeneratedFile = {
      path: 'models/pet.ts',
      content: 'export interface Pet { id: number; }',
    };
    expect(file.path).toBe('models/pet.ts');
    expect(file.content).toContain('export interface Pet');
  });
});
