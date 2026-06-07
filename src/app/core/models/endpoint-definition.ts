export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum CrudOperationType {
  GetAll = 'getAll',
  GetById = 'getById',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export interface ParameterDefinition {
  name: string;
  in: string;
  type: string;
  isRequired: boolean;
  description?: string;
}

export interface TypeReference {
  typeName: string;
  isArray: boolean;
}

export interface EndpointDefinition {
  method: HttpMethod;
  path: string;
  operationId: string;
  summary?: string;
  parameters: ParameterDefinition[];
  requestBody?: TypeReference;
  responseType?: TypeReference;
  entityName?: string;
  crudType?: CrudOperationType;
}
