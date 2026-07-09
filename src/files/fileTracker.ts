import * as vscode from 'vscode';
import * as path from 'path';

export class FileTracker {
  private disposables: vscode.Disposable[] = [];

  public getRelativePath(uri: vscode.Uri, privacyMode: boolean = false): string {
    const relative = vscode.workspace.asRelativePath(uri);
    
    if (!privacyMode) {
      return relative;
    }

    // Hash folders and files under privacy mode
    const parts = relative.split(/[/\\]/);
    const obscuredParts = parts.map((part, index) => {
      if (index === parts.length - 1) {
        const ext = path.extname(part);
        const nameWithoutExt = path.basename(part, ext);
        return `file_${this.simpleHash(nameWithoutExt)}${ext}`;
      }
      return `dir_${this.simpleHash(part)}`;
    });

    return obscuredParts.join('/');
  }

  public getFileName(uri: vscode.Uri, privacyMode: boolean = false): string {
    const basename = path.basename(uri.fsPath);
    if (!privacyMode) {
      return basename;
    }
    const ext = path.extname(basename);
    const nameWithoutExt = path.basename(basename, ext);
    return `file_${this.simpleHash(nameWithoutExt)}${ext}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
  }

  public dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
