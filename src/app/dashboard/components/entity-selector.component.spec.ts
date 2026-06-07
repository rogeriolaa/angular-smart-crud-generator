import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EntitySelectorComponent } from './entity-selector.component';
import { EntityDefinition, FieldType } from '../../core/models';

function makeEntity(name: string, fieldCount = 2): EntityDefinition {
  return {
    name,
    namePlural: `${name}s`,
    fields: Array.from({ length: fieldCount }, (_, i) => ({
      name: `field${i}`,
      type: FieldType.String,
      isRequired: false,
      isPrimaryKey: false,
      isAudit: false,
      isSoftDelete: false,
      isForeignKey: false,
      validators: [],
      isArray: false,
    })),
    endpoints: [],
    relationships: [],
    isAuditEntity: false,
    hasSoftDelete: false,
  };
}

describe('EntitySelectorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitySelectorComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EntitySelectorComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders entities', () => {
    const fixture = TestBed.createComponent(EntitySelectorComponent);
    fixture.componentRef.setInput('entities', [makeEntity('Pet', 3), makeEntity('User', 5)]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pet');
    expect(compiled.textContent).toContain('User');
    expect(compiled.textContent).toContain('(3 fields)');
    expect(compiled.textContent).toContain('(5 fields)');
  });

  it('emits on toggle', () => {
    const fixture = TestBed.createComponent(EntitySelectorComponent);
    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.selectionChange.subscribe(spy);
    fixture.componentRef.setInput('entities', [makeEntity('Pet')]);

    component.toggle('Pet');
    expect(spy).toHaveBeenCalledWith(['Pet']);

    component.toggle('Pet');
    expect(spy).toHaveBeenCalledWith([]);
  });

  it('selects all and deselects all', () => {
    const fixture = TestBed.createComponent(EntitySelectorComponent);
    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.selectionChange.subscribe(spy);
    fixture.componentRef.setInput('entities', [makeEntity('Pet'), makeEntity('User')]);

    component.selectAll();
    expect(spy).toHaveBeenCalledWith(['Pet', 'User']);

    component.deselectAll();
    expect(spy).toHaveBeenCalledWith([]);
  });

  it('checks if entity is selected', () => {
    const fixture = TestBed.createComponent(EntitySelectorComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('entities', [makeEntity('Pet')]);
    expect(component.isSelected('Pet')).toBe(false);
    component.toggle('Pet');
    expect(component.isSelected('Pet')).toBe(true);
  });
});
