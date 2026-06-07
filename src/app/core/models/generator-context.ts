export enum UIFramework {
  Raw = 'raw',
  Material = 'material',
  PrimeNG = 'primeng',
  Bootstrap = 'bootstrap',
}

export enum StateManagement {
  Signals = 'signals',
  NgRx = 'ngrx',
  ComponentStore = 'component-store',
  SignalStore = 'signal-store',
  None = 'none',
}

export enum FormType {
  Reactive = 'reactive',
  Dynamic = 'dynamic',
  Signal = 'signal',
}

export interface GeneratorContext {
  uiFramework: UIFramework;
  stateManagement: StateManagement;
  formType: FormType;
  angularVersion: string;
  apiBaseUrl: string;
  selectedEntities: string[];
}
