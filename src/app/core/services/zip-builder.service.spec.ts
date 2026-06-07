import { describe, it, expect } from 'vitest';
import { ZipBuilderService } from './zip-builder.service';
import { GeneratedFile } from '../models';

describe('ZipBuilderService', () => {
  const service = new ZipBuilderService();

  describe('buildZip', () => {
    it('returns a Blob with ZIP MIME type', async () => {
      const files: GeneratedFile[] = [
        { path: 'test.txt', content: 'hello' },
      ];
      const blob = await service.buildZip(files);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/zip');
    });

    it('handles multiple files', async () => {
      const files: GeneratedFile[] = [
        { path: 'a.txt', content: 'aaa' },
        { path: 'b.txt', content: 'bbb' },
      ];
      const blob = await service.buildZip(files);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles empty file array', async () => {
      const blob = await service.buildZip([]);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles files with nested paths', async () => {
      const files: GeneratedFile[] = [
        { path: 'models/pet.ts', content: 'export interface Pet {}' },
        { path: 'services/pet.service.ts', content: 'export class PetService {}' },
      ];
      const blob = await service.buildZip(files);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('getDownloadUrl', () => {
    it('returns a blob URL', () => {
      const blob = new Blob(['test'], { type: 'application/zip' });
      const url = service.getDownloadUrl(blob);
      expect(url).toMatch(/^blob:/);
    });
  });

  describe('revokeDownloadUrl', () => {
    it('does not throw', () => {
      const blob = new Blob(['test'], { type: 'application/zip' });
      const url = service.getDownloadUrl(blob);
      expect(() => service.revokeDownloadUrl(url)).not.toThrow();
    });
  });
});
