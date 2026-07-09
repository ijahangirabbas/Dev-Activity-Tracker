import * as vscode from 'vscode';
import { TerminalCommandEvent } from '../models/types';

export class TerminalTracker {
  private disposables: vscode.Disposable[] = [];
  private onCommandCallback: (cmdEvent: TerminalCommandEvent) => void;
  private onTerminalActiveCallback: () => void;

  constructor(
    onCommand: (cmdEvent: TerminalCommandEvent) => void,
    onTerminalActive: () => void
  ) {
    this.onCommandCallback = onCommand;
    this.onTerminalActiveCallback = onTerminalActive;
    this.initTerminalTracking();
  }

  private initTerminalTracking() {
    // Listen for terminal events
    this.disposables.push(
      vscode.window.onDidOpenTerminal(() => {
        this.onTerminalActiveCallback();
      }),
      vscode.window.onDidCloseTerminal(() => {
        this.onTerminalActiveCallback();
      }),
      vscode.window.onDidChangeActiveTerminal(() => {
        this.onTerminalActiveCallback();
      })
    );

    // Track command execution (using recent VS Code API)
    if ('onDidStartTerminalShellExecution' in vscode.window) {
      try {
        const win = vscode.window as any;
        this.disposables.push(
          win.onDidStartTerminalShellExecution((event: any) => {
            const command = (event.commandLine && event.commandLine.value) || '';
            if (command) {
              const category = this.categorizeCommand(command);
              this.onCommandCallback({
                command,
                category,
                timestamp: Date.now()
              });
            }
          })
        );
      } catch (e) {
        console.error('Error starting terminal shell execution tracking:', e);
      }
    }
  }

  private categorizeCommand(command: string): string {
    const cmd = command.trim().toLowerCase();
    
    if (
      cmd.startsWith('npm install') || cmd.startsWith('npm i ') || cmd === 'npm i' ||
      cmd.startsWith('yarn install') || cmd.startsWith('yarn add') ||
      cmd.startsWith('pnpm install') || cmd.startsWith('pnpm add') ||
      cmd.startsWith('bun install') || cmd.startsWith('bun add') ||
      cmd.startsWith('pip install') || cmd.startsWith('pipenv install') ||
      cmd.startsWith('cargo add') || cmd.startsWith('go get')
    ) {
      return 'package-manager';
    }

    if (cmd.startsWith('git ')) {
      return 'git';
    }

    if (
      cmd.startsWith('docker ') || cmd.startsWith('docker-compose ') ||
      cmd.startsWith('docker compose ') || cmd.startsWith('kubectl ')
    ) {
      return 'docker';
    }

    if (
      cmd.includes('test') || cmd.includes('jest') || cmd.includes('mocha') ||
      cmd.includes('vitest') || cmd.includes('pytest') || cmd.includes('playwright') ||
      cmd.includes('cypress')
    ) {
      return 'test';
    }

    if (
      cmd.includes('run dev') || cmd.startsWith('npm start') || cmd.startsWith('yarn start') ||
      cmd.startsWith('pnpm start') || cmd.includes('serve') || cmd.includes('watch')
    ) {
      return 'dev';
    }

    if (
      cmd.includes('build') || cmd.includes('compile') || cmd.includes('webpack') ||
      cmd.includes('esbuild') || cmd.includes('tsc ') || cmd === 'tsc'
    ) {
      return 'build';
    }

    return 'other';
  }

  public getTerminalSessionsCount(): number {
    return vscode.window.terminals.length;
  }

  public dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
