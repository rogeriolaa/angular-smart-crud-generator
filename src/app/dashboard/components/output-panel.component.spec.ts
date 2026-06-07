import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OutputPanelComponent } from './output-panel.component';
import { GeneratedFile } from '../../core/models';

describe('OutputPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutputPanelComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(OutputPanelComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders file count', () => {
    const fixture = TestBed.createComponent(OutputPanelComponent);
    const files: GeneratedFile[] = [
      { path: 'test.ts', content: 'export {}' },
      { path: 'test2.ts', content: 'export {}' },
    ];
    fixture.componentRef.setInput('files', files);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2');
  });

  it('displays file list', () => {
    const fixture = TestBed.createComponent(OutputPanelComponent);
    const files: GeneratedFile[] = [
      { path: 'models/pet.ts', content: 'export interface Pet {}' },
    ];
    fixture.componentRef.setInput('files', files);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('models/pet.ts');
  });

  it('shows file content when selected', () => {
    const fixture = TestBed.createComponent(OutputPanelComponent);
    const component = fixture.componentInstance;
    const files: GeneratedFile[] = [
      { path: 'test.ts', content: 'export const x = 1;' },
    ];
    fixture.componentRef.setInput('files', files);
    component['selectedFile'].set(files[0]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('export const x = 1;');
  });

  it('has download button', () => {
    const fixture = TestBed.createComponent(OutputPanelComponent);
    const files: GeneratedFile[] = [{ path: 'test.ts', content: 'export {}' }];
    fixture.componentRef.setInput('files', files);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const downloadBtn = Array.from(buttons).find(b => b.textContent?.includes('Download ZIP'));
    expect(downloadBtn).toBeTruthy();
  });
});
