export class LanguageTracker {
  private static languageMap: Record<string, string> = {
    'javascript': 'JavaScript',
    'javascriptreact': 'React JSX',
    'typescript': 'TypeScript',
    'typescriptreact': 'TypeScript JSX (TSX)',
    'python': 'Python',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'go': 'Go',
    'rust': 'Rust',
    'php': 'PHP',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'yaml': 'YAML',
    'markdown': 'Markdown',
    'sql': 'SQL',
    'shellscript': 'Shell',
    'dockerfile': 'Dockerfile',
    'xml': 'XML',
    'csharp': 'C#',
    'swift': 'Swift',
    'ruby': 'Ruby',
    'kotlin': 'Kotlin',
    'perl': 'Perl',
    'dart': 'Dart',
    'powershell': 'PowerShell',
    'makefile': 'Makefile',
    'toml': 'TOML',
    'ini': 'INI',
    'git-commit': 'Git Commit',
    'git-rebase': 'Git Rebase'
  };

  public static getLanguageName(languageId: string): string {
    return this.languageMap[languageId.toLowerCase()] || this.capitalize(languageId);
  }

  private static capitalize(str: string): string {
    if (!str) { return ''; }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
