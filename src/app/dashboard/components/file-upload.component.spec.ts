import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';

describe('FileUploadComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FileUploadComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders upload area text', () => {
    const fixture = TestBed.createComponent(FileUploadComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Drop your OpenAPI file here');
  });

  it('emits file content on file selection', () => {
    const fixture = TestBed.createComponent(FileUploadComponent);
    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.fileSelected.subscribe(spy);

    const content = 'openapi: 3.0.0';
    const file = new File([content], 'test.yaml', { type: 'text/yaml' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileChange(event);
    // FileReader is async, we simulate by calling onload directly
    const reader = new FileReader();
    reader.onload = () => {
      expect(spy).toHaveBeenCalledWith(content);
    };
    reader.readAsText(file);
  });

  it('handles drop event', () => {
    const fixture = TestBed.createComponent(FileUploadComponent);
    const component = fixture.componentInstance;
    const spy = vi.fn();
    component.fileSelected.subscribe(spy);

    const content = 'spec: test';
    const file = new File([content], 'spec.yaml', { type: 'text/yaml' });
    component.onDrop({ preventDefault: () => {}, dataTransfer: { files: [file] } } as unknown as DragEvent);
    const reader = new FileReader();
    reader.onload = () => {
      expect(spy).toHaveBeenCalledWith(content);
    };
    reader.readAsText(file);
  });
});
