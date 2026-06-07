import { Component, inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-url-import',
  template: `
    <div>
      <div class="flex gap-2">
        <input
          #urlInput
          type="url"
          placeholder="https://example.com/swagger.json"
          class="flex-1 px-3.5 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          [disabled]="disabled()"
        />
        <button
          (click)="fetchUrl(urlInput.value)"
          [disabled]="disabled() || loading()"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          @if (loading()) {
            <svg class="animate-spin size-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          }
          {{ loading() ? 'Fetching...' : 'Fetch' }}
        </button>
      </div>
      @if (error()) {
        <p class="text-xs text-red-600 mt-2 flex items-center gap-1">
          <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ error() }}
        </p>
      }
    </div>
  `,
})
export class UrlImportComponent {
  private readonly http = inject(HttpClient);

  readonly disabled = input(false);
  readonly urlContent = output<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  fetchUrl(url: string): void {
    if (!url) return;
    this.loading.set(true);
    this.error.set(null);

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (content) => {
        this.urlContent.emit(content);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status ? `HTTP ${err.status}: ${err.statusText}` : 'Failed to fetch URL');
        this.loading.set(false);
      },
    });
  }
}
