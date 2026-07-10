import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';
import { Tracker } from '../tracking/tracker';
import { DashboardPanel } from '../webview/dashboardPanel';
import { SupabaseSyncService } from '../services/supabaseSync';
import * as path from 'path';

export function registerCommands(
  context: vscode.ExtensionContext,
  dbService: DatabaseService,
  tracker: Tracker
) {
  // Command: Show Dashboard
  const showDashboard = vscode.commands.registerCommand(
    'dev-activity-tracker.showDashboard',
    async () => {
      // Show internal webview
      DashboardPanel.createOrShow(context.extensionUri, dbService, tracker);

      // Offer to open the premium React web client dashboard
      const action = await vscode.window.showInformationMessage(
        'Opening activity dashboard inside VS Code. Would you like to view the premium interactive web dashboard in your browser?',
        'Open in Browser'
      );
      if (action === 'Open in Browser') {
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:5173/dashboard'));
      }
    }
  );

  // Command: Export Data (if dashboard is open, uses dashboard export logic)
  const exportData = vscode.commands.registerCommand(
    'dev-activity-tracker.exportData',
    () => {
      if (DashboardPanel.currentPanel) {
        vscode.window.showInformationMessage('Triggering export from dashboard...');
      } else {
        DashboardPanel.createOrShow(context.extensionUri, dbService, tracker);
        vscode.window.showInformationMessage('Opening dashboard to export statistics.');
      }
    }
  );

  // Command: Backup Data
  const backupData = vscode.commands.registerCommand(
    'dev-activity-tracker.backupData',
    () => {
      try {
        const backupPath = dbService.backup();
        vscode.window.showInformationMessage(`Backup created at: ${path.basename(backupPath)}`);
      } catch (e) {
        vscode.window.showErrorMessage('Failed to create backup.');
      }
    }
  );

  // Command: Restore Data
  const restoreData = vscode.commands.registerCommand(
    'dev-activity-tracker.restoreData',
    async () => {
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
          const selection = await vscode.window.showWarningMessage(
            'Restoring this backup will overwrite all current tracking data. Proceed?',
            'Yes',
            'No'
          );

          if (selection === 'Yes') {
            dbService.restore(fileUris[0].fsPath);
            vscode.window.showInformationMessage('Analytics data restored successfully.');
            if (DashboardPanel.currentPanel) {
              DashboardPanel.currentPanel.update();
            }
          }
        }
      } catch (e) {
        vscode.window.showErrorMessage('Failed to restore backup.');
      }
    }
  );

  // Command: Sync to Cloud (Supabase)
  const syncToCloud = vscode.commands.registerCommand(
    'dev-activity-tracker.syncToCloud',
    async () => {
      const cfg = vscode.workspace.getConfiguration('devActivityTracker');
      const supabaseUrl = cfg.get<string>('supabaseUrl') || '';
      const serviceKey = cfg.get<string>('supabaseServiceKey') || '';
      const userId = cfg.get<string>('supabaseUserId') || '';

      if (!supabaseUrl || !serviceKey || !userId) {
        const action = await vscode.window.showWarningMessage(
          'Supabase is not configured. Please set devActivityTracker.supabaseUrl, supabaseServiceKey, and supabaseUserId in VS Code Settings.',
          'Open Settings'
        );
        if (action === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'devActivityTracker.supabaseUrl');
        }
        return;
      }

      const sync = new SupabaseSyncService(supabaseUrl, serviceKey, userId);
      const db = dbService.getDatabase();
      const sessions = db.sessions;
      const dailyProgress = db.dailyProgress;

      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Syncing to Supabase...', cancellable: false },
        async (progress) => {
          let synced = 0;
          const total = sessions.length + Object.keys(dailyProgress).length + 1;

          for (const session of sessions) {
            await sync.syncSession(session);
            synced++;
            progress.report({ increment: (synced / total) * 100, message: `${synced}/${total} items` });
          }

          for (const [date, dp] of Object.entries(dailyProgress)) {
            await sync.syncDailyProgress(date, dp);
            synced++;
            progress.report({ increment: (synced / total) * 100 });
          }

          await sync.syncStreaks(db.streaks);

          vscode.window.showInformationMessage(`✅ Synced ${sessions.length} sessions to Supabase successfully!`);
        }
      );
    }
  );

  context.subscriptions.push(showDashboard, exportData, backupData, restoreData, syncToCloud);
}
