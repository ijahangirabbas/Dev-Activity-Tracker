import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';
import { Tracker } from '../tracking/tracker';
import { DashboardPanel } from '../webview/dashboardPanel';
import * as path from 'path';

export function registerCommands(
  context: vscode.ExtensionContext,
  dbService: DatabaseService,
  tracker: Tracker
) {
  // Command: Show Dashboard
  const showDashboard = vscode.commands.registerCommand(
    'dev-activity-tracker.showDashboard',
    () => {
      DashboardPanel.createOrShow(context.extensionUri, dbService, tracker);
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

  context.subscriptions.push(showDashboard, exportData, backupData, restoreData);
}
