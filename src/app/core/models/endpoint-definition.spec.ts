import { describe, it, expect } from 'vitest';
import {
  HttpMethod, CrudOperationType, EndpointDefinition, ParameterDefinition, TypeReference,
} from './endpoint-definition';

describe('HttpMethod', () => {
  it('has expected values', () => {
    expect(HttpMethod.GET).toBe('GET');
    expect(HttpMethod.POST).toBe('POST');
    expect(HttpMethod.PUT).toBe('PUT');
    expect(HttpMethod.PATCH).toBe('PATCH');
    expect(HttpMethod.DELETE).toBe('DELETE');
  });
});

describe('CrudOperationType', () => {
  it('has expected values', () => {
    expect(CrudOperationType.GetAll).toBe('getAll');
    expect(CrudOperationType.GetById).toBe('getById');
    expect(CrudOperationType.Create).toBe('create');
    expect(CrudOperationType.Update).toBe('update');
    expect(CrudOperationType.Delete).toBe('delete');
  });
});

describe('EndpointDefinition', () => {
  it('can be instantiated with all fields', () => {
    const params: ParameterDefinition[] = [
      { name: 'petId', in: 'path', type: 'integer', isRequired: true },
    ];

    const responseType: TypeReference = { typeName: 'Pet', isArray: false };
    const requestBody: TypeReference = { typeName: 'Pet', isArray: false };

    const endpoint: EndpointDefinition = {
      method: HttpMethod.GET,
      path: '/pet/{petId}',
      operationId: 'getPetById',
      summary: 'Find pet by ID',
      parameters: params,
      responseType,
      requestBody,
      entityName: 'Pet',
      crudType: CrudOperationType.GetById,
    };

    expect(endpoint.method).toBe(HttpMethod.GET);
    expect(endpoint.path).toBe('/pet/{petId}');
    expect(endpoint.operationId).toBe('getPetById');
    expect(endpoint.parameters).toHaveLength(1);
    expect(endpoint.responseType?.typeName).toBe('Pet');
    expect(endpoint.requestBody?.typeName).toBe('Pet');
    expect(endpoint.entityName).toBe('Pet');
    expect(endpoint.crudType).toBe(CrudOperationType.GetById);
  });

  it('works with minimal fields', () => {
    const endpoint: EndpointDefinition = {
      method: HttpMethod.GET,
      path: '/pets',
      operationId: 'listPets',
      parameters: [],
    };
    expect(endpoint.parameters).toEqual([]);
    expect(endpoint.responseType).toBeUndefined();
    expect(endpoint.crudType).toBeUndefined();
  });
});
