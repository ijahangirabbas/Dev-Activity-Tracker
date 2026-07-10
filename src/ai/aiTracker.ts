import * as vscode from 'vscode';

export class AITracker {
  private disposables: vscode.Disposable[] = [];
  private onAICallback: () => void;

  constructor(onAIActivity: () => void) {
    this.onAICallback = onAIActivity;
    this.initAITracking();
  }

  private initAITracking() {
    if (typeof (vscode.commands as any).onDidExecuteCommand === 'function') {
      try {
        // Listen to commands run in VS Code to detect AI actions
        this.disposables.push(
          (vscode.commands as any).onDidExecuteCommand((event: any) => {
            const cmd = event.command || '';
            if (this.isAICommand(cmd)) {
              this.onAICallback();
            }
          })
        );
      } catch (e) {
        console.error('Error starting AI command tracker:', e);
      }
    } else {
      console.log('AI command tracking is not supported on this VS Code version (requires proposed API).');
    }
  }

  private isAICommand(command: string): boolean {
    const cmd = command.toLowerCase();
    
    // Command prefixes or exact names of popular AI tools
    return (
      cmd.startsWith('github.copilot') ||
      cmd.startsWith('inlinechat.') ||
      cmd.startsWith('workbench.action.chat') ||
      cmd.startsWith('continue.') ||
      cmd.startsWith('cline.') ||
      cmd.startsWith('codeium.') ||
      cmd.startsWith('amazonq.') ||
      cmd.startsWith('tabnine.') ||
      cmd.includes('.chat.') ||
      cmd.includes('copilot.chat')
    );
  }

  public dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
