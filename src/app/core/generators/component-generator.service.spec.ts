import { describe, it, expect } from 'vitest';
import { ComponentGeneratorService } from './component-generator.service';
import { EntityDefinition, FieldType, HttpMethod, CrudOperationType, UIFramework, StateManagement } from '../models';

function makePetEntity(): EntityDefinition {
  return {
    name: 'Pet',
    namePlural: 'Pets',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'name', type: FieldType.String, isRequired: true, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
      { name: 'status', type: FieldType.Enum, isRequired: false, isPrimaryKey: false, isAudit: false, isSoftDelete: false, isForeignKey: false, enumValues: ['available', 'pending'], validators: [], isArray: false },
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

describe('ComponentGeneratorService', () => {
  const service = new ComponentGeneratorService();

  describe('generateAll', () => {
    it('returns 4 component files per entity', () => {
      const entities = [makePetEntity()];
      const files = service.generateAll(entities);
      expect(files).toHaveLength(4);
      const paths = files.map(f => f.path);
      expect(paths).toContain('components/pet-list/pet-list.component.ts');
      expect(paths).toContain('components/pet-create/pet-create.component.ts');
      expect(paths).toContain('components/pet-edit/pet-edit.component.ts');
      expect(paths).toContain('components/pet-details/pet-details.component.ts');
    });

    it('returns empty array for empty input', () => {
      expect(service.generateAll([])).toEqual([]);
    });
  });

  describe('list component', () => {
    it('injects the service', () => {
      const files = service.generateAll([makePetEntity()]);
      const list = files.find(f => f.path.includes('pet-list'))!;
      expect(list.content).toContain('inject(PetService)');
    });

    it('has items signal', () => {
      const files = service.generateAll([makePetEntity()]);
      const list = files.find(f => f.path.includes('pet-list'))!;
      expect(list.content).toContain('signal<Pet[]>');
    });

    it('calls getAll in constructor', () => {
      const files = service.generateAll([makePetEntity()]);
      const list = files.find(f => f.path.includes('pet-list'))!;
      expect(list.content).toContain('getAll()');
    });
  });

  describe('create component', () => {
    it('has form, error signal, and submit handler', () => {
      const files = service.generateAll([makePetEntity()]);
      const create = files.find(f => f.path.includes('pet-create'))!;
      expect(create.content).toContain('createPetForm()');
      expect(create.content).toContain('signal<string | null>');
      expect(create.content).toContain('onSubmit()');
    });

    it('generates template HTML with form fields', () => {
      const files = service.generateAll([makePetEntity()]);
      const create = files.find(f => f.path.includes('pet-create'))!;
      expect(create.content).toContain('name');
      expect(create.content).toContain('template');
    });
  });

  describe('edit component', () => {
    it('has form, id from route, and patchValue', () => {
      const files = service.generateAll([makePetEntity()]);
      const edit = files.find(f => f.path.includes('pet-edit'))!;
      expect(edit.content).toContain('ActivatedRoute');
      expect(edit.content).toContain('patchValue');
      expect(edit.content).toContain('getById');
    });

    it('calls update on submit', () => {
      const files = service.generateAll([makePetEntity()]);
      const edit = files.find(f => f.path.includes('pet-edit'))!;
      expect(edit.content).toContain('service.update');
    });
  });

  describe('details component', () => {
    it('has item signal and gets data by id', () => {
      const files = service.generateAll([makePetEntity()]);
      const details = files.find(f => f.path.includes('pet-details'))!;
      expect(details.content).toContain('signal<Pet | null>');
      expect(details.content).toContain('getById');
    });
  });

  describe('uiFramework', () => {
    describe('Raw (default)', () => {
      it('generates plain button classes in create template', () => {
        const files = service.generateAll([makePetEntity()]);
        const create = files.find(f => f.path.includes('pet-create'))!;
        expect(create.content).toContain('bg-blue-500');
        expect(create.content).toContain('bg-gray-300');
      });

      it('no framework imports in list', () => {
        const files = service.generateAll([makePetEntity()]);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).not.toContain('MatTable');
        expect(list.content).not.toContain('TableModule');
      });
    });

    describe('Material', () => {
      it('generates mat-raised-button and matInput in create', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Material);
        const create = files.find(f => f.path.includes('pet-create'))!;
        expect(create.content).toContain('mat-raised-button');
        expect(create.content).toContain('matInput');
        expect(create.content).toContain('mat-form-field');
        expect(create.content).toContain('MatInputModule');
        expect(create.content).toContain('MatButtonModule');
      });

      it('uses mat-table in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Material);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('mat-table');
        expect(list.content).toContain('MatTableModule');
        expect(list.content).toContain('mat-header-row');
      });
    });

    describe('PrimeNG', () => {
      it('generates pButton and pInputText in create', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.PrimeNG);
        const create = files.find(f => f.path.includes('pet-create'))!;
        expect(create.content).toContain('pButton');
        expect(create.content).toContain('pInputText');
        expect(create.content).toContain('InputTextModule');
        expect(create.content).toContain('ButtonModule');
      });

      it('uses p-table in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.PrimeNG);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('p-table');
        expect(list.content).toContain('TableModule');
      });
    });
  });

  describe('stateManagement', () => {
    describe('Signals (default)', () => {
      it('injects service in list component', () => {
        const files = service.generateAll([makePetEntity()]);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('inject(PetService)');
        expect(list.content).not.toContain('inject(PetStore)');
      });

      it('uses signal<> for items in list', () => {
        const files = service.generateAll([makePetEntity()]);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('signal<Pet[]>');
      });

      it('subscribes to getAll in list constructor', () => {
        const files = service.generateAll([makePetEntity()]);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('getAll().subscribe');
      });
    });

    describe('SignalStore', () => {
      it('injects store instead of service in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.SignalStore);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('inject(PetStore)');
        expect(list.content).not.toContain('inject(PetService)');
      });

      it('uses store.items signal in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.SignalStore);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).not.toContain('signal<Pet[]>');
        expect(list.content).toContain('this.store.items');
      });

      it('calls store.loadAll in list constructor', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.SignalStore);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('store.loadAll()');
        expect(list.content).not.toContain('getAll().subscribe');
      });

      it('injects store in create component', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.SignalStore);
        const create = files.find(f => f.path.includes('pet-create'))!;
        expect(create.content).toContain('inject(PetStore)');
        expect(create.content).not.toContain('inject(PetService)');
      });

      it('injects store in edit component with effect for patching', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.SignalStore);
        const edit = files.find(f => f.path.includes('pet-edit'))!;
        expect(edit.content).toContain('inject(PetStore)');
        expect(edit.content).toContain('effect(');
        expect(edit.content).toContain('store.selectedItem()');
      });

      it('injects store in details component', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.SignalStore);
        const details = files.find(f => f.path.includes('pet-details'))!;
        expect(details.content).toContain('inject(PetStore)');
        expect(details.content).toContain('this.store.selectedItem');
        expect(details.content).not.toContain('signal<Pet | null>');
      });
    });

    describe('ComponentStore', () => {
      it('injects store instead of service in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.ComponentStore);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('inject(PetStore)');
        expect(list.content).not.toContain('inject(PetService)');
      });

      it('uses store.items signal in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.ComponentStore);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('this.store.items');
      });

      it('calls store.loadAll in list constructor', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.ComponentStore);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).toContain('store.loadAll()');
      });

      it('uses store in create component', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.ComponentStore);
        const create = files.find(f => f.path.includes('pet-create'))!;
        expect(create.content).toContain('inject(PetStore)');
      });

      it('uses store in edit component', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.ComponentStore);
        const edit = files.find(f => f.path.includes('pet-edit'))!;
        expect(edit.content).toContain('inject(PetStore)');
        expect(edit.content).toContain('effect(');
      });

      it('uses store in details component', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.ComponentStore);
        const details = files.find(f => f.path.includes('pet-details'))!;
        expect(details.content).toContain('inject(PetStore)');
        expect(details.content).toContain('this.store.selectedItem');
      });
    });

    describe('None', () => {
      it('does not inject service or store in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.None);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).not.toContain('inject(PetService)');
        expect(list.content).not.toContain('inject(PetStore)');
      });

      it('does not import models in list', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.None);
        const list = files.find(f => f.path.includes('pet-list'))!;
        expect(list.content).not.toContain("import { Pet }");
        expect(list.content).toContain('@Component');
      });

      it('does not inject service in create', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.None);
        const create = files.find(f => f.path.includes('pet-create'))!;
        expect(create.content).not.toContain('inject(');
      });

      it('does not inject service in edit', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.None);
        const edit = files.find(f => f.path.includes('pet-edit'))!;
        expect(edit.content).not.toContain('inject(');
      });

      it('does not inject service in details', () => {
        const files = service.generateAll([makePetEntity()], UIFramework.Raw, StateManagement.None);
        const details = files.find(f => f.path.includes('pet-details'))!;
        expect(details.content).not.toContain('inject(');
      });
    });
  });
});
