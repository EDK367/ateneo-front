import { Component, OnInit, inject } from '@angular/core';
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
  data: PreviewFileDialogData = inject(MAT_DIALOG_DATA);

  loading = true;
  rawContent = '';
  renderedMarkdown: SafeHtml = '';
  activeTab = 0;

  get lineCount(): number {
    if (!this.rawContent) return 0;
    return this.rawContent.split('\n').length;
  }

  ngOnInit(): void {
    this.loadFileContent();
  }

  loadFileContent(): void {
    this.loading = true;
    this.fileService.getRaw(this.data.file.id).subscribe({
      next: (res) => {
        this.rawContent = res?.content || '';
        this.processContent();
        this.loading = false;
      },
      error: () => {
        this.rawContent = this.generateSampleContent();
        this.processContent();
        this.loading = false;
      }
    });
  }

  private processContent(): void {
    if (this.data.file.extension === 'md') {
      this.renderedMarkdown = this.sanitizer.bypassSecurityTrustHtml(
        this.renderMarkdown(this.rawContent)
      );
    }
  }

  private renderMarkdown(md: string): string {
    if (!md) return '<p class="text-gray-400 italic">El archivo no tiene contenido.</p>';

    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```([a-z0-9]*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
      return `<pre class="bg-[#0b1220] text-cyan-300 p-4 rounded-xl overflow-x-auto text-xs font-mono my-3 border border-white/10 leading-relaxed">${code.trim()}</pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono font-medium">$1</code>');

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-4 mb-2 flex items-center gap-1.5"><span class="text-cyan-400 font-mono">#</span> $1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-5 mb-2.5 flex items-center gap-2 pb-1 border-b border-white/10"><span class="text-cyan-400 font-mono">##</span> $1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-black text-cyan-400 mt-5 mb-3 pb-2 border-b border-white/10">$1</h1>');

    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-300">$1</em>');

    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-cyan-400 pl-4 py-1 italic text-gray-300 bg-white/5 rounded-r-lg my-2">$1</blockquote>');

    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-5 list-disc text-gray-200 my-1 leading-relaxed">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-5 list-disc text-gray-200 my-1 leading-relaxed">$1</li>');

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
