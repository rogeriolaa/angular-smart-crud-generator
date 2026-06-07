import { describe, it, expect } from 'vitest';
import { StoreGeneratorService } from './store-generator.service';
import { EntityDefinition, FieldType, HttpMethod, CrudOperationType, StateManagement } from '../models';

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

describe('StoreGeneratorService', () => {
  const service = new StoreGeneratorService();

  describe('generateStore', () => {
    it('generates signalStore declaration', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('export const PetStore = signalStore(');
      expect(result).toContain('import { signalStore, withState, withMethods, patchState }');
    });

    it('generates state interface', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('interface PetState {');
      expect(result).toContain('items: Pet[];');
      expect(result).toContain('selectedItem: Pet | null;');
      expect(result).toContain('loading: boolean;');
    });

    it('injects the service', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('inject(PetService)');
    });

    it('generates loadAll method', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('loadAll()');
      expect(result).toContain('getAll().subscribe');
      expect(result).toContain("patchState(store, { items })");
    });

    it('generates loadById method', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('loadById(petId: number)');
      expect(result).toContain('getById(petId).subscribe');
      expect(result).toContain("patchState(store, { selectedItem })");
    });

    it('generates create method returning Observable', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('create(data: CreatePet): Observable<Pet>');
      expect(result).toContain('return petService.create(data)');
    });

    it('generates update method', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('update(petId: number, data: UpdatePet): Observable<Pet>');
      expect(result).toContain('return petService.update(petId, data)');
    });

    it('generates delete method', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain('delete(petId: number): Observable<void>');
      expect(result).toContain('return petService.delete(petId)');
    });

    it('generates store with no methods when entity has no endpoints', () => {
      const result = service.generateStore(makeEntityWithNoEndpoints());
      expect(result).toContain('export const TagStore = signalStore(');
      expect(result).not.toContain('loadAll()');
      expect(result).not.toContain('loadById()');
      expect(result).not.toContain('create(');
      expect(result).not.toContain('update(');
      expect(result).not.toContain('delete(');
    });

    it('imports models', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain("import { Pet, CreatePet, UpdatePet } from '../models/pet'");
    });

    it('imports the service', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain("import { PetService } from '../services/pet.service'");
    });

    it('imports Observable from rxjs', () => {
      const result = service.generateStore(makePetEntity());
      expect(result).toContain("import { Observable } from 'rxjs'");
    });
  });

  describe('generateAll', () => {
    it('returns one file per entity', () => {
      const entities = [makePetEntity(), makeEntityWithNoEndpoints()];
      const files = service.generateAll(entities);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('stores/pet.store.ts');
      expect(files[1].path).toBe('stores/tag.store.ts');
    });

    it('returns empty array for empty input', () => {
      expect(service.generateAll([])).toEqual([]);
    });
  });

  describe('ComponentStore', () => {
    const csService = new StoreGeneratorService();

    it('generates ComponentStore class', () => {
      const result = csService.generateStore(makePetEntity(), StateManagement.ComponentStore);
      expect(result).toContain('export class PetStore extends ComponentStore<PetState>');
      expect(result).toContain("import { ComponentStore } from '@ngrx/component-store'");
    });

    it('uses toSignal for reactive signals', () => {
      const result = csService.generateStore(makePetEntity(), StateManagement.ComponentStore);
      expect(result).toContain("import { toSignal } from '@angular/core/rxjs-interop'");
      expect(result).toContain('toSignal(this.select(state => state.items),');
    });

    it('generates loadAll effect', () => {
      const result = csService.generateStore(makePetEntity(), StateManagement.ComponentStore);
      expect(result).toContain('readonly loadAll = this.effect<void>');
      expect(result).toContain('switchMap(() =>');
    });

    it('generates CRUD methods returning observables', () => {
      const result = csService.generateStore(makePetEntity(), StateManagement.ComponentStore);
      expect(result).toContain('create(data: CreatePet): Observable<Pet>');
      expect(result).toContain('update(petId: number, data: UpdatePet): Observable<Pet>');
      expect(result).toContain('delete(petId: number): Observable<void>');
    });

    it('patches state on loadById effect', () => {
      const result = csService.generateStore(makePetEntity(), StateManagement.ComponentStore);
      expect(result).toContain('this.patchState({ selectedItem })');
    });

    it('generates store with no methods when no endpoints', () => {
      const result = csService.generateStore(makeEntityWithNoEndpoints(), StateManagement.ComponentStore);
      expect(result).not.toContain('loadAll');
      expect(result).not.toContain('loadById');
    });

    it('generateAll creates store files', () => {
      const files = csService.generateAll([makePetEntity()], StateManagement.ComponentStore);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('stores/pet.store.ts');
    });
  });
});
