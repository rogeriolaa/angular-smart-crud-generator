import { Injectable } from '@angular/core';
import { EntityDefinition } from '../models';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class RouteGeneratorService {
  generateAll(entities: EntityDefinition[]): GeneratedFile[] {
    if (entities.length === 0) return [];
    return [
      {
        path: 'routes/app.routes.ts',
        content: this.generateAppRoutes(entities),
      },
      ...entities.map(entity => ({
        path: `routes/${this.camelCase(entity.name)}.routes.ts`,
        content: this.generateEntityRoutes(entity),
      })),
    ];
  }

  private generateAppRoutes(entities: EntityDefinition[]): string {
    const lines: string[] = [];
    lines.push('import { Routes } from \'@angular/router\';');
    lines.push('');

    lines.push('export const appRoutes: Routes = [');
    lines.push('  { path: \'\', redirectTo: \'/dashboard\', pathMatch: \'full\' },');

    for (const entity of entities) {
      const camelName = this.camelCase(entity.name);
      const plural = this.kebabCase(entity.namePlural);
      lines.push(`  {`);
      lines.push(`    path: '${plural}',`);
      lines.push(`    loadChildren: () => import('./${camelName}.routes').then(m => m.${entity.name}Routes),`);
      lines.push(`  },`);
    }

    lines.push('];');
    lines.push('');
    return lines.join('\n');
  }

  private generateEntityRoutes(entity: EntityDefinition): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const lines: string[] = [];

    lines.push('import { Routes } from \'@angular/router\';');
    lines.push('');

    lines.push(`export const ${name}Routes: Routes = [`);
    lines.push('  {');
    lines.push(`    path: '',`);
    lines.push(`    loadComponent: () => import('../components/${camelName}-list/${camelName}-list.component').then(m => m.${name}ListComponent),`);
    lines.push('  },');
    lines.push('  {');
    lines.push(`    path: 'new',`);
    lines.push(`    loadComponent: () => import('../components/${camelName}-create/${camelName}-create.component').then(m => m.${name}CreateComponent),`);
    lines.push('  },');
    lines.push('  {');
    lines.push(`    path: ':id',`);
    lines.push(`    loadComponent: () => import('../components/${camelName}-details/${camelName}-details.component').then(m => m.${name}DetailsComponent),`);
    lines.push('  },');
    lines.push('  {');
    lines.push(`    path: ':id/edit',`);
    lines.push(`    loadComponent: () => import('../components/${camelName}-edit/${camelName}-edit.component').then(m => m.${name}EditComponent),`);
    lines.push('  },');
    lines.push('];');
    lines.push('');

    return lines.join('\n');
  }

  private camelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  private kebabCase(name: string): string {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }
}
