import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';
import { Tracker } from '../tracking/tracker';
import { DashboardPanel } from '../webview/dashboardPanel';
import * as path from 'path';

const CLOUD_DASHBOARD_URL = 'https://dev-activity-tracker-zeta.vercel.app/dashboard';

export function registerCommands(
  context: vscode.ExtensionContext,
  dbService: DatabaseService,
  tracker: Tracker
) {
  // Command: Show Dashboard
  const showDashboard = vscode.commands.registerCommand(
    'devtracker.showDashboard',
    async () => {
      // Show internal webview
      DashboardPanel.createOrShow(context.extensionUri, dbService, tracker);

      // Offer to open the hosted cloud dashboard. The local VS Code dashboard stays available offline.
      const action = await vscode.window.showInformationMessage(
        'Opening the offline DevTracker dashboard. Sign in to the hosted dashboard to sync and review cloud analytics.',
        'Open Cloud Dashboard'
      );
      if (action === 'Open Cloud Dashboard') {
        const token = await context.secrets.get('devTracker.bridgeToken') || '';
        vscode.env.openExternal(vscode.Uri.parse(`${CLOUD_DASHBOARD_URL}?token=${token}`));
      }
    }
  );

  // Command: Export Data (if dashboard is open, uses dashboard export logic)
  const exportData = vscode.commands.registerCommand(
    'devtracker.exportData',
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
    'devtracker.backupData',
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
    'devtracker.restoreData',
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
    'devtracker.syncToCloud',
    async () => {
      const action = await vscode.window.showInformationMessage(
        'Cloud sync is handled by the hosted dashboard. Sign in, copy your UUID into VS Code settings, then sync from the dashboard.',
        'Open Dashboard'
      );
      if (action === 'Open Dashboard') {
        const token = await context.secrets.get('devTracker.bridgeToken') || '';
        vscode.env.openExternal(vscode.Uri.parse(`${CLOUD_DASHBOARD_URL}?tab=settings&token=${token}`));
      }
    }
  );

  // Command: Pause Tracking
  const pauseTracking = vscode.commands.registerCommand(
    'devtracker.pauseTracking',
    () => {
      tracker.pause();
      vscode.window.showInformationMessage('DevTracker: Tracking paused.');
    }
  );

  // Command: Resume Tracking
  const resumeTracking = vscode.commands.registerCommand(
    'devtracker.resumeTracking',
    () => {
      tracker.resume();
      vscode.window.showInformationMessage('DevTracker: Tracking resumed.');
    }
  );

  // Command: Re-sanitize History
  const reSanitizeHistory = vscode.commands.registerCommand(
    'devtracker.reSanitizeHistory',
    async () => {
      const selection = await vscode.window.showWarningMessage(
        'Re-sanitizing your history will rewrite all past sessions using your current Privacy Mode settings. A backup will be created first. Proceed?',
        'Yes, Sanitize',
        'Cancel'
      );
      if (selection === 'Yes, Sanitize') {
        try {
          const config = vscode.workspace.getConfiguration('devTracker');
          const privacyMode = config.get<boolean>('privacyMode') || false;
          const recordRaw = config.get<boolean>('recordRawTerminalCommands') || false;
          
          const backupPath = dbService.reSanitizeHistory(privacyMode, recordRaw);
          vscode.window.showInformationMessage(`History re-sanitized successfully! Backup saved to: ${path.basename(backupPath)}`);
          if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.update();
          }
        } catch (e) {
          vscode.window.showErrorMessage('Failed to re-sanitize history.');
        }
      }
    }
  );

  context.subscriptions.push(
    showDashboard,
    exportData,
    backupData,
    restoreData,
    syncToCloud,
    pauseTracking,
    resumeTracking,
    reSanitizeHistory
  );
}
