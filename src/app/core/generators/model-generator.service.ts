import { Injectable } from '@angular/core';
import { EntityDefinition, FieldDefinition, FieldType } from '../models';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class ModelGeneratorService {
  generateAll(entities: EntityDefinition[]): GeneratedFile[] {
    return entities.map(entity => ({
      path: `models/${this.camelCase(entity.name)}.ts`,
      content: this.generateModel(entity),
    }));
  }

  generateModel(entity: EntityDefinition): string {
    const lines: string[] = [];
    const interfaceName = entity.name;
    const createDtoName = `Create${entity.name}`;
    const updateDtoName = `Update${entity.name}`;

    lines.push(`export interface ${interfaceName} {`);
    for (const field of entity.fields) {
      lines.push(`  ${this.fieldSignature(field, false)};`);
    }
    lines.push('}');
    lines.push('');

    lines.push(`export interface ${createDtoName} {`);
    for (const field of entity.fields) {
      if (field.isAudit || field.isSoftDelete || field.isPrimaryKey) continue;
      lines.push(`  ${this.fieldSignature(field, false)};`);
    }
    lines.push('}');
    lines.push('');

    lines.push(`export interface ${updateDtoName} {`);
    for (const field of entity.fields) {
      if (field.isAudit || field.isSoftDelete || field.isPrimaryKey) continue;
      lines.push(`  ${this.fieldSignature(field, true)};`);
    }
    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private fieldSignature(field: FieldDefinition, optional: boolean): string {
    const type = this.mapToTypeScript(field);
    const opt = optional || !field.isRequired ? '?' : '';
    return `${field.name}${opt}: ${type}`;
  }

  private mapToTypeScript(field: FieldDefinition): string {
    if (field.enumValues && field.enumValues.length > 0) {
      return field.enumValues.map(v => `'${v}'`).join(' | ');
    }
    if (field.refEntityName && field.isArray) {
      return `${field.refEntityName}[]`;
    }
    if (field.refEntityName) {
      return field.refEntityName;
    }
    if (field.isArray) {
      return `${this.baseType(field.type)}[]`;
    }
    return this.baseType(field.type);
  }

  private baseType(type: FieldType): string {
    switch (type) {
      case FieldType.String:
      case FieldType.Date:
      case FieldType.Enum:
      case FieldType.File:
        return 'string';
      case FieldType.Integer:
      case FieldType.Number:
        return 'number';
      case FieldType.Boolean:
        return 'boolean';
      case FieldType.Array:
        return 'unknown[]';
      case FieldType.Object:
        return 'Record<string, unknown>';
      default:
        return 'unknown';
    }
  }

  private camelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }
}
