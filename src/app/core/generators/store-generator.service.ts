import { Injectable } from '@angular/core';
import { EntityDefinition, CrudOperationType, StateManagement } from '../models';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class StoreGeneratorService {
  generateAll(entities: EntityDefinition[], storeType: StateManagement = StateManagement.SignalStore): GeneratedFile[] {
    return entities.map(entity => ({
      path: `stores/${this.camelCase(entity.name)}.store.ts`,
      content: this.generateStore(entity, storeType),
    }));
  }

  generateStore(entity: EntityDefinition, storeType: StateManagement = StateManagement.SignalStore): string {
    if (storeType === StateManagement.ComponentStore) {
      return this.generateComponentStore(entity);
    }
    return this.generateSignalStore(entity);
  }

  private generateSignalStore(entity: EntityDefinition): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const lines: string[] = [];

    const getAll = entity.endpoints.find(e => e.crudType === CrudOperationType.GetAll);
    const getById = entity.endpoints.find(e => e.crudType === CrudOperationType.GetById);
    const create = entity.endpoints.find(e => e.crudType === CrudOperationType.Create);
    const update = entity.endpoints.find(e => e.crudType === CrudOperationType.Update);
    const del = entity.endpoints.find(e => e.crudType === CrudOperationType.Delete);

    const idParam = (getById ?? update ?? del)?.parameters.find(p => p.in === 'path');

    lines.push(`import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';`);
    lines.push(`import { inject } from '@angular/core';`);
    lines.push(`import { ${name}Service } from '../services/${camelName}.service';`);
    lines.push(`import { ${name}, Create${name}, Update${name} } from '../models/${camelName}';`);
    lines.push(`import { Observable } from 'rxjs';`);
    lines.push('');

    lines.push(`interface ${name}State {`);
    lines.push(`  items: ${name}[];`);
    lines.push(`  selectedItem: ${name} | null;`);
    lines.push(`  loading: boolean;`);
    lines.push(`}`);
    lines.push('');

    lines.push(`const initialState: ${name}State = {`);
    lines.push(`  items: [],`);
    lines.push(`  selectedItem: null,`);
    lines.push(`  loading: false,`);
    lines.push(`};`);
    lines.push('');

    lines.push(`export const ${name}Store = signalStore(`);
    lines.push(`  { providedIn: 'root' },`);
    lines.push(`  withState(initialState),`);
    lines.push(`  withMethods((store, ${camelName}Service = inject(${name}Service)) => ({`);

    if (getAll) {
      lines.push(`    loadAll(): void {`);
      lines.push(`      ${camelName}Service.getAll().subscribe(items => patchState(store, { items }));`);
      lines.push(`    },`);
    }

    if (getById) {
      const idName = idParam?.name ?? 'id';
      lines.push(`    loadById(${idName}: ${this.mapType(idParam?.type ?? 'integer')}): void {`);
      lines.push(`      ${camelName}Service.getById(${idName}).subscribe(selectedItem => patchState(store, { selectedItem }));`);
      lines.push(`    },`);
    }

    if (create) {
      lines.push(`    create(data: Create${name}): Observable<${name}> {`);
      lines.push(`      return ${camelName}Service.create(data);`);
      lines.push(`    },`);
    }

    if (update) {
      const idName = idParam?.name ?? 'id';
      lines.push(`    update(${idName}: ${this.mapType(idParam?.type ?? 'integer')}, data: Update${name}): Observable<${name}> {`);
      lines.push(`      return ${camelName}Service.update(${idName}, data);`);
      lines.push(`    },`);
    }

    if (del) {
      const idName = idParam?.name ?? 'id';
      lines.push(`    delete(${idName}: ${this.mapType(idParam?.type ?? 'integer')}): Observable<void> {`);
      lines.push(`      return ${camelName}Service.delete(${idName});`);
      lines.push(`    },`);
    }

    lines.push(`  })),`);
    lines.push(`);`);
    lines.push('');

    return lines.join('\n');
  }

  private generateComponentStore(entity: EntityDefinition): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const lines: string[] = [];

    const getAll = entity.endpoints.find(e => e.crudType === CrudOperationType.GetAll);
    const getById = entity.endpoints.find(e => e.crudType === CrudOperationType.GetById);
    const create = entity.endpoints.find(e => e.crudType === CrudOperationType.Create);
    const update = entity.endpoints.find(e => e.crudType === CrudOperationType.Update);
    const del = entity.endpoints.find(e => e.crudType === CrudOperationType.Delete);

    const idParam = (getById ?? update ?? del)?.parameters.find(p => p.in === 'path');

    lines.push(`import { Injectable, inject } from '@angular/core';`);
    lines.push(`import { ComponentStore } from '@ngrx/component-store';`);
    lines.push(`import { toSignal } from '@angular/core/rxjs-interop';`);
    lines.push(`import { ${name}Service } from '../services/${camelName}.service';`);
    lines.push(`import { ${name}, Create${name}, Update${name} } from '../models/${camelName}';`);
    lines.push(`import { Observable, switchMap, tap } from 'rxjs';`);
    lines.push('');

    lines.push(`interface ${name}State {`);
    lines.push(`  items: ${name}[];`);
    lines.push(`  selectedItem: ${name} | null;`);
    lines.push(`  loading: boolean;`);
    lines.push(`}`);
    lines.push('');

    lines.push('@Injectable({ providedIn: \'root\' })');
    lines.push(`export class ${name}Store extends ComponentStore<${name}State> {`);
    lines.push(`  private readonly ${camelName}Service = inject(${name}Service);`);
    lines.push('');
    lines.push('  constructor() {');
    lines.push(`    super({ items: [], selectedItem: null, loading: false });`);
    lines.push('  }');
    lines.push('');

    lines.push(`  readonly items = toSignal(this.select(state => state.items), { initialValue: [] as ${name}[] });`);
    lines.push(`  readonly selectedItem = toSignal(this.select(state => state.selectedItem), { initialValue: null as ${name} | null });`);
    lines.push('');

    if (getAll) {
      const idName = idParam?.name ?? 'id';
      lines.push(`  readonly loadAll = this.effect<void>(trigger$ =>`);
      lines.push(`    trigger$.pipe(`);
      lines.push(`      switchMap(() => this.${camelName}Service.getAll()),`);
      lines.push(`      tap(items => this.patchState({ items })),`);
      lines.push(`    )`);
      lines.push(`  );`);
    }

    if (getById) {
      const idName = idParam?.name ?? 'id';
      lines.push(`  readonly loadById = this.effect<${this.mapType(idParam?.type ?? 'integer')}>(id$ =>`);
      lines.push(`    id$.pipe(`);
      lines.push(`      switchMap(${idName} => this.${camelName}Service.getById(${idName})),`);
      lines.push(`      tap(selectedItem => this.patchState({ selectedItem })),`);
      lines.push(`    )`);
      lines.push(`  );`);
    }

    if (create) {
      lines.push(`  create(data: Create${name}): Observable<${name}> {`);
      lines.push(`    return this.${camelName}Service.create(data);`);
      lines.push(`  }`);
    }

    if (update) {
      const idName = idParam?.name ?? 'id';
      const idType = this.mapType(idParam?.type ?? 'integer');
      lines.push(`  update(${idName}: ${idType}, data: Update${name}): Observable<${name}> {`);
      lines.push(`    return this.${camelName}Service.update(${idName}, data);`);
      lines.push(`  }`);
    }

    if (del) {
      const idName = idParam?.name ?? 'id';
      const idType = this.mapType(idParam?.type ?? 'integer');
      lines.push(`  delete(${idName}: ${idType}): Observable<void> {`);
      lines.push(`    return this.${camelName}Service.delete(${idName});`);
      lines.push(`  }`);
    }

    lines.push(`}`);
    lines.push('');

    return lines.join('\n');
  }

  private mapType(type: string): string {
    switch (type) {
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'string';
    }
  }

  private camelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }
}
