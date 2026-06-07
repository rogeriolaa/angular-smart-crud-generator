import { describe, it, expect } from 'vitest';
import { OpenApiParserService } from './openapi-parser.service';
import { MetadataEngineService } from './metadata-engine.service';
import { ModelGeneratorService } from '../generators/model-generator.service';
import { ServiceGeneratorService } from '../generators/service-generator.service';
import { FormGeneratorService } from '../generators/form-generator.service';
import { ComponentGeneratorService } from '../generators/component-generator.service';
import { RouteGeneratorService } from '../generators/route-generator.service';
import { StoreGeneratorService } from '../generators/store-generator.service';
import { GeneratorOrchestratorService } from './generator-orchestrator.service';
import { UIFramework, StateManagement, FormType, GeneratorContext } from '../models';

const PETSTORE_YAML = `
openapi: 3.0.0
info:
  title: Swagger Petstore
  version: 1.0.0
paths:
  /pet:
    get:
      operationId: listPets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      operationId: addPet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "200":
          description: Pet created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pet/{petId}:
    get:
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: A pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
    put:
      operationId: updatePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "200":
          description: Pet updated
    delete:
      operationId: deletePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "204":
          description: Pet deleted
components:
  schemas:
    Pet:
      type: object
      required:
        - name
      properties:
        id:
          type: integer
        name:
          type: string
        category:
          $ref: "#/components/schemas/Category"
    Category:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
`;

function makeContext(overrides?: Partial<GeneratorContext>): GeneratorContext {
  return {
    uiFramework: UIFramework.Raw,
    stateManagement: StateManagement.Signals,
    formType: FormType.Reactive,
    angularVersion: '21',
    apiBaseUrl: '',
    selectedEntities: [],
    ...overrides,
  };
}

describe('GeneratorOrchestratorService', () => {
  const parser = new OpenApiParserService();
  const metadataEngine = new MetadataEngineService();
  const modelGen = new ModelGeneratorService();
  const serviceGen = new ServiceGeneratorService();
  const formGen = new FormGeneratorService();
  const componentGen = new ComponentGeneratorService();
  const routeGen = new RouteGeneratorService();
  const storeGen = new StoreGeneratorService();

  const orchestrator = new GeneratorOrchestratorService(
    parser, metadataEngine, modelGen, serviceGen, formGen, componentGen, routeGen, storeGen,
  );

  describe('generate', () => {
    it('parses spec and returns generated files', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      expect(result.errors).toEqual([]);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('generates model files', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const modelFiles = result.files.filter(f => f.path.startsWith('models/'));
      expect(modelFiles.length).toBeGreaterThan(0);
      expect(modelFiles[0].path).toBe('models/pet.ts');
    });

    it('generates service files', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const serviceFiles = result.files.filter(f => f.path.startsWith('services/'));
      expect(serviceFiles.length).toBeGreaterThan(0);
      expect(serviceFiles[0].path).toBe('services/pet.service.ts');
    });

    it('generates form files', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const formFiles = result.files.filter(f => f.path.startsWith('forms/'));
      expect(formFiles.length).toBeGreaterThan(0);
    });

    it('generates component files (4 per entity)', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const componentFiles = result.files.filter(f => f.path.startsWith('components/'));
      expect(componentFiles.length).toBe(8); // 4 files each for Pet + Category
    });

    it('generates route files (app routes + one per entity)', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const routeFiles = result.files.filter(f => f.path.startsWith('routes/'));
      expect(routeFiles.length).toBe(3); // app.routes + pet.routes + category.routes
    });

    it('filters by selected entities', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext({ selectedEntities: ['Category'] }));
      const modelFiles = result.files.filter(f => f.path.startsWith('models/'));
      expect(modelFiles).toHaveLength(1);
      expect(modelFiles[0].path).toBe('models/category.ts');
    });

    it('returns errors for invalid spec', () => {
      const result = orchestrator.generate('not valid', makeContext());
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.files).toEqual([]);
    });

    it('returns errors for spec with no schemas', () => {
      const result = orchestrator.generate(JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
      }), makeContext());
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.files).toEqual([]);
    });

    it('filters to all entities when none selected', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const modelFiles = result.files.filter(f => f.path.startsWith('models/'));
      expect(modelFiles.length).toBe(2); // Pet + Category
    });

    it('model file content contains proper interface', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext());
      const petModel = result.files.find(f => f.path === 'models/pet.ts');
      expect(petModel).toBeDefined();
      expect(petModel!.content).toContain('export interface Pet {');
    });

    it('generates store files when state management is SignalStore', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext({ stateManagement: StateManagement.SignalStore }));
      const storeFiles = result.files.filter(f => f.path.startsWith('stores/'));
      expect(storeFiles.length).toBe(2);
      expect(storeFiles[0].path).toBe('stores/pet.store.ts');
      expect(storeFiles[1].path).toBe('stores/category.store.ts');
    });

    it('does not generate store files when state management is Signals', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext({ stateManagement: StateManagement.Signals }));
      const storeFiles = result.files.filter(f => f.path.startsWith('stores/'));
      expect(storeFiles.length).toBe(0);
    });

    it('generates store files when state management is ComponentStore', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext({ stateManagement: StateManagement.ComponentStore }));
      const storeFiles = result.files.filter(f => f.path.startsWith('stores/'));
      expect(storeFiles.length).toBe(2);
      expect(storeFiles[0].path).toBe('stores/pet.store.ts');
    });

    it('does not generate store files when state management is None', () => {
      const result = orchestrator.generate(PETSTORE_YAML, makeContext({ stateManagement: StateManagement.None }));
      const storeFiles = result.files.filter(f => f.path.startsWith('stores/'));
      expect(storeFiles.length).toBe(0);
    });
  });
});
