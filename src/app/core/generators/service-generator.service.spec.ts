import { describe, it, expect } from 'vitest';
import { ServiceGeneratorService } from './service-generator.service';
import { EntityDefinition, FieldType, HttpMethod, CrudOperationType } from '../models';

function makePetEntity(): EntityDefinition {
  return {
    name: 'Pet',
    namePlural: 'Pets',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'name', type: FieldType.String, isRequired: true, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
    ],
    endpoints: [
      { method: HttpMethod.GET, path: '/pet', operationId: 'listPets', parameters: [], crudType: CrudOperationType.GetAll, entityName: 'Pet' },
      { method: HttpMethod.GET, path: '/pet/{petId}', operationId: 'getPetById', parameters: [{ name: 'petId', in: 'path', type: 'integer', isRequired: true }], crudType: CrudOperationType.GetById, entityName: 'Pet' },
      { method: HttpMethod.POST, path: '/pet', operationId: 'addPet', parameters: [], requestBody: { typeName: 'Pet', isArray: false }, crudType: CrudOperationType.Create, entityName: 'Pet' },
      { method: HttpMethod.PUT, path: '/pet/{petId}', operationId: 'updatePet', parameters: [{ name: 'petId', in: 'path', type: 'integer', isRequired: true }], requestBody: { typeName: 'Pet', isArray: false }, crudType: CrudOperationType.Update, entityName: 'Pet' },
      { method: HttpMethod.DELETE, path: '/pet/{petId}', operationId: 'deletePet', parameters: [{ name: 'petId', in: 'path', type: 'integer', isRequired: true }], crudType: CrudOperationType.Delete, entityName: 'Pet' },
    ],
    relationships: [],
    isAuditEntity: false,
    hasSoftDelete: false,
  };
}

function makeEntityWithNoEndpoints(): EntityDefinition {
  return {
    name: 'Tag',
    namePlural: 'Tags',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
    ],
    endpoints: [],
    relationships: [],
    isAuditEntity: false,
    hasSoftDelete: false,
  };
}

describe('ServiceGeneratorService', () => {
  const service = new ServiceGeneratorService();

  describe('generateService', () => {
    it('generates the service class declaration', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('export class PetService {');
      expect(result).toContain('@Injectable({ providedIn: \'root\' })');
    });

    it('injects HttpClient', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('import { HttpClient }');
      expect(result).toContain('inject(HttpClient)');
    });

    it('generates baseUrl', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain("baseUrl = '/api/pet'");
    });

    it('generates getAll method', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('getAll()');
      expect(result).toContain('http.get<Pet[]>');
    });

    it('generates getById method', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('getById(petId: number)');
      expect(result).toContain('http.get<Pet>');
    });

    it('generates create method', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('create(data: CreatePet)');
      expect(result).toContain('http.post<CreatePet>');
    });

    it('generates update method', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('update(petId: number, data: UpdatePet)');
      expect(result).toContain('http.put<Pet>');
    });

    it('generates delete method', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain('delete(petId: number)');
      expect(result).toContain('http.delete<void>');
    });

    it('generates service with no methods when entity has no endpoints', () => {
      const result = service.generateService(makeEntityWithNoEndpoints());
      expect(result).toContain('export class TagService {');
      expect(result).not.toContain('getAll()');
      expect(result).not.toContain('getById()');
      expect(result).not.toContain('create(');
      expect(result).not.toContain('update(');
      expect(result).not.toContain('delete(');
    });

    it('imports models', () => {
      const result = service.generateService(makePetEntity());
      expect(result).toContain("import { Pet, CreatePet, UpdatePet } from '../models/pet'");
    });

    it('uses custom apiBaseUrl when provided', () => {
      const result = service.generateService(makePetEntity(), 'https://api.example.com/v1');
      expect(result).toContain("baseUrl = 'https://api.example.com/v1/pet'");
    });

    it('falls back to default /api/ path when apiBaseUrl is empty', () => {
      const result = service.generateService(makePetEntity(), '');
      expect(result).toContain("baseUrl = '/api/pet'");
    });

    it('uses custom apiBaseUrl in generateAll', () => {
      const entities = [makePetEntity()];
      const files = service.generateAll(entities, 'https://api.example.com');
      expect(files[0].content).toContain("baseUrl = 'https://api.example.com/pet'");
    });
  });

  describe('generateAll', () => {
    it('returns one file per entity', () => {
      const entities = [makePetEntity(), makeEntityWithNoEndpoints()];
      const files = service.generateAll(entities);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('services/pet.service.ts');
      expect(files[1].path).toBe('services/tag.service.ts');
    });

    it('returns empty array for empty input', () => {
      expect(service.generateAll([])).toEqual([]);
    });
  });
});
