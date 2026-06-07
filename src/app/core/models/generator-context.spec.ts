import { describe, it, expect } from 'vitest';
import { UIFramework, StateManagement, FormType, GeneratorContext } from './generator-context';

describe('UIFramework', () => {
  it('has expected values', () => {
    expect(UIFramework.Raw).toBe('raw');
    expect(UIFramework.Material).toBe('material');
    expect(UIFramework.PrimeNG).toBe('primeng');
    expect(UIFramework.Bootstrap).toBe('bootstrap');
  });
});

describe('StateManagement', () => {
  it('has expected values', () => {
    expect(StateManagement.Signals).toBe('signals');
    expect(StateManagement.NgRx).toBe('ngrx');
    expect(StateManagement.ComponentStore).toBe('component-store');
    expect(StateManagement.SignalStore).toBe('signal-store');
    expect(StateManagement.None).toBe('none');
  });
});

describe('FormType', () => {
  it('has expected values', () => {
    expect(FormType.Reactive).toBe('reactive');
    expect(FormType.Dynamic).toBe('dynamic');
    expect(FormType.Signal).toBe('signal');
  });
});

describe('GeneratorContext', () => {
  it('can be created with defaults', () => {
    const ctx: GeneratorContext = {
      uiFramework: UIFramework.Raw,
      stateManagement: StateManagement.Signals,
      formType: FormType.Reactive,
      angularVersion: '21',
      apiBaseUrl: '',
      selectedEntities: [],
    };
    expect(ctx.uiFramework).toBe(UIFramework.Raw);
    expect(ctx.stateManagement).toBe(StateManagement.Signals);
    expect(ctx.formType).toBe(FormType.Reactive);
    expect(ctx.angularVersion).toBe('21');
    expect(ctx.apiBaseUrl).toBe('');
    expect(ctx.selectedEntities).toEqual([]);
  });

  it('can have specific entities selected', () => {
    const ctx: GeneratorContext = {
      uiFramework: UIFramework.Material,
      stateManagement: StateManagement.NgRx,
      formType: FormType.Dynamic,
      angularVersion: '21',
      apiBaseUrl: 'https://api.example.com',
      selectedEntities: ['Pet', 'User'],
    };
    expect(ctx.selectedEntities).toHaveLength(2);
    expect(ctx.selectedEntities).toContain('Pet');
    expect(ctx.selectedEntities).toContain('User');
    expect(ctx.apiBaseUrl).toBe('https://api.example.com');
  });
});
