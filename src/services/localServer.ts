import * as http from 'http';
import * as vscode from 'vscode';
import { DatabaseService } from '../storage/database';

export class LocalServer {
  private server: http.Server | undefined;
  private dbService: DatabaseService;
  private getLiveDatabase: () => any;
  private port: number = 54321;

  constructor(dbService: DatabaseService, getLiveDatabase: () => any) {
    this.dbService = dbService;
    this.getLiveDatabase = getLiveDatabase;
  }

  public start(): void {
    this.server = http.createServer((req, res) => {
      // CORS headers allowing browser connections
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = req.url || '';

      if (req.method === 'GET' && url === '/api/data') {
        try {
          const db = this.getLiveDatabase();
          const config = vscode.workspace.getConfiguration('devActivityTracker');
          const settings = {
            idleTimeout: config.get<number>('idleTimeout') || 300,
            dailyGoal: config.get<number>('dailyGoal') || 14400,
            privacyMode: config.get<boolean>('privacyMode') || false,
            showStatusBar: config.get<boolean>('showStatusBar') || true
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ db, settings }));
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      } else if (req.method === 'POST' && url === '/api/settings') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const settings = JSON.parse(body);
            const vsConfig = vscode.workspace.getConfiguration('devActivityTracker');
            
            if (settings.idleTimeout !== undefined) {
              await vsConfig.update('idleTimeout', settings.idleTimeout, vscode.ConfigurationTarget.Global);
            }
            if (settings.dailyGoal !== undefined) {
              await vsConfig.update('dailyGoal', settings.dailyGoal, vscode.ConfigurationTarget.Global);
            }
            if (settings.privacyMode !== undefined) {
              await vsConfig.update('privacyMode', settings.privacyMode, vscode.ConfigurationTarget.Global);
            }
            if (settings.showStatusBar !== undefined) {
              await vsConfig.update('showStatusBar', settings.showStatusBar, vscode.ConfigurationTarget.Global);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    this.server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.warn(`Local Tracker server: Port ${this.port} is busy, retrying to start...`);
      }
    });

    this.server.listen(this.port, () => {
      console.log(`Local activity tracker API server running on http://localhost:${this.port}`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      console.log('Local activity tracker API server stopped.');
    }
  }
}
