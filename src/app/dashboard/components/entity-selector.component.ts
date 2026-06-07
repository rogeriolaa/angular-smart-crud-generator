import { Component, input, output } from '@angular/core';
import { EntityDefinition } from '../../core/models';

@Component({
  selector: 'app-entity-selector',
  template: `
    <div class="space-y-0.5 max-h-64 overflow-y-auto">
      @for (entity of entities(); track entity.name) {
        <label
          class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-indigo-50/50 transition-colors"
          [class.bg-indigo-50]="isSelected(entity.name)"
        >
          <input
            type="checkbox"
            [checked]="isSelected(entity.name)"
            (change)="toggle(entity.name)"
            class="size-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
          />
          <span class="text-sm text-stone-700 font-medium flex-1">{{ entity.name }}</span>
          <span class="text-xs text-stone-400">({{ entity.fields.length }} fields)</span>
        </label>
      }
    </div>

    <div class="flex gap-4 mt-3 pt-3 border-t border-stone-100">
      <button (click)="selectAll()" class="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">Select all</button>
      <button (click)="deselectAll()" class="text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors">Deselect all</button>
    </div>
  `,
})
export class EntitySelectorComponent {
  readonly entities = input<EntityDefinition[]>([]);
  readonly selectionChange = output<string[]>();

  protected selected = new Set<string>();

  isSelected(name: string): boolean {
    return this.selected.has(name);
  }

  toggle(name: string): void {
    if (this.selected.has(name)) {
      this.selected.delete(name);
    } else {
      this.selected.add(name);
    }
    this.emit();
  }

  selectAll(): void {
    this.selected = new Set(this.entities().map(e => e.name));
    this.emit();
  }

  deselectAll(): void {
    this.selected = new Set<string>();
    this.emit();
  }

  private emit(): void {
    this.selectionChange.emit(Array.from(this.selected));
  }
}
