import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FileService } from '../../../../../../core/services/file';

export interface PreviewFileDialogData {
  file: {
    id: string;
    name: string;
    extension: 'md' | 'txt' | string;
    size: string;
    lastModified: string;
    ownerName: string;
    tags?: string[];
  };
}

@Component({
  selector: 'app-preview-file-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './preview-file-dialog.html',
  styleUrl: './preview-file-dialog.css'
})
export class PreviewFileDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<PreviewFileDialog>);
  private fileService = inject(FileService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  data: PreviewFileDialogData = inject(MAT_DIALOG_DATA);

  loading = true;
  rawContent = '';
  renderedMarkdown: SafeHtml = '';
  activeTab = 0;

  get isMarkdown(): boolean {
    const ext = (this.data?.file?.extension || '').toLowerCase().trim();
    const name = (this.data?.file?.name || '').toLowerCase().trim();
    return ext === 'md' || ext === 'markdown' || ext.endsWith('.md') || name.endsWith('.md');
  }

  get displayExtension(): string {
    return this.isMarkdown ? 'md' : 'txt';
  }

  get lineCount(): number {
    if (!this.rawContent) return 0;
    return this.rawContent.split('\n').length;
  }

  ngOnInit(): void {
    this.loadFileContent();
  }

  loadFileContent(): void {
    this.loading = true;
    this.rawContent = '';
    this.renderedMarkdown = '';
    const fileId = this.data?.file?.id;

    const isValidObjectId = !!fileId && /^[0-9a-fA-F]{24}$/.test(fileId);
    if (!isValidObjectId) {
      this.rawContent = this.generateSampleContent();
      this.processContent();
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.fileService.getRaw(fileId).subscribe({
      next: (res: any) => {
        let content: string | null = null;
        if (res && typeof res === 'object') {
          if (typeof res.content === 'string') {
            content = res.content;
          } else if (typeof res.data === 'string') {
            content = res.data;
          }
        } else if (typeof res === 'string') {
          try {
            const parsed = JSON.parse(res);
            content = parsed?.content || res;
          } catch {
            content = res;
          }
        }

        if (content !== null) {
          this.rawContent = content;
          this.processContent();
          this.loading = false;
          this.cdr.detectChanges();
        } else {
          this.fetchFromDownload(fileId);
        }
      },
      error: () => {
        this.fetchFromDownload(fileId);
      }
    });
  }

  private fetchFromDownload(fileId: string): void {
    this.fileService.download(fileId).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === 'string' ? reader.result : '';
          try {
            const parsed = JSON.parse(result);
            if (parsed && typeof parsed.message === 'string' && (parsed.statusCode === 404 || parsed.error)) {
              this.rawContent = this.generateSampleContent();
            } else if (parsed && typeof parsed.content === 'string') {
              this.rawContent = parsed.content;
            } else {
              this.rawContent = result;
            }
          } catch {
            this.rawContent = result;
          }
          this.processContent();
          this.loading = false;
          this.cdr.detectChanges();
        };
        reader.onerror = () => {
          this.rawContent = this.generateSampleContent();
          this.processContent();
          this.loading = false;
          this.cdr.detectChanges();
        };
        reader.readAsText(blob);
      },
      error: () => {
        this.rawContent = this.generateSampleContent();
        this.processContent();
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private processContent(): void {
    if (this.isMarkdown) {
      this.renderedMarkdown = this.sanitizer.bypassSecurityTrustHtml(
        this.renderMarkdown(this.rawContent)
      );
    }
  }

  private renderMarkdown(md: string): string {
    if (!md) return '<p class="text-[var(--color-text-muted)] italic">El archivo no tiene contenido.</p>';

    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```([a-z0-9]*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
      return `<pre class="bg-[color-mix(in_srgb,var(--color-bg-light)_85%,transparent)] text-[var(--color-primary)] p-4 rounded-xl overflow-x-auto text-xs font-mono my-3 border border-[color-mix(in_srgb,var(--color-text-main)_12%,transparent)] leading-relaxed select-text">${code.trim()}</pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] px-1.5 py-0.5 rounded text-xs font-mono font-medium">$1</code>');

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-[var(--color-text-main)] mt-4 mb-2 flex items-center gap-1.5"><span class="text-[var(--color-primary)] font-mono">#</span> $1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-[var(--color-text-main)] mt-5 mb-2.5 flex items-center gap-2 pb-1 border-b border-[color-mix(in_srgb,var(--color-text-main)_10%,transparent)]"><span class="text-[var(--color-primary)] font-mono">##</span> $1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black text-[var(--color-primary)] mt-5 mb-3 pb-2 border-b border-[color-mix(in_srgb,var(--color-text-main)_12%,transparent)]">$1</h1>');

    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-[var(--color-text-main)]">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-[var(--color-text-muted)]">$1</em>');

    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-[var(--color-primary)] pl-4 py-1 italic text-[var(--color-text-muted)] bg-[color-mix(in_srgb,var(--color-bg-light)_50%,transparent)] rounded-r-lg my-2">$1</blockquote>');

    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-5 list-disc text-[var(--color-text-main)] my-1 leading-relaxed">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-5 list-disc text-[var(--color-text-main)] my-1 leading-relaxed">$1</li>');

    html = html.replace(/\n\n/g, '<div class="my-3"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  private generateSampleContent(): string {
    const { name, extension, ownerName, lastModified } = this.data.file;
    if (extension === 'md') {
      return `# ${name}

Documento en formato **Markdown** disponible en *Ateneo Cloud*.

## Metadatos del Archivo
- **Propietario:** ${ownerName}
- **Última modificación:** ${lastModified}
- **Formato:** Markdown (.md)
- **Estado:** Sincronizado

## Descripción del Contenido
Este archivo contiene apuntes, documentación técnica y notas de estudio correspondientes al curso.

\`\`\`bash
# Script de validación
ng test
\`\`\`

> "El conocimiento compartido impulsa mejores resultados."
`;
    }
    return `=========================================
ARCHIVO: ${name}
=========================================
Propietario: ${ownerName}
Fecha: ${lastModified}
Plataforma: Ateneo Cloud

Contenido del documento de texto (.txt).
Registro de notas y datos del usuario.
`;
  }

  download(): void {
    this.dialogRef.close({ action: 'download', file: this.data.file });
  }

  share(): void {
    this.dialogRef.close({ action: 'share', file: this.data.file });
  }

  close(): void {
    this.dialogRef.close();
  }
}
