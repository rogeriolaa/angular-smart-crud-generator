import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render header title', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Angular Smart CRUD Generator');
  });

  it('should render upload and import sections', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-file-upload')).toBeTruthy();
    expect(compiled.querySelector('app-url-import')).toBeTruthy();
  });

  it('should show placeholder when no files generated', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Upload or fetch an OpenAPI spec');
  });

  it('parses spec on file selected', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: { schemas: { Item: { type: 'object', properties: { id: { type: 'integer' } } } } },
    });
    component.onFileSelected(spec);
    expect(component['entities']().length).toBe(1);
    expect(component['entities']()[0].name).toBe('Item');
  });

  it('shows error for invalid spec', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.onFileSelected('not valid');
    expect(component['error']()).toBeTruthy();
  });

  it('generates files for valid spec', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: { '/items': { get: { operationId: 'listItems', responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Item' } } } } } } } } },
      components: { schemas: { Item: { type: 'object', required: ['name'], properties: { id: { type: 'integer' }, name: { type: 'string' } } } } },
    });
    component.onFileSelected(spec);
    component.generate();
    expect(component['files']().length).toBeGreaterThan(0);
  });
});
