import { Injectable } from '@angular/core';
import { EntityDefinition, CrudOperationType, EndpointDefinition, HttpMethod } from '../models';
import { GeneratedFile } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceGeneratorService {
  generateAll(entities: EntityDefinition[], apiBaseUrl = ''): GeneratedFile[] {
    return entities.map(entity => ({
      path: `services/${this.camelCase(entity.name)}.service.ts`,
      content: this.generateService(entity, apiBaseUrl),
    }));
  }

  generateService(entity: EntityDefinition, apiBaseUrl = ''): string {
    const name = entity.name;
    const camelName = this.camelCase(name);
    const lines: string[] = [];

    lines.push('import { Injectable, inject } from \'@angular/core\';');
    lines.push('import { HttpClient } from \'@angular/common/http\';');
    lines.push('import { Observable } from \'rxjs\';');
    lines.push(`import { ${name}, Create${name}, Update${name} } from '../models/${camelName}';`);
    lines.push('');

    lines.push('@Injectable({ providedIn: \'root\' })');
    lines.push(`export class ${name}Service {`);
    lines.push('  private readonly http = inject(HttpClient);');
    const baseUrl = apiBaseUrl ? `'${apiBaseUrl}/${this.kebabCase(name)}'` : `'/api/${this.kebabCase(name)}'`;
    lines.push(`  private readonly baseUrl = ${baseUrl};`);
    lines.push('');

    const getById = entity.endpoints.find(e => e.crudType === CrudOperationType.GetById);
    const getAll = entity.endpoints.find(e => e.crudType === CrudOperationType.GetAll);
    const create = entity.endpoints.find(e => e.crudType === CrudOperationType.Create);
    const update = entity.endpoints.find(e => e.crudType === CrudOperationType.Update);
    const del = entity.endpoints.find(e => e.crudType === CrudOperationType.Delete);

    if (getAll) {
      lines.push('  getAll(): Observable<Create' + name + '[]> {');
      lines.push(`    return this.http.get<${name}[]>(\`\${this.baseUrl}\`);`);
      lines.push('  }');
      lines.push('');
    }

    if (getById) {
      const idParam = this.findPathParameter(getById);
      lines.push(`  getById(${idParam.name}: ${idParam.type}): Observable<${name}> {`);
      lines.push(`    return this.http.get<${name}>(\`\${this.baseUrl}/\${${idParam.name}}\`);`);
      lines.push('  }');
      lines.push('');
    }

    if (create) {
      lines.push(`  create(data: Create${name}): Observable<${name}> {`);
      lines.push('    return this.http.post<Create' + name + `>(\`\${this.baseUrl}\`, data);`);
      lines.push('  }');
      lines.push('');
    }

    if (update) {
      const idParam = this.findPathParameter(update);
      lines.push(`  update(${idParam.name}: ${idParam.type}, data: Update${name}): Observable<${name}> {`);
      lines.push(`    return this.http.put<${name}>(\`\${this.baseUrl}/\${${idParam.name}}\`, data);`);
      lines.push('  }');
      lines.push('');
    }

    if (del) {
      const idParam = this.findPathParameter(del);
      lines.push(`  delete(${idParam.name}: ${idParam.type}): Observable<void> {`);
      lines.push(`    return this.http.delete<void>(\`\${this.baseUrl}/\${${idParam.name}}\`);`);
      lines.push('  }');
      lines.push('');
    }

    lines.push('}');
    lines.push('');

    return lines.join('\n');
  }

  private findPathParameter(endpoint: EndpointDefinition): { name: string; type: string } {
    const pathParam = endpoint.parameters.find(p => p.in === 'path');
    if (pathParam) {
      return { name: pathParam.name, type: this.mapType(pathParam.type) };
    }
    return { name: 'id', type: 'number' };
  }

  private mapType(type: string): string {
    switch (type) {
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'string';
    }
  }

  private camelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }

  private kebabCase(name: string): string {
    return name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  }
}
