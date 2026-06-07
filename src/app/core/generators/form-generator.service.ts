import { Injectable } from '@angular/core';
import { EntityDefinition, FieldDefinition, FieldType, FormType } from '../models';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class FormGeneratorService {
  generateAll(entities: EntityDefinition[], formType: FormType = FormType.Reactive): GeneratedFile[] {
    if (formType === FormType.Dynamic) {
      return this.generateDynamicForms(entities);
    }
    return entities.map(entity => ({
      path: `forms/${this.camelCase(entity.name)}.form.ts`,
      content: formType === FormType.Signal
        ? this.generateSignalForm(entity)
        : this.generateForm(entity),
    }));
  }

  generateDynamicForms(entities: EntityDefinition[]): GeneratedFile[] {
    const sharedConfig: GeneratedFile = {
      path: 'forms/form-config.ts',
      content: [
        "import { ValidatorFn } from '@angular/forms';",
        '',
        'export interface FormFieldConfig {',
        "  name: string;",
        "  type: 'string' | 'number' | 'boolean' | 'enum';",
        '  label: string;',
        '  validators: ValidatorFn[];',
        '  enumValues?: string[];',
        '}',
        '',
      ].join('\n'),
    };
    const formFiles = entities.map(entity => ({
      path: `forms/${this.camelCase(entity.name)}.form.ts`,
      content: this.generateDynamicForm(entity),
    }));
    return [sharedConfig, ...formFiles];
  }

  generateDynamicForm(entity: EntityDefinition): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const formFields = entity.fields.filter(f => !f.isPrimaryKey && !f.isAudit && !f.isSoftDelete);
    const lines: string[] = [];

    lines.push('import { FormGroup, FormControl, Validators } from \'@angular/forms\';');
    lines.push(`import { Create${name}, Update${name} } from '../models/${camelName}';`);
    lines.push(`import { FormFieldConfig } from './form-config';`);
    lines.push('');

    lines.push(`export const ${camelName}FormConfig: FormFieldConfig[] = [`);

    for (const field of formFields) {
      const fieldType = this.dynamicFieldType(field);
      const validators = this.formValidators(field);
      const config: string[] = [];
      config.push(`{ name: '${field.name}', type: '${fieldType}', label: '${this.pascalCase(field.name)}', validators: [${validators}]`);
      if (field.enumValues && field.enumValues.length > 0) {
        config.push(`enumValues: [${field.enumValues.map(v => `'${v}'`).join(', ')}]`);
      }
      config.push('},');
      lines.push(`  ${config.join(', ')}`);
    }

    lines.push('];');
    lines.push('');

    lines.push(`export function create${name}Form(data?: Partial<Create${name} | Update${name}>): FormGroup {`);
    lines.push('  const controls: Record<string, FormControl> = {};');
    lines.push('  for (const field of ' + camelName + 'FormConfig) {');
    lines.push('    controls[field.name] = new FormControl(');
    lines.push('      (data as any)?.[field.name] ?? null,');
    lines.push('      field.validators,');
    lines.push('    );');
    lines.push('  }');
    lines.push('  return new FormGroup(controls);');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  generateForm(entity: EntityDefinition): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const lines: string[] = [];

    lines.push('import { FormGroup, FormControl, Validators } from \'@angular/forms\';');
    lines.push(`import { Create${name}, Update${name} } from '../models/${camelName}';`);
    lines.push('');

    lines.push(`export function create${name}Form(data?: Partial<Create${name} | Update${name}>): FormGroup {`);
    lines.push('  return new FormGroup({');

    for (const field of entity.fields) {
      if (field.isPrimaryKey || field.isAudit || field.isSoftDelete) continue;

      const controlType = this.formControlType(field);
      const validators = this.formValidators(field);
      const defaultValue = field.isRequired ? '' : ', { validators: [] }';

      lines.push(`    ${field.name}: new FormControl${controlType}(data?.${field.name} ?? null${validators ? `, { validators: [${validators}] }` : defaultValue}),`);
    }

    lines.push('  });');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  generateSignalForm(entity: EntityDefinition): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const formFields = entity.fields.filter(f => !f.isPrimaryKey && !f.isAudit && !f.isSoftDelete);
    const lines: string[] = [];

    lines.push('import { signal } from \'@angular/core\';');
    lines.push('import { form, required, minLength, maxLength, min, max, pattern } from \'@angular/forms/signals\';');
    lines.push(`import { Create${name}, Update${name} } from '../models/${camelName}';`);
    lines.push('');

    lines.push(`export function create${name}Form(data?: Partial<Create${name} | Update${name}>) {`);
    lines.push('  const model = signal({');

    for (const field of formFields) {
      const defaultVal = this.signalDefaultValue(field);
      lines.push(`    ${field.name}: data?.${field.name} ?? ${defaultVal},`);
    }

    lines.push('  });');
    lines.push('  return form(model, (field) => {');

    for (const field of formFields) {
      const signalValidators = this.signalFormValidators(field);
      for (const sv of signalValidators) {
        lines.push(`    ${sv}`);
      }
    }

    lines.push('  });');
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private formControlType(field: FieldDefinition): string {
    if (field.enumValues && field.enumValues.length > 0) {
      return '<string>';
    }
    switch (field.type) {
      case FieldType.String:
      case FieldType.Date:
      case FieldType.File:
      case FieldType.Enum:
        return '<string>';
      case FieldType.Integer:
      case FieldType.Number:
        return '<number>';
      case FieldType.Boolean:
        return '<boolean>';
      default:
        return '';
    }
  }

  private formValidators(field: FieldDefinition): string {
    const parts: string[] = [];
    for (const v of field.validators) {
      switch (v.type) {
        case 'required':
          parts.push('Validators.required');
          break;
        case 'minLength':
          parts.push(`Validators.minLength(${v.value})`);
          break;
        case 'maxLength':
          parts.push(`Validators.maxLength(${v.value})`);
          break;
        case 'min':
          parts.push(`Validators.min(${v.value})`);
          break;
        case 'max':
          parts.push(`Validators.max(${v.value})`);
          break;
        case 'pattern':
          parts.push(`Validators.pattern('${v.value}')`);
          break;
      }
    }
    return parts.join(', ');
  }

  private signalFormValidators(field: FieldDefinition): string[] {
    const parts: string[] = [];
    for (const v of field.validators) {
      switch (v.type) {
        case 'required':
          parts.push('required(field.' + field.name + ');');
          break;
        case 'minLength':
          parts.push('minLength(field.' + field.name + ', ' + v.value + ');');
          break;
        case 'maxLength':
          parts.push('maxLength(field.' + field.name + ', ' + v.value + ');');
          break;
        case 'min':
          parts.push('min(field.' + field.name + ', ' + v.value + ');');
          break;
        case 'max':
          parts.push('max(field.' + field.name + ', ' + v.value + ');');
          break;
        case 'pattern':
          parts.push('pattern(field.' + field.name + ', /' + v.value + '/);');
          break;
      }
    }
    return parts;
  }

  private signalDefaultValue(field: FieldDefinition): string {
    if (field.enumValues && field.enumValues.length > 0) {
      return "''";
    }
    switch (field.type) {
      case FieldType.String:
      case FieldType.Date:
      case FieldType.File:
      case FieldType.Enum:
        return "''";
      case FieldType.Integer:
      case FieldType.Number:
        return '0';
      case FieldType.Boolean:
        return 'false';
      default:
        return 'null';
    }
  }

  private dynamicFieldType(field: FieldDefinition): string {
    if (field.enumValues && field.enumValues.length > 0) return 'enum';
    switch (field.type) {
      case FieldType.Integer:
      case FieldType.Number:
        return 'number';
      case FieldType.Boolean:
        return 'boolean';
      default:
        return 'string';
    }
  }

  private pascalCase(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private camelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }
}
