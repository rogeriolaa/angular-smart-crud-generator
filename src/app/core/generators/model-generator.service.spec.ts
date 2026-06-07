import { describe, it, expect } from 'vitest';
import { ModelGeneratorService } from './model-generator.service';
import { EntityDefinition, FieldType } from '../models';

function makePetEntity(): EntityDefinition {
  return {
    name: 'Pet',
    namePlural: 'Pets',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'name', type: FieldType.String, isRequired: true, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [{ type: 'required' }], isArray: false },
      { name: 'categoryId', type: FieldType.Integer, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: true, validators: [], isArray: false },
      { name: 'status', type: FieldType.Enum, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, enumValues: ['available', 'pending', 'sold'], validators: [], isArray: false },
      { name: 'tags', type: FieldType.Array, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, refEntityName: 'Tag', validators: [], isArray: true },
      { name: 'createdAt', type: FieldType.Date, isRequired: false, isPrimaryKey: false, isAudit: true, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'deletedAt', type: FieldType.Date, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: true, isForeignKey: false, validators: [], isArray: false },
    ],
    endpoints: [],
    relationships: [],
    isAuditEntity: true,
    hasSoftDelete: true,
  };
}

describe('ModelGeneratorService', () => {
  const service = new ModelGeneratorService();

  describe('generateModel', () => {
    it('generates main interface with all fields', () => {
      const entity = makePetEntity();
      const result = service.generateModel(entity);
      expect(result).toContain('export interface Pet {');
      expect(result).toContain('id: number;');
      expect(result).toContain('name: string;');
      expect(result).toContain('categoryId?: number;');
      expect(result).toContain('status?:');
      expect(result).toContain('tags?: Tag[];');
      expect(result).toContain('createdAt?: string;');
      expect(result).toContain('deletedAt?: string;');
      expect(result).toContain('}');
    });

    it('generates CreateDto with required fields, excluding audit/soft-delete/pk', () => {
      const entity = makePetEntity();
      const result = service.generateModel(entity);
      expect(result).toContain('export interface CreatePet {');
      expect(result).toContain('name: string;');
      expect(result).toContain("status?: 'available' | 'pending' | 'sold'");
      const createSection = result.split('export interface UpdatePet')[0];
      const createOnly = createSection.split('export interface CreatePet')[1] || '';
      expect(createOnly).not.toContain('id:');
      expect(createOnly).not.toContain('createdAt');
      expect(createOnly).not.toContain('deletedAt');
    });

    it('generates UpdateDto with all fields optional, excluding audit/soft-delete/pk', () => {
      const entity = makePetEntity();
      const result = service.generateModel(entity);
      expect(result).toContain('export interface UpdatePet {');
      expect(result).toContain('name?: string;');
      expect(result).toContain('categoryId?: number;');
      const updateSection = result.split('export interface UpdatePet')[1] || '';
      expect(updateSection).not.toContain('id:');
      expect(updateSection).not.toContain('createdAt');
      expect(updateSection).not.toContain('deletedAt');
    });

    it('generates enum union types', () => {
      const entity = makePetEntity();
      const result = service.generateModel(entity);
      expect(result).toContain("status?: 'available' | 'pending' | 'sold'");
    });

    it('generates ref type for foreign key fields', () => {
      const entity = makePetEntity();
      const result = service.generateModel(entity);
      expect(result).toContain('categoryId?: number');
    });
  });

  describe('generateAll', () => {
    it('returns one file per entity', () => {
      const entities = [
        makePetEntity(),
        { ...makePetEntity(), name: 'Category', namePlural: 'Categories', fields: [] },
      ];
      const files = service.generateAll(entities);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('models/pet.ts');
      expect(files[1].path).toBe('models/category.ts');
    });

    it('returns empty array for empty input', () => {
      expect(service.generateAll([])).toEqual([]);
    });
  });
});
