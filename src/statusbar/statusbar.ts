import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';

export class StatusbarManager {
  private statusBarItem: vscode.StatusBarItem;
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'dev-activity-tracker.showDashboard';
    this.statusBarItem.tooltip = 'Developer Activity Analytics - Click to open Dashboard';
    this.update('Reading', 0);
    this.statusBarItem.show();
  }

  public update(state: string, secondsToday: number) {
    const config = vscode.workspace.getConfiguration('devActivityTracker');
    const showStatusBar = config.get<boolean>('showStatusBar') ?? true;

    if (!showStatusBar) {
      this.statusBarItem.hide();
      return;
    }

    const hours = Math.floor(secondsToday / 3600);
    const minutes = Math.floor((secondsToday % 3600) / 60);
    const streak = this.dbService.getDatabase().streaks.development.currentStreak;

    const timeStr = `${hours}h ${minutes}m`;
    const icon = this.getStateIcon(state);

    this.statusBarItem.text = `💻 Today ${timeStr} | ${icon} ${state} | 🔥 ${streak}d`;
    this.statusBarItem.show();
  }

  private getStateIcon(state: string): string {
    switch (state.toLowerCase()) {
      case 'coding':
        return '⚡';
      case 'reading':
        return '📖';
      case 'debugging':
        return '🐞';
      case 'terminal':
        return '🖥️';
      case 'git':
        return '🧬';
      case 'testing':
        return '🧪';
      case 'ai assisting':
        return '🤖';
      case 'idle':
      default:
        return '⌛';
    }
  }

  public dispose() {
    this.statusBarItem.dispose();
  }
}
