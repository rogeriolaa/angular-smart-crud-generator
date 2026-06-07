import { Injectable } from '@angular/core';
import { parse as parseYaml } from 'yaml';

export interface SchemaProperty {
  name: string;
  type: string;
  format?: string;
  description?: string;
  example?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  enumValues?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: SchemaProperty;
  ref?: string;
  properties?: SchemaProperty[];
  required?: boolean;
}

export interface SchemaInfo {
  name: string;
  type: string;
  required: string[];
  properties: SchemaProperty[];
  description?: string;
}

export interface EndpointInfo {
  path: string;
  method: string;
  operationId: string;
  summary?: string;
  parameters: Array<{
    name: string;
    in: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  requestBodyRef?: string;
  requestBodyType?: string;
  responseRef?: string;
  responseType?: string;
  responseIsArray: boolean;
}

export interface ParseResult {
  title: string;
  version: string;
  schemas: SchemaInfo[];
  endpoints: EndpointInfo[];
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class OpenApiParserService {
  parse(raw: string): ParseResult {
    const errors: string[] = [];
    let doc: Record<string, unknown>;

    try {
      doc = parseYaml(raw);
      if (typeof doc !== 'object' || doc === null) {
        return { title: '', version: '', schemas: [], endpoints: [], errors: ['Input is not a valid object'] };
      }
    } catch {
      try {
        doc = JSON.parse(raw);
      } catch {
        return { title: '', version: '', schemas: [], endpoints: [], errors: ['Failed to parse input as JSON or YAML'] };
      }
    }

    if (!doc['openapi']) {
      errors.push('Missing required field: openapi');
    }

    const info = doc['info'] as Record<string, unknown> | undefined;
    const title = (info?.['title'] as string) || '';
    const version = (info?.['version'] as string) || '';
    const paths = doc['paths'] as Record<string, unknown> | undefined;
    const schemas = doc['components'] as Record<string, unknown> | undefined;
    const componentSchemas = schemas?.['schemas'] as Record<string, unknown> | undefined;

    const parsedSchemas = this.parseSchemas(componentSchemas);
    const parsedEndpoints = this.parseEndpoints(paths);

    return {
      title,
      version,
      schemas: parsedSchemas,
      endpoints: parsedEndpoints,
      errors,
    };
  }

  private parseSchemas(schemas?: Record<string, unknown>): SchemaInfo[] {
    if (!schemas) return [];
    return Object.entries(schemas).map(([name, schema]) =>
      this.parseSchema(name, schema as Record<string, unknown>)
    );
  }

  private parseSchema(name: string, schema: Record<string, unknown>): SchemaInfo {
    const required = (schema['required'] as string[]) || [];
    const rawProperties = schema['properties'] as Record<string, unknown> | undefined;

    const properties: SchemaProperty[] = [];
    if (rawProperties) {
      for (const [propName, propValue] of Object.entries(rawProperties)) {
        const prop = propValue as Record<string, unknown>;
        const ref = this.extractRef(prop);
        const items = prop['items'] as Record<string, unknown> | undefined;
        let itemsProp: SchemaProperty | undefined;
        if (items) {
          itemsProp = {
            name: '',
            type: (items['type'] as string) || 'object',
            ref: this.extractRef(items),
          };
        }

        properties.push({
          name: propName,
          type: ref ? 'object' : ((prop['type'] as string) || 'unknown'),
          format: prop['format'] as string | undefined,
          description: prop['description'] as string | undefined,
          example: prop['example'],
          nullable: prop['nullable'] as boolean | undefined,
          readOnly: prop['readOnly'] as boolean | undefined,
          enumValues: prop['enum'] as string[] | undefined,
          minLength: prop['minLength'] as number | undefined,
          maxLength: prop['maxLength'] as number | undefined,
          minimum: prop['minimum'] as number | undefined,
          maximum: prop['maximum'] as number | undefined,
          pattern: prop['pattern'] as string | undefined,
          ref,
          items: itemsProp,
          required: required.includes(propName),
        });
      }
    }

    return {
      name,
      type: (schema['type'] as string) || 'object',
      required,
      properties,
      description: schema['description'] as string | undefined,
    };
  }

  private parseEndpoints(paths?: Record<string, unknown>): EndpointInfo[] {
    if (!paths) return [];
    const endpoints: EndpointInfo[] = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
      for (const method of methods) {
        const operation = (pathItem as Record<string, unknown>)?.[method] as
          | Record<string, unknown>
          | undefined;
        if (!operation) continue;

        const rawParams = (operation['parameters'] as Record<string, unknown>[]) || [];
        const parameters = rawParams.map((p) => ({
          name: p['name'] as string,
          in: p['in'] as string,
          type: ((p['schema'] as Record<string, unknown>)?.['type'] as string) || 'string',
          required: (p['required'] as boolean) || false,
          description: p['description'] as string | undefined,
        }));

        const requestBody = operation['requestBody'] as Record<string, unknown> | undefined;
        const requestBodyRef = this.extractRefFromContent(requestBody);
        const requestBodyType = this.extractTypeFromContent(requestBody);

        const successResponse = this.findSuccessResponse(
          operation['responses'] as Record<string, unknown> | undefined
        );
        const responseRef = successResponse ? this.extractRefFromContent(successResponse) : undefined;
        const responseType = successResponse ? this.extractTypeFromContent(successResponse) : undefined;
    const responseSchema = successResponse ? this.extractSchemaFromContent(successResponse) : undefined;
    const responseIsArray = responseSchema?.['type'] === 'array' || !!responseSchema?.['items'];

        endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: (operation['operationId'] as string) || '',
          summary: operation['summary'] as string | undefined,
          parameters,
          requestBodyRef,
          requestBodyType,
          responseRef,
          responseType,
          responseIsArray,
        });
      }
    }

    return endpoints;
  }

  private extractRef(prop: Record<string, unknown>): string | undefined {
    const ref = prop['$ref'] as string | undefined;
    if (ref) {
      return ref.replace(/^#\/components\/schemas\//, '');
    }
    if (prop['type'] === 'array' && prop['items']) {
      const items = prop['items'] as Record<string, unknown>;
      return this.extractRef(items);
    }
    return undefined;
  }

  private extractRefFromContent(
    obj?: Record<string, unknown>
  ): string | undefined {
    const content = obj?.['content'] as Record<string, unknown> | undefined;
    if (!content) return undefined;
    const mediaType = Object.values(content)[0] as Record<string, unknown> | undefined;
    const schema = mediaType?.['schema'] as Record<string, unknown> | undefined;
    if (!schema) return undefined;
    return this.extractRef(schema);
  }

  private extractTypeFromContent(obj?: Record<string, unknown>): string | undefined {
    const content = obj?.['content'] as Record<string, unknown> | undefined;
    if (!content) return undefined;
    const mediaType = Object.values(content)[0] as Record<string, unknown> | undefined;
    const schema = mediaType?.['schema'] as Record<string, unknown> | undefined;
    if (!schema) return undefined;
    return (schema['type'] as string) || undefined;
  }

  private extractSchemaFromContent(
    obj?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    const content = obj?.['content'] as Record<string, unknown> | undefined;
    if (!content) return undefined;
    const mediaType = Object.values(content)[0] as Record<string, unknown> | undefined;
    return mediaType?.['schema'] as Record<string, unknown> | undefined;
  }

  private findSuccessResponse(
    responses?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!responses) return undefined;
    const successCodes = ['200', '201', 'default'];
    for (const code of successCodes) {
      if (responses[code]) {
        return responses[code] as Record<string, unknown>;
      }
    }
    return undefined;
  }
}
