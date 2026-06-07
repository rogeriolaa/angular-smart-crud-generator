import { Component, inject, input, signal } from '@angular/core';
import { GeneratedFile } from '../../core/models';
import { ZipBuilderService } from '../../core/services/zip-builder.service';

@Component({
  selector: 'app-output-panel',
  template: `
    <div class="bg-white rounded-xl border border-stone-200 shadow-sm flex-1 flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b border-stone-100 bg-stone-50 shrink-0">
        <div class="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <svg class="size-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generated Files
          <span class="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full ml-1">{{ files().length }}</span>
        </div>
        <button
          (click)="downloadZip()"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
        >
          <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 12m4-4v12" />
          </svg>
          Download ZIP
        </button>
      </div>

      <div class="flex flex-col sm:flex-row flex-1 min-h-0">
        <div class="sm:w-2/5 border-b sm:border-b-0 sm:border-r border-stone-100 overflow-y-auto bg-stone-50">
          @for (file of files(); track file.path) {
            <button
              (click)="selectedFile.set(file)"
              class="w-full text-left px-4 py-2.5 text-xs font-mono text-stone-600 hover:bg-indigo-50/50 transition-colors border-b border-stone-100 last:border-b-0"
              [class.bg-indigo-50]="selectedFile()?.path === file.path"
              [class.text-indigo-700]="selectedFile()?.path === file.path"
              [class.font-medium]="selectedFile()?.path === file.path"
            >
              <div class="flex items-center gap-2">
                <svg class="size-3.5 shrink-0 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="truncate">{{ file.path }}</span>
              </div>
            </button>
          }
        </div>
        <div class="sm:w-3/5 p-0 overflow-auto">
          @if (selectedFile(); as file) {
            <pre class="text-xs font-mono leading-relaxed whitespace-pre-wrap p-5 text-stone-700 bg-white">{{ file.content }}</pre>
          } @else {
            <div class="flex flex-col items-center justify-center h-full py-12 text-center px-4 bg-stone-50/50">
              <svg class="size-8 text-stone-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p class="text-stone-400 text-sm">Select a file to preview</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class OutputPanelComponent {
  private readonly zipBuilder = inject(ZipBuilderService);

  readonly files = input<GeneratedFile[]>([]);
  protected readonly selectedFile = signal<GeneratedFile | null>(null);

  async downloadZip(): Promise<void> {
    const blob = await this.zipBuilder.buildZip(this.files());
    const url = this.zipBuilder.getDownloadUrl(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-code.zip';
    a.click();
    this.zipBuilder.revokeDownloadUrl(url);
  }
}
