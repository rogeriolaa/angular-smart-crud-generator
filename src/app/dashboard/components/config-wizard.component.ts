import { Component, computed, output, signal } from '@angular/core';
import { GeneratorContext, UIFramework, StateManagement, FormType } from '../../core/models';

@Component({
  selector: 'app-config-wizard',
  template: `
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-stone-500 mb-1.5">UI Framework</label>
        <select
          [value]="context().uiFramework"
          (change)="update('uiFramework', $event)"
          class="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        >
          <option value="raw">Raw HTML (Tailwind)</option>
          <option value="material">Angular Material</option>
          <option value="primeng">PrimeNG</option>
          <option value="bootstrap">Bootstrap</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-stone-500 mb-1.5">State</label>
          <select
            [value]="context().stateManagement"
            (change)="update('stateManagement', $event)"
            class="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          >
            <option value="signals">Signals</option>
            <option value="signal-store">Signal Store</option>
            <option value="component-store">Component Store</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-stone-500 mb-1.5">Angular</label>
          <select
            [value]="context().angularVersion"
            (change)="update('angularVersion', $event)"
            class="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          >
            <option value="21">Angular 21+</option>
            <option value="20">Angular 20</option>
            <option value="19">Angular 19</option>
            <option value="18">Angular 18</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-stone-500 mb-1.5">Form Type</label>
        <select
          [value]="context().formType"
          (change)="update('formType', $event)"
          class="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        >
          <option value="reactive">Reactive Forms</option>
          <option value="dynamic">Dynamic Forms</option>
          @if (signalFormsAvailable()) {
            <option value="signal">Signal Forms</option>
          }
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-stone-500 mb-1.5">API Base URL</label>
        <input
          type="text"
          [value]="context().apiBaseUrl"
          (input)="update('apiBaseUrl', $event)"
          placeholder="/api"
          class="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        />
        <p class="text-xs text-stone-400 mt-1.5">
          Base path: <code class="bg-stone-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">{{ context().apiBaseUrl || '/api' }}/&#123;entity&#125;</code>
        </p>
      </div>
    </div>
  `,
})
export class ConfigWizardComponent {
  readonly contextChange = output<GeneratorContext>();

  protected readonly context = signal<GeneratorContext>({
    uiFramework: UIFramework.Raw,
    stateManagement: StateManagement.Signals,
    formType: FormType.Reactive,
    angularVersion: '21',
    apiBaseUrl: '',
    selectedEntities: [],
  });

  protected readonly signalFormsAvailable = computed(() => Number(this.context().angularVersion) >= 21);

  update(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.context.update(ctx => {
      const updated = { ...ctx, [field]: value };
      if (field === 'angularVersion' && Number(value) < 21 && updated.formType === FormType.Signal) {
        updated.formType = FormType.Reactive;
      }
      return updated;
    });
    this.contextChange.emit(this.context());
  }
}
