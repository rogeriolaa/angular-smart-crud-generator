import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { UrlImportComponent } from './url-import.component';

describe('UrlImportComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UrlImportComponent],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(UrlImportComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders input and button', () => {
    const fixture = TestBed.createComponent(UrlImportComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input[type="url"]');
    const button = compiled.querySelector('button');
    expect(input).toBeTruthy();
    expect(button?.textContent).toContain('Fetch');
  });

  it('does not fetch for empty URL', () => {
    const fixture = TestBed.createComponent(UrlImportComponent);
    const component = fixture.componentInstance;
    component.fetchUrl('');
    expect(component['loading']()).toBe(false);
  });
});
