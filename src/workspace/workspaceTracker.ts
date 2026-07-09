import * as vscode from 'vscode';
import * as path from 'path';

export class WorkspaceTracker {
  private disposables: vscode.Disposable[] = [];
  private onWorkspaceChangeCallback: () => void;

  constructor(onWorkspaceChange: () => void) {
    this.onWorkspaceChangeCallback = onWorkspaceChange;
    this.initWorkspaceTracking();
  }

  private initWorkspaceTracking() {
    this.disposables.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.onWorkspaceChangeCallback();
      })
    );
  }

  public getWorkspaceDetails(privacyMode: boolean = false): { name: string, path: string } {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return { name: 'No Workspace', path: '' };
    }

    const firstFolder = folders[0];
    const originalName = firstFolder.name || path.basename(firstFolder.uri.fsPath);
    const originalPath = firstFolder.uri.fsPath;

    if (privacyMode) {
      // Obfuscate workspace name and path in privacy mode
      const obscuredName = `Project_${this.simpleHash(originalName)}`;
      return {
        name: obscuredName,
        path: `C:\\private\\${obscuredName}`
      };
    }

    return {
      name: originalName,
      path: originalPath
    };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
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
