import { Injectable } from '@angular/core';
import { EntityDefinition, FieldDefinition, CrudOperationType, UIFramework, StateManagement, FormType } from '../models';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class ComponentGeneratorService {
  generateAll(entities: EntityDefinition[], uiFramework = UIFramework.Raw, stateManagement = StateManagement.Signals, formType = FormType.Reactive): GeneratedFile[] {
    return entities.flatMap(entity => [
      this.generateList(entity, uiFramework, stateManagement),
      this.generateCreate(entity, uiFramework, stateManagement, formType),
      this.generateEdit(entity, uiFramework, stateManagement, formType),
      this.generateDetails(entity, uiFramework, stateManagement),
    ]);
  }

  private generateList(entity: EntityDefinition, uiFramework: UIFramework, stateManagement: StateManagement): GeneratedFile {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const displayFields = entity.fields.filter(f => !f.isAudit && !f.isSoftDelete && f.name !== 'id');

    const listHtml = this.listTemplate(name, camelName, displayFields, uiFramework);

    const useStore = stateManagement === StateManagement.SignalStore || stateManagement === StateManagement.ComponentStore;
    const noState = stateManagement === StateManagement.None;

    const imports = [
      `import { Component, inject${useStore || noState ? '' : ', signal'} } from '@angular/core';`,
      `import { RouterLink } from '@angular/router';`,
      ...(uiFramework === UIFramework.Material ? [`import { MatTableModule } from '@angular/material/table';`] : []),
      ...(uiFramework === UIFramework.PrimeNG ? [`import { TableModule } from 'primeng/table';`] : []),
      useStore
        ? `import { ${name}Store } from '../../stores/${camelName}.store';`
        : noState
        ? ''
        : `import { ${name}Service } from '../../services/${camelName}.service';`,
      noState ? '' : `import { ${name} } from '../../models/${camelName}';`,
    ].filter(Boolean);

    const body = noState
      ? [
          `  protected readonly columns = [${displayFields.map(f => `'${f.name}'`).join(', ')}];`,
        ]
      : useStore
      ? [
          `  private readonly store = inject(${name}Store);`,
          `  protected readonly items = this.store.items;`,
          `  protected readonly columns = [${displayFields.map(f => `'${f.name}'`).join(', ')}];`,
          '',
          `  constructor() {`,
          `    this.store.loadAll();`,
          `  }`,
        ]
      : [
          `  private readonly service = inject(${name}Service);`,
          `  protected readonly items = signal<${name}[]>([]);`,
          `  protected readonly columns = [${displayFields.map(f => `'${f.name}'`).join(', ')}];`,
          '',
          `  constructor() {`,
          `    this.service.getAll().subscribe(items => this.items.set(items));`,
          `  }`,
        ];

    const ts = [
      ...imports,
      '',
      '@Component({',
      `  selector: 'app-${this.kebabCase(name)}-list',`,
      `  imports: [RouterLink${uiFramework === UIFramework.Material ? ', MatTableModule' : ''}${uiFramework === UIFramework.PrimeNG ? ', TableModule' : ''}],`,
      `  template: \`${this.escapeHtml(listHtml)}\`,`,
      `})`,
      `export class ${name}ListComponent {`,
      ...body,
      `}`,
      '',
    ].join('\n');

    return { path: `components/${camelName}-list/${camelName}-list.component.ts`, content: ts };
  }

  private generateCreate(entity: EntityDefinition, uiFramework: UIFramework, stateManagement: StateManagement, formType: FormType): GeneratedFile {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const formFields = entity.fields.filter(f => !f.isPrimaryKey && !f.isAudit && !f.isSoftDelete);
    const useSignalForms = formType === FormType.Signal;

    const html = this.createFormHtml(name, formFields, uiFramework, useSignalForms);
    const useStore = stateManagement === StateManagement.SignalStore || stateManagement === StateManagement.ComponentStore;
    const noState = stateManagement === StateManagement.None;

    const formModuleImport = useSignalForms
      ? `import { FormField } from '@angular/forms/signals';`
      : `import { ReactiveFormsModule } from '@angular/forms';`;

    const imports = [
      `import { Component${useStore || noState ? '' : ', inject, signal'} } from '@angular/core';`,
      ...(noState ? [] : [formModuleImport, `import { RouterLink, Router } from '@angular/router';`]),
      ...(uiFramework === UIFramework.Material ? [`import { MatInputModule } from '@angular/material/input';`, `import { MatButtonModule } from '@angular/material/button';`, `import { MatSelectModule } from '@angular/material/select';`] : []),
      ...(uiFramework === UIFramework.PrimeNG ? [`import { InputTextModule } from 'primeng/inputtext';`, `import { ButtonModule } from 'primeng/button';`] : []),
      ...(noState ? [] : [
        useStore
          ? `import { ${name}Store } from '../../stores/${camelName}.store';`
          : `import { ${name}Service } from '../../services/${camelName}.service';`,
        `import { Create${name} } from '../../models/${camelName}';`,
        `import { create${name}Form } from '../../forms/${camelName}.form';`,
      ]),
    ].flat();

    const formInvalidCheck = useSignalForms ? '!this.form().valid()' : 'this.form.invalid';
    const formValue = useSignalForms ? 'this.form().value()' : 'this.form.value';

    const body = noState
      ? []
      : [
          `  private readonly ${useStore ? 'store' : 'service'} = inject(${useStore ? `${name}Store` : `${name}Service`});`,
          `  private readonly router = inject(Router);`,
          `  protected readonly form = create${name}Form();`,
          `  protected readonly error = signal<string | null>(null);`,
          '',
          `  onSubmit(): void {`,
          `    if (${formInvalidCheck}) return;`,
          `    this.${useStore ? 'store' : 'service'}.create(${formValue} as Create${name}).subscribe({`,
          `      next: () => this.router.navigate(['../']),`,
          `      error: (err) => this.error.set(err.message),`,
          `    });`,
          `  }`,
        ];

    const formModuleName = useSignalForms ? 'FormField' : 'ReactiveFormsModule';

    const ts = [
      ...imports,
      '',
      '@Component({',
      `  selector: 'app-${this.kebabCase(name)}-create',`,
      `  imports: [${noState ? '' : formModuleName + ', RouterLink'}${this.frameworkImports(uiFramework) ? ', ' + this.frameworkImports(uiFramework).replace(', ', '') : ''}],`,
      `  template: \`${this.escapeHtml(html)}\`,`,
      `})`,
      `export class ${name}CreateComponent {`,
      ...body,
      `}`,
      '',
    ].join('\n');

    return { path: `components/${camelName}-create/${camelName}-create.component.ts`, content: ts };
  }

  private generateEdit(entity: EntityDefinition, uiFramework: UIFramework, stateManagement: StateManagement, formType: FormType): GeneratedFile {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const formFields = entity.fields.filter(f => !f.isPrimaryKey && !f.isAudit && !f.isSoftDelete);
    const useSignalForms = formType === FormType.Signal;

    const html = this.editFormHtml(name, formFields, uiFramework, useSignalForms);
    const useStore = stateManagement === StateManagement.SignalStore || stateManagement === StateManagement.ComponentStore;
    const noState = stateManagement === StateManagement.None;

    const formModuleImport = useSignalForms
      ? `import { FormField } from '@angular/forms/signals';`
      : `import { ReactiveFormsModule } from '@angular/forms';`;

    const imports = [
      `import { Component${useStore || noState ? '' : ', inject, signal'} } from '@angular/core';`,
      ...(noState ? [] : [formModuleImport, `import { RouterLink, Router, ActivatedRoute } from '@angular/router';`]),
      ...(uiFramework === UIFramework.Material ? [`import { MatInputModule } from '@angular/material/input';`, `import { MatButtonModule } from '@angular/material/button';`, `import { MatSelectModule } from '@angular/material/select';`] : []),
      ...(uiFramework === UIFramework.PrimeNG ? [`import { InputTextModule } from 'primeng/inputtext';`, `import { ButtonModule } from 'primeng/button';`] : []),
      ...(noState ? [] : [
        useStore
          ? `import { ${name}Store } from '../../stores/${camelName}.store';`
          : `import { ${name}Service } from '../../services/${camelName}.service';`,
        `import { Update${name} } from '../../models/${camelName}';`,
        `import { create${name}Form } from '../../forms/${camelName}.form';`,
      ]),
    ].flat();

    const patchValueCode = useSignalForms
      ? useStore
        ? [
            `    this.store.loadById(this.id);`,
            `    effect(() => {`,
            `      const item = this.store.selectedItem();`,
            `      if (item) {`,
            ...formFields.map(f => `        untracked(() => this.form.${f.name}().value.set(item.${f.name}));`),
            `      }`,
            `    });`,
          ]
        : [
            `    this.service.getById(this.id).subscribe(data => {`,
            ...formFields.map(f => `      this.form.${f.name}().value.set(data.${f.name});`),
            `    });`,
          ]
      : useStore
      ? [
          `    this.store.loadById(this.id);`,
          `    effect(() => {`,
          `      const item = this.store.selectedItem();`,
          `      if (item) {`,
          `        untracked(() => this.form.patchValue(item));`,
          `      }`,
          `    });`,
        ]
      : [
          `    this.service.getById(this.id).subscribe(data => this.form.patchValue(data));`,
        ];

    const extraImports = (useStore && !noState) || (useSignalForms && useStore && !noState) ? ', effect, untracked' : '';

    if ((useStore && !noState) || (useSignalForms && useStore && !noState)) {
      imports[0] = `import { Component, inject, signal${extraImports} } from '@angular/core';`;
    }

    const formModuleName = useSignalForms ? 'FormField' : 'ReactiveFormsModule';
    const formInvalidCheck = useSignalForms ? '!this.form().valid()' : 'this.form.invalid';
    const formValue = useSignalForms ? 'this.form().value()' : 'this.form.value';

    const ts = [
      ...imports,
      '',
      '@Component({',
      `  selector: 'app-${this.kebabCase(name)}-edit',`,
      `  imports: [${noState ? '' : formModuleName + ', RouterLink'}${this.frameworkImports(uiFramework) ? ', ' + this.frameworkImports(uiFramework).replace(', ', '') : ''}],`,
      `  template: \`${this.escapeHtml(html)}\`,`,
      `})`,
      `export class ${name}EditComponent {`,
      ...(noState ? [] : [
        `  private readonly ${useStore ? 'store' : 'service'} = inject(${useStore ? `${name}Store` : `${name}Service`});`,
        `  private readonly router = inject(Router);`,
        `  private readonly route = inject(ActivatedRoute);`,
        `  protected readonly form = create${name}Form();`,
        `  protected readonly error = signal<string | null>(null);`,
        `  private readonly id = this.route.snapshot.params['id'];`,
        '',
        `  constructor() {`,
        ...patchValueCode,
        `  }`,
        '',
        `  onSubmit(): void {`,
        `    if (${formInvalidCheck}) return;`,
        `    this.${useStore ? 'store' : 'service'}.update(this.id, ${formValue} as Update${name}).subscribe({`,
        `      next: () => this.router.navigate(['../../']),`,
        `      error: (err) => this.error.set(err.message),`,
        `    });`,
        `  }`,
      ]),
      `}`,
      '',
    ].join('\n');

    return { path: `components/${camelName}-edit/${camelName}-edit.component.ts`, content: ts };
  }

  private generateDetails(entity: EntityDefinition, uiFramework: UIFramework, stateManagement: StateManagement): GeneratedFile {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const displayFields = entity.fields;

    const html = this.detailsHtml(name, displayFields, uiFramework);
    const useStore = stateManagement === StateManagement.SignalStore || stateManagement === StateManagement.ComponentStore;
    const noState = stateManagement === StateManagement.None;

    const imports = [
      `import { Component, inject${useStore || noState ? '' : ', signal'} } from '@angular/core';`,
      noState ? '' : `import { RouterLink, ActivatedRoute } from '@angular/router';`,
      ...(uiFramework === UIFramework.Material ? [`import { MatButtonModule } from '@angular/material/button';`] : []),
      ...(uiFramework === UIFramework.PrimeNG ? [`import { ButtonModule } from 'primeng/button';`] : []),
      ...(noState ? [] : [
        useStore
          ? `import { ${name}Store } from '../../stores/${camelName}.store';`
          : `import { ${name}Service } from '../../services/${camelName}.service';`,
        `import { ${name} } from '../../models/${camelName}';`,
      ]),
    ].flat().filter(Boolean);

    const body = noState
      ? []
      : useStore
      ? [
          `  private readonly store = inject(${name}Store);`,
          `  private readonly route = inject(ActivatedRoute);`,
          `  protected readonly item = this.store.selectedItem;`,
          `  protected readonly id = this.route.snapshot.params['id'];`,
          '',
          `  constructor() {`,
          `    this.store.loadById(this.id);`,
          `  }`,
        ]
      : [
          `  private readonly service = inject(${name}Service);`,
          `  private readonly route = inject(ActivatedRoute);`,
          `  protected readonly item = signal<${name} | null>(null);`,
          `  protected readonly id = this.route.snapshot.params['id'];`,
          '',
          `  constructor() {`,
          `    this.service.getById(this.id).subscribe(data => this.item.set(data));`,
          `  }`,
        ];

    const ts = [
      ...imports,
      '',
      '@Component({',
      `  selector: 'app-${this.kebabCase(name)}-details',`,
      `  imports: [${noState ? '' : 'RouterLink'}${uiFramework === UIFramework.Material ? ', MatButtonModule' : ''}${uiFramework === UIFramework.PrimeNG ? ', ButtonModule' : ''}],`,
      `  template: \`${this.escapeHtml(html)}\`,`,
      `})`,
      `export class ${name}DetailsComponent {`,
      ...body,
      `}`,
      '',
    ].join('\n');

    return { path: `components/${camelName}-details/${camelName}-details.component.ts`, content: ts };
  }

  private listTemplate(name: string, camelName: string, fields: FieldDefinition[], ui: UIFramework): string {
    if (ui === UIFramework.Material) {
      return [
        `<div class="p-4">`,
        `  <a [routerLink]="['new']" mat-raised-button color="primary" class="mb-4">New ${name}</a>`,
        `  <table mat-table [dataSource]="items()" class="w-full">`,
        ...fields.map((f, i) =>
          `    <ng-container matColumnDef="${f.name}">\n      <th mat-header-cell *matHeaderCellDef>${f.name}</th>\n      <td mat-cell *matCellDef="let item">{{ item.${f.name} }}</td>\n    </ng-container>`
        ),
        `    <tr mat-header-row *matHeaderRowDef="columns"></tr>`,
        `    <tr mat-row *matRowDef="let row; columns: columns;"></tr>`,
        `  </table>`,
        `</div>`,
      ].join('\n');
    }

    if (ui === UIFramework.PrimeNG) {
      return [
        `<div class="p-4">`,
        `  <a [routerLink]="['new']" pButton label="New ${name}" class="mb-4"></a>`,
        `  <p-table [value]="items()">`,
        ...fields.map(f =>
          `    <ng-template pTemplate="header"><th>${f.name}</th></ng-template>`
        ),
        `  </p-table>`,
        `</div>`,
      ].join('\n');
    }

    return [
      `<div class="p-4">`,
      `  <a [routerLink]="['new']" class="inline-block px-4 py-2 bg-blue-500 text-white rounded mb-4">New ${name}</a>`,
      `  <div class="overflow-x-auto">`,
      `    <table class="w-full border-collapse border border-gray-200">`,
      `      <thead>`,
      `        <tr class="bg-gray-50">`,
      ...fields.map(f => `          <th class="border border-gray-200 px-4 py-2 text-left text-sm font-medium">${f.name}</th>`),
      `          <th class="border border-gray-200 px-4 py-2"></th>`,
      `        </tr>`,
      `      </thead>`,
      `      <tbody>`,
      `        @for (item of items(); track item) {`,
      `          <tr class="hover:bg-gray-50">`,
      ...fields.map(f => `            <td class="border border-gray-200 px-4 py-2 text-sm">{{ item.${f.name} }}</td>`),
      `            <td class="border border-gray-200 px-4 py-2 text-sm">`,
      `              <a [routerLink]="[item.id]" class="text-blue-600 hover:text-blue-800 mr-2">View</a>`,
      `              <a [routerLink]="[item.id, 'edit']" class="text-yellow-600 hover:text-yellow-800">Edit</a>`,
      `            </td>`,
      `          </tr>`,
      `        }`,
      `      </tbody>`,
      `    </table>`,
      `  </div>`,
      `</div>`,
    ].join('\n');
  }

  private createFormHtml(name: string, fields: FieldDefinition[], ui: UIFramework, useSignalForms = false): string {
    const formFields = fields.map(f => this.fieldHtml(f, name, ui, useSignalForms)).join('\n');

    const buttons = ui === UIFramework.Material
      ? `    <button type="submit" mat-raised-button color="primary">Save</button>\n    <a routerLink="../" mat-stroked-button>Cancel</a>`
      : ui === UIFramework.PrimeNG
      ? `    <button type="submit" pButton label="Save"></button>\n    <a routerLink="../" pButton label="Cancel" class="p-button-secondary"></a>`
      : `    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>\n    <a routerLink="../" class="px-4 py-2 bg-gray-300 rounded">Cancel</a>`;

    return `<form (ngSubmit)="onSubmit()" class="space-y-4 p-4">\n${formFields}\n  <div class="flex gap-2">\n${buttons}\n  </div>\n</form>`;
  }

  private editFormHtml(name: string, fields: FieldDefinition[], ui: UIFramework, useSignalForms = false): string {
    const formFields = fields.map(f => this.fieldHtml(f, name, ui, useSignalForms)).join('\n');

    const buttons = ui === UIFramework.Material
      ? `    <button type="submit" mat-raised-button color="primary">Update</button>\n    <a routerLink="../../" mat-stroked-button>Cancel</a>`
      : ui === UIFramework.PrimeNG
      ? `    <button type="submit" pButton label="Update"></button>\n    <a routerLink="../../" pButton label="Cancel" class="p-button-secondary"></a>`
      : `    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">Update</button>\n    <a routerLink="../../" class="px-4 py-2 bg-gray-300 rounded">Cancel</a>`;

    return `<form (ngSubmit)="onSubmit()" class="space-y-4 p-4">\n${formFields}\n  <div class="flex gap-2">\n${buttons}\n  </div>\n</form>`;
  }

  private detailsHtml(name: string, fields: FieldDefinition[], ui: UIFramework): string {
    const fieldLines = fields.map(f =>
      `  <div><strong>${f.name}:</strong> {{ item.${f.name} }}</div>`
    ).join('\n');

    const buttons = ui === UIFramework.Material
      ? `    <a [routerLink]="['../', id, 'edit']" mat-raised-button color="primary">Edit</a>\n    <a routerLink="../" mat-stroked-button>Back</a>`
      : ui === UIFramework.PrimeNG
      ? `    <a [routerLink]="['../', id, 'edit']" pButton label="Edit"></a>\n    <a routerLink="../" pButton label="Back" class="p-button-secondary"></a>`
      : `    <a [routerLink]="['../', id, 'edit']" class="px-4 py-2 bg-yellow-500 text-white rounded">Edit</a>\n    <a routerLink="../" class="px-4 py-2 bg-gray-300 rounded">Back</a>`;

    return `<div class="p-4 space-y-2">\n${fieldLines}\n  <div class="flex gap-2 pt-4">\n${buttons}\n  </div>\n</div>`;
  }

  private fieldHtml(field: FieldDefinition, entityName: string, ui: UIFramework, useSignalForms = false): string {
    const label = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    const id = `${this.camelCase(entityName)}-${field.name}`;
    const control = useSignalForms
      ? `[formField]="form.${field.name}"`
      : `[formControl]="form.controls.${field.name}"`;

    if (field.type === 'boolean') {
      if (ui === UIFramework.Material) {
        return `  <mat-checkbox id="${id}" ${control}>${label}</mat-checkbox>`;
      }
      return [
        `  <div>`,
        `    <label for="${id}">${label}</label>`,
        `    <input id="${id}" type="checkbox" ${control} />`,
        `  </div>`,
      ].join('\n');
    }

    if (field.enumValues && field.enumValues.length > 0) {
      if (ui === UIFramework.Material) {
        return [
          `  <mat-form-field class="w-full">`,
          `    <mat-label>${label}</mat-label>`,
          `    <mat-select id="${id}" ${control}>`,
          `      <mat-option value="">Select...</mat-option>`,
          ...field.enumValues.map(v => `      <mat-option value="${v}">${v}</mat-option>`),
          `    </mat-select>`,
          `  </mat-form-field>`,
        ].join('\n');
      }
      if (ui === UIFramework.PrimeNG) {
        return [
          `  <div class="field">`,
          `    <label for="${id}">${label}</label>`,
          `    <p-dropdown id="${id}" ${control} [options]="${this.camelCase(entityName)}${this.pascalCase(field.name)}Options" optionLabel="label" optionValue="value"></p-dropdown>`,
          `  </div>`,
        ].join('\n');
      }
      return [
        `  <div>`,
        `    <label for="${id}">${label}</label>`,
        `    <select id="${id}" ${control} class="w-full p-2 border rounded">`,
        `      <option value="">Select...</option>`,
        ...field.enumValues.map(v => `      <option value="${v}">${v}</option>`),
        `    </select>`,
        `  </div>`,
      ].join('\n');
    }

    if (ui === UIFramework.Material) {
      return [
        `  <mat-form-field class="w-full">`,
        `    <mat-label>${label}</mat-label>`,
        `    <input matInput id="${id}" ${control} />`,
        `  </mat-form-field>`,
      ].join('\n');
    }
    if (ui === UIFramework.PrimeNG) {
      return [
        `  <div class="field">`,
        `    <label for="${id}">${label}</label>`,
        `    <input id="${id}" type="text" pInputText ${control} class="w-full" />`,
        `  </div>`,
      ].join('\n');
    }
    return [
      `  <div>`,
      `    <label for="${id}">${label}</label>`,
      `    <input id="${id}" type="text" ${control} class="w-full p-2 border rounded" />`,
      `  </div>`,
    ].join('\n');
  }

  private frameworkImports(ui: UIFramework): string {
    if (ui === UIFramework.Material) return ', MatInputModule, MatButtonModule, MatSelectModule';
    if (ui === UIFramework.PrimeNG) return ', InputTextModule, ButtonModule';
    return '';
  }

  private escapeHtml(str: string): string {
    return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  }

  private camelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  private pascalCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private kebabCase(name: string): string {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }
}
