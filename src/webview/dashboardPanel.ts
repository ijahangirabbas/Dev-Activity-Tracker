import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseService } from '../storage/database';
import { Tracker } from '../tracking/tracker';
import { DatabaseSchema, ExtensionConfig } from '../models/types';

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private static readonly viewType = 'devActivityDashboard';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly dbService: DatabaseService;
  private readonly tracker: Tracker;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    dbService: DatabaseService,
    tracker: Tracker
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(column);
      DashboardPanel.currentPanel.update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      'Developer Productivity Analytics',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionUri.fsPath, 'views')),
          vscode.Uri.file(path.join(extensionUri.fsPath, 'dist'))
        ],
        retainContextWhenHidden: true
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, dbService, tracker);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    dbService: DatabaseService,
    tracker: Tracker
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.dbService = dbService;
    this.tracker = tracker;

    // Set webview content
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

    // Listen for panel closure
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Listen for messages from Webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getData':
            this.update();
            break;
          case 'saveSettings':
            await this.handleSaveSettings(message.config);
            break;
          case 'exportData':
            await this.handleExportData(message.range);
            break;
          case 'backup':
            this.handleBackup();
            break;
          case 'restore':
            await this.handleRestore();
            break;
          case 'syncToCloud':
            vscode.commands.executeCommand('devtracker.syncToCloud');
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public update() {
    this.panel.webview.postMessage({
      command: 'updateData',
      db: this.tracker.getLiveDatabase(),
      config: this.tracker.getActiveState() ? this.getTrackerConfig() : undefined
    });
  }

  private getTrackerConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('devTracker');
    return {
      idleTimeout: config.get<number>('idleTimeout') || 300,
      dailyGoal: config.get<number>('dailyGoal') || 14400,
      privacyMode: config.get<boolean>('privacyMode') || false,
      recordRawTerminalCommands: config.get<boolean>('recordRawTerminalCommands') || false,
      showStatusBar: config.get<boolean>('showStatusBar') || true,
      userId: config.get<string>('userId') || ''
    };
  }

  private async handleSaveSettings(config: ExtensionConfig) {
    try {
      const vsConfig = vscode.workspace.getConfiguration('devTracker');
      await vsConfig.update('idleTimeout', config.idleTimeout, vscode.ConfigurationTarget.Global);
      await vsConfig.update('dailyGoal', config.dailyGoal, vscode.ConfigurationTarget.Global);
      await vsConfig.update('privacyMode', config.privacyMode, vscode.ConfigurationTarget.Global);
      await vsConfig.update('showStatusBar', config.showStatusBar, vscode.ConfigurationTarget.Global);
      if (config.userId !== undefined) {
        await vsConfig.update('userId', config.userId, vscode.ConfigurationTarget.Global);
      }
      
      this.tracker.updateConfig();
      vscode.window.showInformationMessage('Settings saved and applied successfully.');
      this.update();
    } catch (e) {
      vscode.window.showErrorMessage('Failed to save settings.');
    }
  }

  private async handleExportData(range: string) {
    try {
      const options: vscode.SaveDialogOptions = {
        defaultUri: vscode.Uri.file(path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', `dev_analytics_export_${Date.now()}.md`)),
        filters: {
          'Markdown (*.md)': ['md'],
          'JSON (*.json)': ['json'],
          'CSV (*.csv)': ['csv']
        }
      };

      const fileUri = await vscode.window.showSaveDialog(options);
      if (fileUri) {
        const ext = path.extname(fileUri.fsPath);
        let content = '';

        if (ext === '.json') {
          content = JSON.stringify(this.tracker.getLiveDatabase(), null, 2);
        } else if (ext === '.csv') {
          content = this.generateCSVContent();
        } else {
          content = this.generateMarkdownContent(range);
        }

        fs.writeFileSync(fileUri.fsPath, content, 'utf8');
        vscode.window.showInformationMessage(`Data exported successfully to ${path.basename(fileUri.fsPath)}`);
      }
    } catch (e) {
      vscode.window.showErrorMessage('Failed to export statistics.');
    }
  }

  private generateCSVContent(): string {
    const db: DatabaseSchema = this.tracker.getLiveDatabase();
    let csv = 'Date,Development Time (Seconds),Coding Time (Seconds),Goal (Seconds),Sessions Count,Commits Count,Terminal Time,AI Time\n';
    
    for (const [date, progress] of Object.entries(db.dailyProgress)) {
      csv += `${date},${progress.developmentTime},${progress.codingTime},${progress.goalSeconds},${progress.sessionsCount},${progress.commitsCount},${progress.terminalTime},${progress.aiTime}\n`;
    }
    return csv;
  }

  private generateMarkdownContent(range: string): string {
    const db: DatabaseSchema = this.tracker.getLiveDatabase();
    let md = `# Developer Activity Productivity Report\n\n`;
    md += `*Generated on: ${new Date().toLocaleString()}*\n`;
    md += `*Filtered Range: ${range.toUpperCase()}*\n\n`;

    md += `## Daily Performance Summary\n\n`;
    md += `| Date | Dev Time | Coding Time | Goal Completion | Commits | Terminal Time |\n`;
    md += `| --- | --- | --- | --- | --- | --- |\n`;

    for (const [date, progress] of Object.entries(db.dailyProgress)) {
      const devHours = (progress.developmentTime / 3600).toFixed(1);
      const codingHours = (progress.codingTime / 3600).toFixed(1);
      const pct = Math.round((progress.developmentTime / progress.goalSeconds) * 100);
      const termHours = (progress.terminalTime / 3600).toFixed(1);
      md += `| ${date} | ${devHours}h | ${codingHours}h | ${pct}% | ${progress.commitsCount} | ${termHours}h |\n`;
    }

    md += `\n## Project Contributions\n\n`;
    md += `| Project Name | Total Time Logged | Commits | Edits |\n`;
    md += `| --- | --- | --- | --- |\n`;

    for (const [name, stats] of Object.entries(db.projects)) {
      const hrs = (stats.totalTime / 3600).toFixed(1);
      md += `| ${name} | ${hrs}h | ${stats.commitsCount} | ${stats.editsCount} |\n`;
    }

    return md;
  }

  private handleBackup() {
    try {
      const backupPath = this.dbService.backup();
      vscode.window.showInformationMessage(`Backup created at: ${path.basename(backupPath)}`);
    } catch (e) {
      vscode.window.showErrorMessage('Failed to create backup.');
    }
  }

  private async handleRestore() {
    try {
      const options: vscode.OpenDialogOptions = {
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: 'Restore Backup',
        filters: {
          'JSON Backup (*.json)': ['json']
        }
      };

      const fileUris = await vscode.window.showOpenDialog(options);
      if (fileUris && fileUris.length > 0) {
        const filePath = fileUris[0].fsPath;
        
        const selection = await vscode.window.showWarningMessage(
          'Restoring this backup will overwrite all current tracking data. Are you sure you want to proceed?',
          'Yes, Restore',
          'No, Cancel'
        );

        if (selection === 'Yes, Restore') {
          this.dbService.restore(filePath);
          vscode.window.showInformationMessage('Analytics data restored successfully.');
          this.update();
        }
      }
    } catch (e) {
      vscode.window.showErrorMessage('Failed to restore backup file.');
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const htmlPath = path.join(this.extensionUri.fsPath, 'views', 'dashboard.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Generate random nonce
    const nonce = this.getNonce();

    // Resolve CSS & JS URIs
    const cssUri = webview.asWebviewUri(vscode.Uri.file(
      path.join(this.extensionUri.fsPath, 'views', 'dashboard.css')
    ));
    const jsUri = webview.asWebviewUri(vscode.Uri.file(
      path.join(this.extensionUri.fsPath, 'views', 'dashboard.js')
    ));
    const lucideUri = webview.asWebviewUri(vscode.Uri.file(
      path.join(this.extensionUri.fsPath, 'views', 'lucide.min.js')
    ));

    html = html.replace('id="style-link" href=""', `id="style-link" href="${cssUri}"`);
    html = html.replace('id="script-link" src="" nonce="{{nonce}}"', `id="script-link" src="${jsUri}" nonce="${nonce}"`);
    html = html.replace('id="lucide-link" src="" nonce="{{nonce}}"', `id="lucide-link" src="${lucideUri}" nonce="${nonce}"`);

    // Replace CSP templates
    html = html.replace(/\{\{cspSource\}\}/g, webview.cspSource);
    html = html.replace(/\{\{nonce\}\}/g, nonce);

    return html;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public dispose() {
    DashboardPanel.currentPanel = undefined;
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
