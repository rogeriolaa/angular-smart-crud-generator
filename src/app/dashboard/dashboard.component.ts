import { Component, inject, signal } from '@angular/core';
import { OpenApiParserService } from '../core/services/openapi-parser.service';
import { MetadataEngineService } from '../core/services/metadata-engine.service';
import { GeneratorOrchestratorService } from '../core/services/generator-orchestrator.service';
import { ZipBuilderService } from '../core/services/zip-builder.service';
import {
  EntityDefinition,
  GeneratedFile,
  GeneratorContext,
  UIFramework,
  StateManagement,
  FormType,
} from '../core/models';
import { FileUploadComponent } from './components/file-upload.component';
import { UrlImportComponent } from './components/url-import.component';
import { EntitySelectorComponent } from './components/entity-selector.component';
import { ConfigWizardComponent } from './components/config-wizard.component';
import { OutputPanelComponent } from './components/output-panel.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    FileUploadComponent,
    UrlImportComponent,
    EntitySelectorComponent,
    ConfigWizardComponent,
    OutputPanelComponent,
  ],
  template: `
    <div class="min-h-screen bg-stone-50">
      <header class="sticky top-0 z-10 bg-white border-b border-stone-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div class="flex items-center gap-3">
            <div
              class="px-2 py-4 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-xs shrink-0"
            >
              ASCG
            </div>
            <div class="min-w-0">
              <h1 class="text-base sm:text-lg font-semibold text-stone-900 tracking-tight truncate">
                Angular Smart CRUD Generator
              </h1>
              <p class="text-sm text-stone-500 leading-tight hidden sm:block">
                Import an OpenAPI specification to generate Angular CRUD code
              </p>
            </div>
          </div>
        </div>
      </header>

      @if (error()) {
        <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div
            class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
          >
            <svg
              class="size-5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="flex-1">{{ error() }}</span>
            <button
              (click)="error.set(null)"
              class="text-red-500 hover:text-red-700 font-bold leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      }

      <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <aside class="w-full lg:w-5/12 xl:w-4/12 space-y-6 lg:sticky lg:top-16 lg:self-start">
            <div class="bg-white rounded-xl border border-stone-200 shadow-sm">
              <div class="px-5 py-3 border-b border-stone-100">
                <h2 class="text-sm font-semibold text-stone-800">Import OpenAPI Spec</h2>
              </div>
              <div class="p-5 space-y-4">
                <app-file-upload (fileSelected)="onFileSelected($event)" />

                <div class="flex items-center gap-3">
                  <span class="h-px flex-1 bg-stone-100"></span>
                  <span class="text-xs text-stone-400 font-medium">or enter URL</span>
                  <span class="h-px flex-1 bg-stone-100"></span>
                </div>

                <app-url-import (urlContent)="onUrlContent($event)" [disabled]="loading()" />
              </div>
            </div>

            @if (entities().length > 0) {
              <div class="bg-white rounded-xl border border-stone-200 shadow-sm">
                <div class="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
                  <h2 class="text-sm font-semibold text-stone-800">Entities</h2>
                  <span
                    class="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-medium"
                    >{{ entities().length }} found</span
                  >
                </div>
                <div class="p-5">
                  <app-entity-selector
                    [entities]="entities()"
                    (selectionChange)="selectedEntities.set($event)"
                  />
                </div>
              </div>

              <div class="bg-white rounded-xl border border-stone-200 shadow-sm">
                <div class="px-5 py-3 border-b border-stone-100">
                  <h2 class="text-sm font-semibold text-stone-800">Configuration</h2>
                </div>
                <div class="p-5">
                  <app-config-wizard (contextChange)="context.set($event)" />
                </div>
              </div>

              <button
                (click)="generate()"
                [disabled]="loading()"
                class="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98] duration-150"
              >
                @if (loading()) {
                  <svg class="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                }
                {{ loading() ? 'Generating...' : 'Generate Code' }}
              </button>
            }
          </aside>

          <section class="w-full lg:w-7/12 xl:w-8/12 flex flex-col min-h-[400px]">
            @if (files().length > 0) {
              <app-output-panel [files]="files()" />
            } @else {
              <div
                class="flex flex-col items-center justify-center flex-1 p-12 text-center bg-white rounded-xl border-2 border-dashed border-stone-200"
              >
                <div class="size-14 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                  <svg
                    class="size-7 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p class="text-stone-600 font-medium text-sm">No generated code yet</p>
                <p class="text-stone-400 text-xs mt-1.5 max-w-xs">
                  Upload or fetch an OpenAPI spec, configure your options, then click
                  <span class="font-medium text-stone-500">Generate</span>
                </p>
              </div>
            }
          </section>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  private readonly parser = inject(OpenApiParserService);
  private readonly metadataEngine = inject(MetadataEngineService);
  private readonly orchestrator = inject(GeneratorOrchestratorService);
  private readonly zipBuilder = inject(ZipBuilderService);

  protected readonly entities = signal<EntityDefinition[]>([]);
  protected readonly selectedEntities = signal<string[]>([]);
  protected readonly context = signal<GeneratorContext>({
    uiFramework: UIFramework.Raw,
    stateManagement: StateManagement.Signals,
    formType: FormType.Reactive,
    angularVersion: '21',
    apiBaseUrl: '',
    selectedEntities: [],
  });
  protected readonly files = signal<GeneratedFile[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  private rawSpec: string | null = null;

  onFileSelected(content: string): void {
    this.rawSpec = content;
    this.parseSpec();
  }

  onUrlContent(content: string): void {
    this.rawSpec = content;
    this.parseSpec();
  }

  private parseSpec(): void {
    if (!this.rawSpec) return;
    this.loading.set(true);
    this.error.set(null);
    this.files.set([]);

    try {
      const parsed = this.parser.parse(this.rawSpec);
      if (parsed.errors.length > 0) {
        this.error.set(parsed.errors.join('; '));
        this.entities.set([]);
        this.loading.set(false);
        return;
      }

      const entityDefs = this.metadataEngine.build(parsed);
      this.entities.set(entityDefs);
      this.selectedEntities.set(entityDefs.map((e) => e.name));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to parse specification');
      this.entities.set([]);
    }

    this.loading.set(false);
  }

  generate(): void {
    if (!this.rawSpec) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      const ctx: GeneratorContext = {
        ...this.context(),
        selectedEntities: this.selectedEntities(),
      };
      const result = this.orchestrator.generate(this.rawSpec, ctx);
      if (result.errors.length > 0) {
        this.error.set(result.errors.join('; '));
        this.files.set([]);
      } else {
        this.files.set(result.files);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Generation failed');
      this.files.set([]);
    }

    this.loading.set(false);
  }
}
