import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ConfigWizardComponent } from './config-wizard.component';
import { UIFramework, StateManagement, FormType } from '../../core/models';

describe('ConfigWizardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigWizardComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ConfigWizardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has default context values', () => {
    const fixture = TestBed.createComponent(ConfigWizardComponent);
    const component = fixture.componentInstance;
    expect(component['context']().uiFramework).toBe(UIFramework.Raw);
    expect(component['context']().stateManagement).toBe(StateManagement.Signals);
    expect(component['context']().formType).toBe(FormType.Reactive);
  });

  it('renders four select elements', () => {
    const fixture = TestBed.createComponent(ConfigWizardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const selects = compiled.querySelectorAll('select');
    expect(selects.length).toBe(4);
  });

  it('emits on update', () => {
    const fixture = TestBed.createComponent(ConfigWizardComponent);
    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.contextChange.subscribe(spy);

    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'material' } });
    component.update('uiFramework', event);

    expect(spy).toHaveBeenCalled();
    expect(component['context']().uiFramework).toBe('material');
  });

  it('resets formType to reactive when angular version drops below 21 and signal was selected', () => {
    const fixture = TestBed.createComponent(ConfigWizardComponent);
    const component = fixture.componentInstance;

    component['context'].set({
      ...component['context'](),
      formType: FormType.Signal,
    });

    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: '18' } });
    component.update('angularVersion', event);

    expect(component['context']().angularVersion).toBe('18');
    expect(component['context']().formType).toBe(FormType.Reactive);
  });
});
