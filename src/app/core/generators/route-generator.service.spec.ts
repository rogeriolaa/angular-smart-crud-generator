import { describe, it, expect } from 'vitest';
import { RouteGeneratorService } from './route-generator.service';
import { EntityDefinition, FieldType } from '../models';

function makePetEntity(): EntityDefinition {
  return {
    name: 'Pet',
    namePlural: 'Pets',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
    ],
    endpoints: [],
    relationships: [],
    isAuditEntity: false,
    hasSoftDelete: false,
  };
}

function makeUserEntity(): EntityDefinition {
  return {
    name: 'User',
    namePlural: 'Users',
    fields: [
      { name: 'id', type: FieldType.Integer, isRequired: true, isPrimaryKey: true, isAudit: false, isSoftDelete: false, isForeignKey: false, validators: [], isArray: false },
    ],
    endpoints: [],
    relationships: [],
    isAuditEntity: false,
    hasSoftDelete: false,
  };
}

describe('RouteGeneratorService', () => {
  const service = new RouteGeneratorService();

  describe('generateAll', () => {
    it('returns app routes + one file per entity', () => {
      const entities = [makePetEntity()];
      const files = service.generateAll(entities);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('routes/app.routes.ts');
      expect(files[1].path).toBe('routes/pet.routes.ts');
    });

    it('returns empty array for empty input', () => {
      expect(service.generateAll([])).toEqual([]);
    });

    it('generates app routes with redirect', () => {
      const entities = [makePetEntity()];
      const files = service.generateAll(entities);
      const appRoutes = files.find(f => f.path === 'routes/app.routes.ts')!;
      expect(appRoutes.content).toContain("redirectTo: '/dashboard'");
    });

    it('generates app routes with lazy-loaded entity paths', () => {
      const entities = [makePetEntity(), makeUserEntity()];
      const files = service.generateAll(entities);
      const appRoutes = files.find(f => f.path === 'routes/app.routes.ts')!;
      expect(appRoutes.content).toContain("path: 'pets'");
      expect(appRoutes.content).toContain("path: 'users'");
      expect(appRoutes.content).toContain("PetRoutes");
      expect(appRoutes.content).toContain("UserRoutes");
    });
  });

  describe('entity routes', () => {
    it('generates four routes: list, create, details, edit', () => {
      const files = service.generateAll([makePetEntity()]);
      const petRoutes = files.find(f => f.path === 'routes/pet.routes.ts')!;
      expect(petRoutes.content).toContain("path: ''");
      expect(petRoutes.content).toContain("path: 'new'");
      expect(petRoutes.content).toContain("path: ':id'");
      expect(petRoutes.content).toContain("path: ':id/edit'");
    });

    it('uses lazy loadComponent for all routes', () => {
      const files = service.generateAll([makePetEntity()]);
      const petRoutes = files.find(f => f.path === 'routes/pet.routes.ts')!;
      const loadComponentMatches = petRoutes.content.match(/loadComponent:/g);
      expect(loadComponentMatches).toHaveLength(4);
    });

    it('exports correctly named route array', () => {
      const files = service.generateAll([makePetEntity()]);
      const petRoutes = files.find(f => f.path === 'routes/pet.routes.ts')!;
      expect(petRoutes.content).toContain('PetRoutes');
    });

    it('generates correct import paths', () => {
      const files = service.generateAll([makePetEntity()]);
      const petRoutes = files.find(f => f.path === 'routes/pet.routes.ts')!;
      expect(petRoutes.content).toContain("'../components/pet-list/pet-list.component'");
      expect(petRoutes.content).toContain("'../components/pet-create/pet-create.component'");
      expect(petRoutes.content).toContain("'../components/pet-details/pet-details.component'");
      expect(petRoutes.content).toContain("'../components/pet-edit/pet-edit.component'");
    });
  });
});
