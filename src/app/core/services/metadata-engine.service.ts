import { Injectable } from '@angular/core';
import {
  EntityDefinition,
  FieldDefinition,
  FieldType,
  ValidatorDefinition,
  EndpointDefinition as EntityEndpoint,
  HttpMethod,
  CrudOperationType,
  RelationshipDefinition,
  RelationType,
} from '../models';
import {
  ParseResult,
  SchemaInfo,
  SchemaProperty,
  EndpointInfo,
} from './openapi-parser.service';

const AUDIT_FIELD_NAMES = new Set(['createdat', 'updatedat', 'createdby', 'updatedby']);
const SOFT_DELETE_FIELD_NAMES = new Set(['deletedat', 'isdeleted', 'deleted']);

@Injectable({ providedIn: 'root' })
export class MetadataEngineService {
  build(result: ParseResult): EntityDefinition[] {
    const schemas = result.schemas;
    const endpoints = result.endpoints;

    const mainSchemas = schemas.filter(s => !this.isDto(s.name));
    const dtoSchemas = schemas.filter(s => this.isDto(s.name));

    const entities: EntityDefinition[] = mainSchemas.map(schema =>
      this.schemaToEntity(schema, dtoSchemas, endpoints)
    );

    for (const entity of entities) {
      this.detectRelationships(entity, entities);
    }

    return entities;
  }

  private isDto(name: string): boolean {
    return /^(Create|Update|Patch).+Dto$/.test(name);
  }

  private extractEntityNameFromDto(dtoName: string): string {
    return dtoName.replace(/^(Create|Update|Patch)/, '').replace(/Dto$/, '');
  }

  private schemaToEntity(
    schema: SchemaInfo,
    dtoSchemas: SchemaInfo[],
    endpoints: EndpointInfo[],
  ): EntityDefinition {
    const fieldMap = new Map<string, FieldDefinition>();

    for (const prop of schema.properties) {
      fieldMap.set(prop.name, this.propertyToField(prop, schema.name));
    }

    const relatedDtoSchemas = dtoSchemas.filter(
      dto => this.extractEntityNameFromDto(dto.name) === schema.name
    );
    for (const dto of relatedDtoSchemas) {
      for (const prop of dto.properties) {
        if (!fieldMap.has(prop.name)) {
          fieldMap.set(prop.name, this.propertyToField(prop, schema.name));
        }
      }
    }

    const fields = Array.from(fieldMap.values());
    const isAuditEntity = fields.some(f => f.isAudit);
    const hasSoftDelete = fields.some(f => f.isSoftDelete);

    const entityEndpoints = this.matchEndpointsToEntity(schema.name, endpoints).map(
      ep => this.endpointInfoToDefinition(ep, schema.name)
    );

    return {
      name: schema.name,
      namePlural: this.pluralize(schema.name),
      description: schema.description,
      fields,
      endpoints: entityEndpoints,
      relationships: [],
      isAuditEntity,
      hasSoftDelete,
    };
  }

  private propertyToField(prop: SchemaProperty, entityName: string): FieldDefinition {
    const fieldType = this.mapType(prop);
    const isPrimaryKey = this.isPrimaryKeyField(prop.name, fieldType);

    return {
      name: prop.name,
      type: fieldType,
      isRequired: prop.required || false,
      isPrimaryKey,
      isAudit: AUDIT_FIELD_NAMES.has(prop.name.toLowerCase()),
      isSoftDelete: SOFT_DELETE_FIELD_NAMES.has(prop.name.toLowerCase()),
      isForeignKey: this.isForeignKeyField(prop.name),
      validators: this.buildValidators(prop),
      description: prop.description,
      defaultValue: prop.example,
      enumValues: prop.enumValues,
      refEntityName: prop.ref || prop.items?.ref,
      isArray: !!(prop.type === 'array' || prop.items),
    };
  }

  private mapType(prop: SchemaProperty): FieldType {
    if (prop.ref) return FieldType.Object;
    if (prop.enumValues && prop.enumValues.length > 0) return FieldType.Enum;

    switch (prop.type) {
      case 'integer':
      case 'int32':
      case 'int64':
        return FieldType.Integer;
      case 'number':
        return FieldType.Number;
      case 'boolean':
        return FieldType.Boolean;
      case 'array':
        return FieldType.Array;
      case 'object':
        return FieldType.Object;
      case 'string':
        if (prop.format === 'date' || prop.format === 'date-time') return FieldType.Date;
        if (prop.format === 'binary') return FieldType.File;
        return FieldType.String;
      default:
        return FieldType.Unknown;
    }
  }

