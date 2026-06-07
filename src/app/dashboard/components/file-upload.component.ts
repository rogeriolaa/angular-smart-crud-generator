import { Component, output } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  template: `
    <div
      class="relative bg-stone-50 rounded-xl border-2 border-dashed border-stone-200 px-6 py-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group"
      (click)="fileInput.click()"
      (dragover)="$event.preventDefault()"
      (drop)="onDrop($event)"
      tabindex="0"
      role="button"
      aria-label="Upload OpenAPI file"
      (keydown.enter)="fileInput.click()"
    >
      <input #fileInput type="file" accept=".json,.yaml,.yml" class="hidden" (change)="onFileChange($event)" />

      <div class="size-12 rounded-xl bg-white group-hover:bg-indigo-50 flex items-center justify-center mx-auto mb-3 transition-colors shadow-sm">
        <svg class="size-6 text-stone-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p class="text-stone-700 font-medium text-sm group-hover:text-indigo-700 transition-colors">
        Drop your OpenAPI file here, or <span class="text-indigo-600 underline underline-offset-2 decoration-indigo-300">browse</span>
      </p>
      <p class="text-stone-400 text-xs mt-1.5">Supports JSON and YAML &middot; OpenAPI 3.0 / 3.1</p>
    </div>
  `,
})
export class FileUploadComponent {
  readonly fileSelected = output<string>();

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.readFile(file);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.readFile(file);
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.fileSelected.emit(reader.result);
      }
    };
    reader.readAsText(file);
  }
}
