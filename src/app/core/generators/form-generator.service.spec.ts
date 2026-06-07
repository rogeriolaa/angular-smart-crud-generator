import { describe, it, expect } from 'vitest';
import { FormGeneratorService } from './form-generator.service';
import { EntityDefinition, FieldType, FormType } from '../models';

function makeProductEntity(): EntityDefinition {
  return {
    name: 'Product',
    namePlural: 'Products',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'name', type: FieldType.String, isRequired: true, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [{ type: 'required' }, { type: 'minLength', value: 3 }, { type: 'maxLength', value: 100 }], isArray: false },
      { name: 'price', type: FieldType.Number, isRequired: true, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [{ type: 'required' }, { type: 'min', value: 0 }], isArray: false },
      { name: 'description', type: FieldType.String, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'active', type: FieldType.Boolean, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'createdAt', type: FieldType.Date, isRequired: false, isPrimaryKey: false, isAudit: true, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'deletedAt', type: FieldType.Date, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: true, isForeignKey: false, validators: [], isArray: false },
      { name: 'status', type: FieldType.Enum, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, enumValues: ['active', 'inactive', 'discontinued'], validators: [], isArray: false },
    ],
    endpoints: [],
    relationships: [],
    isAuditEntity: true,
    hasSoftDelete: true,
  };
}

describe('FormGeneratorService', () => {
  const service = new FormGeneratorService();

  describe('generateForm', () => {
    it('generates form function declaration', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('export function createProductForm');
      expect(result).toContain('FormGroup');
    });

    it('includes form controls for non-PK, non-audit, non-soft-delete fields', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('name:');
      expect(result).toContain('price:');
      expect(result).toContain('description:');
      expect(result).toContain('active:');
      expect(result).toContain('status:');
    });

    it('excludes PK, audit, and soft delete fields', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).not.toContain('id:');
      expect(result).not.toContain('createdAt');
      expect(result).not.toContain('deletedAt');
    });

    it('adds Validators.required for required fields', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('Validators.required');
    });

    it('adds Validators.minLength and Validators.maxLength', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('Validators.minLength(3)');
      expect(result).toContain('Validators.maxLength(100)');
    });

    it('adds Validators.min', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('Validators.min(0)');
    });

    it('generates FormControl<boolean> for boolean fields', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('FormControl<boolean>');
    });

    it('generates FormControl<string> for enum fields', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('FormControl<string>');
    });

    it('generates FormControl<number> for number fields', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain('FormControl<number>');
    });

    it('imports CreateProduct and UpdateProduct', () => {
      const result = service.generateForm(makeProductEntity());
      expect(result).toContain("import { CreateProduct, UpdateProduct } from '../models/product'");
    });
  });

  describe('generateAll', () => {
    it('returns one file per entity', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('forms/product.form.ts');
    });

    it('returns empty array for empty input', () => {
      expect(service.generateAll([])).toEqual([]);
    });

    it('generates reactive forms by default', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities);
      expect(files[0].content).toContain('FormGroup');
      expect(files[0].content).not.toContain('@angular/forms/signals');
    });
  });

  describe('generateSignalForm', () => {
    it('generates signal-based form exports', () => {
      const result = service.generateSignalForm(makeProductEntity());
      expect(result).toContain('import { signal }');
      expect(result).toContain("import { form, required, minLength, maxLength, min, max, pattern }");
      expect(result).toContain('@angular/forms/signals');
    });

    it('generates model signal with field defaults', () => {
      const result = service.generateSignalForm(makeProductEntity());
      expect(result).toContain("const model = signal({");
      expect(result).toContain("name: data?.name ?? ''");
      expect(result).toContain("price: data?.price ?? 0");
      expect(result).toContain("active: data?.active ?? false");
      expect(result).toContain("status: data?.status ?? ''");
    });

    it('includes validators in schema callback', () => {
      const result = service.generateSignalForm(makeProductEntity());
      expect(result).toContain('return form(model, (field) => {');
      expect(result).toContain('required(field.name);');
      expect(result).toContain('minLength(field.name, 3);');
      expect(result).toContain('maxLength(field.name, 100);');
      expect(result).toContain('required(field.price);');
      expect(result).toContain('min(field.price, 0);');
    });

    it('imports Create and Update types', () => {
      const result = service.generateSignalForm(makeProductEntity());
      expect(result).toContain("import { CreateProduct, UpdateProduct } from '../models/product'");
    });

    it('excludes PK, audit, and soft delete fields', () => {
      const result = service.generateSignalForm(makeProductEntity());
      expect(result).not.toContain('id:');
      expect(result).not.toContain('createdAt');
      expect(result).not.toContain('deletedAt');
    });
  });

  describe('generateDynamicForm', () => {
    it('generates form config array', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).toContain('export const productFormConfig: FormFieldConfig[] = [');
      expect(result).toContain("{ name: 'name',");
      expect(result).toContain("{ name: 'price',");
    });

    it('includes field types in config', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).toContain("type: 'string'");
      expect(result).toContain("type: 'number'");
      expect(result).toContain("type: 'boolean'");
      expect(result).toContain("type: 'enum'");
    });

    it('generates form builder function using loop over config', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).toContain('export function createProductForm');
      expect(result).toContain('for (const field of productFormConfig)');
      expect(result).toContain('new FormControl(');
      expect(result).toContain('(data as any)?.[field.name] ?? null');
    });

    it('includes enum values in config', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).toContain("enumValues: ['active', 'inactive', 'discontinued']");
    });

    it('includes validators in config entries', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).toContain('Validators.required');
      expect(result).toContain('Validators.minLength(3)');
      expect(result).toContain('Validators.min(0)');
    });

    it('imports FormFieldConfig from shared config', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).toContain("import { FormFieldConfig } from './form-config'");
    });

    it('excludes PK, audit, and soft delete fields', () => {
      const result = service.generateDynamicForm(makeProductEntity());
      expect(result).not.toContain("name: 'id'");
      expect(result).not.toContain('createdAt');
      expect(result).not.toContain('deletedAt');
    });
  });

  describe('generateAll with formType Dynamic', () => {
    it('returns shared config file plus entity files', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities, FormType.Dynamic);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('forms/form-config.ts');
      expect(files[1].path).toBe('forms/product.form.ts');
    });

    it('shared config file contains FormFieldConfig interface', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities, FormType.Dynamic);
      expect(files[0].content).toContain('export interface FormFieldConfig');
      expect(files[0].content).toContain('ValidatorFn');
    });

    it('entity form file imports from shared config', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities, FormType.Dynamic);
      expect(files[1].content).toContain("import { FormFieldConfig } from './form-config'");
    });

    it('generates only shared config for empty entities', () => {
      const files = service.generateAll([], FormType.Dynamic);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('forms/form-config.ts');
    });
  });

  describe('generateAll with formType Signal', () => {
    it('generates signal forms when formType is Signal', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities, FormType.Signal);
      expect(files[0].content).toContain('@angular/forms/signals');
      expect(files[0].content).not.toContain('FormGroup');
    });

    it('generates reactive forms when formType is Reactive', () => {
      const entities = [makeProductEntity()];
      const files = service.generateAll(entities, FormType.Reactive);
      expect(files[0].content).toContain('FormGroup');
      expect(files[0].content).not.toContain('@angular/forms/signals');
    });
  });
});