  private buildValidators(prop: SchemaProperty): ValidatorDefinition[] {
    const validators: ValidatorDefinition[] = [];
    if (prop.required) validators.push({ type: 'required' });
    if (prop.minLength !== undefined) validators.push({ type: 'minLength', value: prop.minLength });
    if (prop.maxLength !== undefined) validators.push({ type: 'maxLength', value: prop.maxLength });
    if (prop.minimum !== undefined) validators.push({ type: 'min', value: prop.minimum });
    if (prop.maximum !== undefined) validators.push({ type: 'max', value: prop.maximum });
    if (prop.pattern) validators.push({ type: 'pattern', value: prop.pattern });
    return validators;
  }

  private isPrimaryKeyField(name: string, type: FieldType): boolean {
    if (name === 'id') return true;
    return type === FieldType.Integer && /^[a-z0-9]+Id$/.test(name) && name !== 'id';
  }

  private isForeignKeyField(name: string): boolean {
    if (name === 'id') return false;
    return /^[a-z][a-zA-Z0-9]*Id$/.test(name);
  }

  private matchEndpointsToEntity(
    entityName: string,
    endpoints: EndpointInfo[],
  ): EndpointInfo[] {
    const entityLower = entityName.toLowerCase();
    const entityPluralLower = this.pluralize(entityName).toLowerCase();

    return endpoints.filter(ep => {
      if (ep.responseRef === entityName) return true;
      if (ep.requestBodyRef === entityName) return true;

      const pathLower = ep.path.toLowerCase();
      const hasEntityInPath =
        pathLower.includes(`/${entityLower}`) ||
        pathLower.includes(`/${entityPluralLower}`) ||
        pathLower.includes(`/${entityLower}s`);

      if (!hasEntityInPath) return false;

      const pathSegmentCount = pathLower.split('/').filter(Boolean).length;
      return pathSegmentCount <= 3;
    });
  }

  private endpointInfoToDefinition(ep: EndpointInfo, entityName: string): EntityEndpoint {
    let crudType: CrudOperationType | undefined;

    if (ep.method === 'GET' && !ep.path.includes('{')) {
      crudType = CrudOperationType.GetAll;
    } else if (ep.method === 'GET' && ep.path.includes('{')) {
      crudType = CrudOperationType.GetById;
    } else if (ep.method === 'POST' && !ep.path.includes('{')) {
      crudType = CrudOperationType.Create;
    } else if ((ep.method === 'PUT' || ep.method === 'PATCH') && ep.path.includes('{')) {
      crudType = CrudOperationType.Update;
    } else if (ep.method === 'DELETE' && ep.path.includes('{')) {
      crudType = CrudOperationType.Delete;
    }

    return {
      method: ep.method as HttpMethod,
      path: ep.path,
      operationId: ep.operationId,
      summary: ep.summary,
      parameters: ep.parameters.map(p => ({
        name: p.name,
        in: p.in,
        type: p.type,
        isRequired: p.required,
        description: p.description,
      })),
      requestBody: ep.requestBodyRef
        ? { typeName: ep.requestBodyRef, isArray: false }
        : undefined,
      responseType: ep.responseRef
        ? { typeName: ep.responseRef, isArray: ep.responseIsArray }
        : undefined,
      entityName,
      crudType,
    };
  }

  private pluralize(name: string): string {
    if (name.endsWith('s') || name.endsWith('x') || name.endsWith('z') ||
        name.endsWith('ch') || name.endsWith('sh')) {
      return `${name}es`;
    }
    if (name.endsWith('y') && !/[aeiou]y$/i.test(name)) {
      return `${name.slice(0, -1)}ies`;
    }
    return `${name}s`;
  }

  private detectRelationships(
    entity: EntityDefinition,
    allEntities: EntityDefinition[],
  ): void {
    for (const field of entity.fields) {
      if (!field.refEntityName) continue;

      const targetEntity = allEntities.find(
        e => e.name.toLowerCase() === field.refEntityName!.toLowerCase()
      );
      if (!targetEntity || targetEntity.name === entity.name) continue;

      const isArray = field.isArray;

      entity.relationships.push({
        type: isArray ? RelationType.OneToMany : RelationType.OneToOne,
        sourceEntity: entity.name,
        targetEntity: targetEntity.name,
        sourceField: field.name,
        foreignKey: field.name,
      });
    }
  }
}
