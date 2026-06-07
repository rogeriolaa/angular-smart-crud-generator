import { describe, it, expect } from 'vitest';
import { FieldType, EntityDefinition, FieldDefinition } from './entity-definition';

describe('FieldType', () => {
  it('has expected values', () => {
    expect(FieldType.String).toBe('string');
    expect(FieldType.Integer).toBe('integer');
    expect(FieldType.Number).toBe('number');
    expect(FieldType.Boolean).toBe('boolean');
    expect(FieldType.Date).toBe('date');
    expect(FieldType.Enum).toBe('enum');
    expect(FieldType.Array).toBe('array');
    expect(FieldType.Object).toBe('object');
    expect(FieldType.File).toBe('file');
    expect(FieldType.Unknown).toBe('unknown');
  });
});

describe('FieldDefinition', () => {
  it('can be instantiated with all fields', () => {
    const field: FieldDefinition = {
      name: 'id',
      type: FieldType.Integer,
      isRequired: true,
      isPrimaryKey: true,
      isAudit: false,
      isSoftDelete: false,
      isForeignKey: false,
      validators: [],
      isArray: false,
    };
    expect(field.name).toBe('id');
    expect(field.type).toBe(FieldType.Integer);
    expect(field.isRequired).toBe(true);
    expect(field.isPrimaryKey).toBe(true);
    expect(field.isArray).toBe(false);
  });

  it('supports validators', () => {
    const field: FieldDefinition = {
      name: 'email',
      type: FieldType.String,
      isRequired: true,
      isPrimaryKey: false,
      isAudit: false,
      isSoftDelete: false,
      isForeignKey: false,
      validators: [{ type: 'email' }],
      isArray: false,
    };
    expect(field.validators).toHaveLength(1);
    expect(field.validators[0].type).toBe('email');
  });

  it('supports enum values', () => {
    const field: FieldDefinition = {
      name: 'status',
      type: FieldType.Enum,
      isRequired: true,
      isPrimaryKey: false,
      isAudit: false,
      isSoftDelete: false,
      isForeignKey: false,
      validators: [],
      enumValues: ['active', 'inactive', 'pending'],
      isArray: false,
    };
    expect(field.enumValues).toHaveLength(3);
  });

  it('supports ref entity name for foreign keys', () => {
    const field: FieldDefinition = {
      name: 'categoryId',
      type: FieldType.Integer,
      isRequired: false,
      isPrimaryKey: false,
      isAudit: false,
      isSoftDelete: false,
      isForeignKey: true,
      refEntityName: 'Category',
      validators: [],
      isArray: false,
    };
    expect(field.isForeignKey).toBe(true);
    expect(field.refEntityName).toBe('Category');
  });
});

describe('EntityDefinition', () => {
  it('can be instantiated with all fields', () => {
    const entity: EntityDefinition = {
      name: 'Pet',
      namePlural: 'Pets',
      fields: [],
      endpoints: [],
      relationships: [],
      isAuditEntity: false,
      hasSoftDelete: false,
    };
    expect(entity.name).toBe('Pet');
    expect(entity.namePlural).toBe('Pets');
    expect(entity.fields).toEqual([]);
    expect(entity.endpoints).toEqual([]);
    expect(entity.relationships).toEqual([]);
  });

  it('aggregates fields', () => {
    const fields: FieldDefinition[] = [
      {
        name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true,
        isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false,
      },
      {
        name: 'name', type: FieldType.String, isRequired: true, isPrimaryKey: false,
        isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false,
      },
    ];
    const entity: EntityDefinition = {
      name: 'Pet',
      namePlural: 'Pets',
      fields,
      endpoints: [],
      relationships: [],
      isAuditEntity: false,
      hasSoftDelete: false,
    };
    expect(entity.fields).toHaveLength(2);
    expect(entity.fields.map(f => f.name)).toEqual(['id', 'name']);
  });

  it('tracks audit and soft-delete flags', () => {
    const entity: EntityDefinition = {
      name: 'AuditLog',
      namePlural: 'AuditLogs',
      fields: [],
      endpoints: [],
      relationships: [],
      isAuditEntity: true,
      hasSoftDelete: true,
    };
    expect(entity.isAuditEntity).toBe(true);
    expect(entity.hasSoftDelete).toBe(true);
  });
});
