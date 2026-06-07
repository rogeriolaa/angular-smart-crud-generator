import { Injectable } from '@angular/core';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class ZipBuilderService {
  async buildZip(files: GeneratedFile[]): Promise<Blob> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    return zip.generateAsync({ type: 'blob' });
  }

  getDownloadUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokeDownloadUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
