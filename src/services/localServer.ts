import * as http from 'http';
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { DatabaseService } from '../storage/database';

export class LocalServer {
  private server: http.Server | undefined;
  private context: vscode.ExtensionContext;
  private getLiveDatabase: () => any;
  private port: number = 54321;
  private token: string | undefined;
  private readonly allowedOrigins = new Set([
    'https://dev-activity-tracker-zeta.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]);

  constructor(context: vscode.ExtensionContext, _dbService: DatabaseService, getLiveDatabase: () => any) {
    this.context = context;
    this.getLiveDatabase = getLiveDatabase;
  }

  private async ensureToken(): Promise<void> {
    let token = await this.context.secrets.get('devTracker.bridgeToken');
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await this.context.secrets.store('devTracker.bridgeToken', token);
    }
    this.token = token;
  }

  private validateSettings(settings: any): string | null {
    if (settings.idleTimeout !== undefined) {
      if (typeof settings.idleTimeout !== 'number' || !Number.isInteger(settings.idleTimeout) || settings.idleTimeout < 10 || settings.idleTimeout > 3600) {
        return 'idleTimeout must be an integer between 10 and 3600 seconds.';
      }
    }
    if (settings.dailyGoal !== undefined) {
      if (typeof settings.dailyGoal !== 'number' || !Number.isInteger(settings.dailyGoal) || settings.dailyGoal < 60 || settings.dailyGoal > 86400) {
        return 'dailyGoal must be an integer between 60 and 86400 seconds.';
      }
    }
    if (settings.privacyMode !== undefined) {
      if (typeof settings.privacyMode !== 'boolean') {
        return 'privacyMode must be a boolean.';
      }
    }
    if (settings.showStatusBar !== undefined) {
      if (typeof settings.showStatusBar !== 'boolean') {
        return 'showStatusBar must be a boolean.';
      }
    }
    if (settings.userId !== undefined && settings.userId !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (typeof settings.userId !== 'string' || !uuidRegex.test(settings.userId)) {
        return 'userId must be a valid UUID format.';
      }
    }
    return null;
  }

  public async start(): Promise<void> {
    await this.ensureToken();

    this.server = http.createServer((req, res) => {
      const origin = req.headers.origin;
      const isAllowedOrigin = !origin || this.allowedOrigins.has(origin);

      if (origin && isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(isAllowedOrigin ? 204 : 403);
        res.end();
        return;
      }

      if (!isAllowedOrigin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Origin not allowed' }));
        return;
      }

      const parsedUrl = new URL(req.url || '', `http://127.0.0.1:${this.port}`);
      const pathname = parsedUrl.pathname;
      const queryToken = parsedUrl.searchParams.get('token');

      // Authenticate token
      const authHeader = req.headers.authorization;
      let tokenToVerify = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        tokenToVerify = authHeader.substring(7);
      } else if (queryToken) {
        tokenToVerify = queryToken;
      }

      if (!tokenToVerify || tokenToVerify !== this.token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Invalid token' }));
        return;
      }

      if (req.method === 'GET' && pathname === '/api/data') {
        try {
          const db = this.getLiveDatabase();
          const config = vscode.workspace.getConfiguration('devTracker');
          const settings = {
            idleTimeout: config.get<number>('idleTimeout') || 300,
            dailyGoal: config.get<number>('dailyGoal') || 14400,
            privacyMode: config.get<boolean>('privacyMode') || false,
            showStatusBar: config.get<boolean>('showStatusBar') || true,
            userId: config.get<string>('userId') || ''
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ db, settings }));
        } catch (e: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      } else if (req.method === 'POST' && pathname === '/api/settings') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const settings = JSON.parse(body);
            const validationError = this.validateSettings(settings);
            if (validationError) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: validationError }));
              return;
            }

            const vsConfig = vscode.workspace.getConfiguration('devTracker');
            
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
            if (settings.userId !== undefined) {
              await vsConfig.update('userId', settings.userId, vscode.ConfigurationTarget.Global);
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

    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`Local activity tracker API server running on http://127.0.0.1:${this.port}`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      console.log('Local activity tracker API server stopped.');
    }
  }
}
