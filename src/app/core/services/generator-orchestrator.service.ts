import { Injectable } from '@angular/core';
import { OpenApiParserService, ParseResult } from './openapi-parser.service';
import { MetadataEngineService } from './metadata-engine.service';
import { ModelGeneratorService } from '../generators/model-generator.service';
import { ServiceGeneratorService } from '../generators/service-generator.service';
import { FormGeneratorService } from '../generators/form-generator.service';
import { ComponentGeneratorService } from '../generators/component-generator.service';
import { RouteGeneratorService } from '../generators/route-generator.service';
import { StoreGeneratorService } from '../generators/store-generator.service';
import { GeneratorContext, GeneratedFile, StateManagement } from '../models';

export interface OrchestrationResult {
  files: GeneratedFile[];
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class GeneratorOrchestratorService {
  constructor(
    private readonly parser: OpenApiParserService,
    private readonly metadataEngine: MetadataEngineService,
    private readonly modelGenerator: ModelGeneratorService,
    private readonly serviceGenerator: ServiceGeneratorService,
    private readonly formGenerator: FormGeneratorService,
    private readonly componentGenerator: ComponentGeneratorService,
    private readonly routeGenerator: RouteGeneratorService,
    private readonly storeGenerator: StoreGeneratorService,
  ) {}

  generate(raw: string, context: GeneratorContext): OrchestrationResult {
    const parseResult: ParseResult = this.parser.parse(raw);
    if (parseResult.errors.length > 0) {
      return { files: [], errors: parseResult.errors };
    }

    if (parseResult.schemas.length === 0) {
      return { files: [], errors: ['No schemas found in the specification'] };
    }

    const allEntities = this.metadataEngine.build(parseResult);
    if (allEntities.length === 0) {
      return { files: [], errors: ['No entities could be extracted from the specification'] };
    }

    const selectedEntities =
      context.selectedEntities.length > 0
        ? allEntities.filter(e => context.selectedEntities.includes(e.name))
        : allEntities;

    const files: GeneratedFile[] = [
      ...this.modelGenerator.generateAll(selectedEntities),
      ...this.serviceGenerator.generateAll(selectedEntities, context.apiBaseUrl),
      ...this.formGenerator.generateAll(selectedEntities, context.formType),
      ...this.componentGenerator.generateAll(selectedEntities, context.uiFramework, context.stateManagement, context.formType),
      ...this.routeGenerator.generateAll(selectedEntities),
      ...(context.stateManagement === StateManagement.SignalStore || context.stateManagement === StateManagement.ComponentStore
        ? this.storeGenerator.generateAll(selectedEntities, context.stateManagement)
        : []),
    ];

    return { files, errors: [] };
  }
}
