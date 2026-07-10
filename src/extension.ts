import * as vscode from 'vscode';
import { DatabaseService } from './storage/database';
import { Tracker } from './tracking/tracker';
import { StatusbarManager } from './statusbar/statusbar';
import { registerCommands } from './commands';
import { DashboardPanel } from './webview/dashboardPanel';
import { LocalServer } from './services/localServer';

let tracker: Tracker | undefined;
let statusBarManager: StatusbarManager | undefined;
let localServer: LocalServer | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Developer Activity & Coding Analytics extension activated.');

  // Initialize storage
  const storagePath = context.globalStorageUri.fsPath;
  const dbService = new DatabaseService(storagePath);

  // Start local API server for dashboard web client integrations
  localServer = new LocalServer(dbService, () => {
    if (tracker) {
      return tracker.getLiveDatabase();
    }
    return dbService.getDatabase();
  });
  localServer.start();

  // Initialize status bar manager
  statusBarManager = new StatusbarManager(dbService);

  // Initialize core tracker
  tracker = new Tracker(dbService, (state, secondsToday) => {
    if (statusBarManager) {
      statusBarManager.update(state, secondsToday);
    }
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.update();
    }
  });

  // Register user commands
  registerCommands(context, dbService, tracker);

  // Initial status bar update
  statusBarManager.update(tracker.getActiveState(), tracker.getTodayAccumulatedTime());

  // Listen for config changes to dynamically update settings
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('devActivityTracker')) {
        if (tracker) {
          tracker.updateConfig();
        }
      }
    })
  );
}

export function deactivate() {
  console.log('Developer Activity & Coding Analytics extension deactivating...');
  
  if (localServer) {
    localServer.stop();
  }
  if (tracker) {
    tracker.deactivate();
  }
  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
