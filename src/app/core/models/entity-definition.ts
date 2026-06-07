import { EndpointDefinition } from './endpoint-definition';
import { RelationshipDefinition } from './relationship-definition';

export enum FieldType {
  String = 'string',
  Integer = 'integer',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  Enum = 'enum',
  Array = 'array',
  Object = 'object',
  File = 'file',
  Unknown = 'unknown',
}

export interface ValidatorDefinition {
  type: string;
  value?: unknown;
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isAudit: boolean;
  isSoftDelete: boolean;
  isForeignKey: boolean;
  validators: ValidatorDefinition[];
  description?: string;
  defaultValue?: unknown;
  enumValues?: string[];
  refEntityName?: string;
  isArray: boolean;
}

export interface EntityDefinition {
  name: string;
  namePlural: string;
  description?: string;
  fields: FieldDefinition[];
  endpoints: EndpointDefinition[];
  relationships: RelationshipDefinition[];
  isAuditEntity: boolean;
  hasSoftDelete: boolean;
}
