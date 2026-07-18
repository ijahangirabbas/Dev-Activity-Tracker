import * as vscode from 'vscode';
import * as path from 'path';

export class GitTracker {
  private gitApi: any;
  private disposables: vscode.Disposable[] = [];
  private onCommitCallback: () => void;
  private onBranchChangeCallback: (branch: string) => void;

  constructor(onCommit: () => void, onBranchChange: (branch: string) => void) {
    this.onCommitCallback = onCommit;
    this.onBranchChangeCallback = onBranchChange;
    this.initGitExtension();
  }

  private initGitExtension() {
    try {
      const gitExtension = vscode.extensions.getExtension<any>('vscode.git');
      if (gitExtension) {
        if (!gitExtension.isActive) {
          gitExtension.activate().then(() => this.setupGit(gitExtension.exports));
        } else {
          this.setupGit(gitExtension.exports);
        }
      }
    } catch (e) {
      console.error('Failed to initialize Git Tracker:', e);
    }
  }

  private setupGit(gitExports: any) {
    try {
      this.gitApi = gitExports.getAPI(1);
      if (this.gitApi) {
        // Listen for new repositories
        this.disposables.push(this.gitApi.onDidOpenRepository((repo: any) => {
          this.subscribeToRepo(repo);
        }));
        
        // Subscribe to existing repositories
        for (const repo of this.gitApi.repositories) {
          this.subscribeToRepo(repo);
        }
      }
    } catch (e) {
      console.error('Error setting up Git tracking:', e);
    }
  }

  private subscribeToRepo(repo: any) {
    try {
      let lastCommitHash = repo.state.HEAD?.commit;
      let lastBranch = repo.state.HEAD?.name;

      this.disposables.push(repo.state.onDidChange(() => {
        const currentBranch = repo.state.HEAD?.name;
        const currentCommit = repo.state.HEAD?.commit;

        if (currentBranch && currentBranch !== lastBranch) {
          lastBranch = currentBranch;
          this.onBranchChangeCallback(currentBranch);
        }

        if (currentCommit && currentCommit !== lastCommitHash) {
          lastCommitHash = currentCommit;
          this.onCommitCallback();
        }
      }));
    } catch (e) {
      console.error('Error subscribing to repository events:', e);
    }
  }

  public getRepoDetails(privacyMode: boolean = false): { repository: string, branch: string } {
    if (!this.gitApi || this.gitApi.repositories.length === 0) {
      return { repository: '', branch: '' };
    }
    
    // Find the active repo or use the first one
    const repo = this.gitApi.repositories[0];
    let repository = '';
    
    if (repo && repo.rootUri) {
      repository = path.basename(repo.rootUri.fsPath);
    }
    
    let branch = (repo && repo.state.HEAD) ? repo.state.HEAD.name || '' : '';

    if (privacyMode) {
      if (repository) {
        repository = `repo_${this.simpleHash(repository)}`;
      }
      if (branch) {
        branch = `branch_${this.simpleHash(branch)}`;
      }
    }
    
    return { repository, branch };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 6).toUpperCase();
  }

  public dispose() {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
