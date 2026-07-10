import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';

// VS Code Codicons — professional built-in vector icons
// Full list at: https://microsoft.github.io/vscode-codicons/dist/codicon.html
const STATE_ICONS: Record<string, string> = {
  'coding':       '$(code)',
  'reading':      '$(eye)',
  'debugging':    '$(bug)',
  'terminal':     '$(terminal)',
  'git':          '$(git-commit)',
  'testing':      '$(beaker)',
  'ai assisting': '$(sparkle)',
  'idle':         '$(clock)',
};

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
    this.statusBarItem.tooltip = 'Developer Activity Analytics — Click to open Dashboard';
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
    const streak = this.dbService.getDatabase().streaks?.development?.currentStreak || 0;

    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    const icon = STATE_ICONS[state.toLowerCase()] || '$(circle-outline)';

    // Format: $(code) 2h 30m · Coding · 🔥 5d
    this.statusBarItem.text = `$(clock) ${timeStr}  ${icon} ${state}  $(flame) ${streak}d`;
    this.statusBarItem.show();
  }

  public dispose() {
    this.statusBarItem.dispose();
  }
}
