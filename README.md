<div align="center">
  <img src="https://raw.githubusercontent.com/ijahangirabbas/Dev-Activity-Tracker/main/icon.png" width="128" height="128" alt="DevTracker Logo" />
  <h1>DevTracker</h1>
  <p><b>Automatic coding workflow analytics & glassmorphic dashboards right inside your IDE.</b></p>
  <p>Zero manual action. 100% offline-first. Privacy-focused.</p>

  <p align="center">
    <img src="https://img.shields.io/visual-studio-marketplace/v/jeem-labs.dev-activity-tracker.svg?style=flat-square&color=indigo" alt="Marketplace Version" />
    <img src="https://img.shields.io/visual-studio-marketplace/i/jeem-labs.dev-activity-tracker.svg?style=flat-square" alt="Installs" />
    <img src="https://img.shields.io/visual-studio-marketplace/r/jeem-labs.dev-activity-tracker.svg?style=flat-square" alt="Rating" />
    <img src="https://img.shields.io/github/license/ijahangirabbas/Dev-Activity-Tracker?style=flat-square&color=emerald" alt="License" />
  </p>
</div>

---

**DevTracker** runs quietly in your status bar, evaluating active editor focus, keystrokes, terminal shell activity, and debug sessions. It uses smart heuristic classification to separate time spent **Coding**, **Reading**, **Debugging**, using **Terminal**, committing in **Git**, running **Tests**, or querying **AI Assistants**.

No start buttons, no timers, and no tracking of raw code contents or clipboard data.

---

## ✨ Features

* **⚡ Auto-Tracking**: Automatically logs active typing, reading, and terminal execution without breaking your developer flow.
* **🧠 Smart Classification Heuristics**: Automatically categorizes activities:
  * **Coding**: Modifying text and saving files.
  * **Reading**: Active scrolling and selection navigation with no edits.
  * **Debugging**: Actively running debugger sessions.
  * **Terminal**: Integrated terminal focused or executing CLI commands.
  * **Git**: Commit, merge, or branch-switch states.
  * **Testing**: Running test suites.
  * **AI Assisting**: Copilot, Continue, or Cline LLM queries.
* **🔒 Privacy Mode & Obfuscation**: Toggle Privacy Mode to dynamically mask local file names, workspace names, repository links, and branches into stable hashes (e.g. `Project_7A3F`).
* **📊 Premium Interactive Dashboard**: Glassmorphic, responsive offline layout rendering:
  * **GitHub-Style Contribution Heatmap** of coding intensity.
  * **Goal Completion Ring** checking against daily targets.
  * **Language & Project Time splits**.
  * **File interaction analytics** (Edits vs. Reads count, time spent, search queries).
  * **Recent Events Timeline**.
* **📟 Active Status Bar**: Displays live progress (e.g. `$(clock) 2h 15m $(code) Coding $(flame) 5d`) with click-to-open dashboard integration.
* **📤 Backup, Restore & Export**: Back up the database or export activity sheets as JSON, CSV, or formatted Markdown reports.

---

## ⌨️ Commands Reference

Open the Command Palette (`Ctrl + Shift + P` or `Cmd + Shift + P`) and search for **DevTracker**:

| Command | Description |
| :--- | :--- |
| `DevTracker: Show Analytics Dashboard` | Opens the interactive analytics dashboard panel. |
| `DevTracker: Pause Tracking` | Pauses active tracking listeners. |
| `DevTracker: Resume Tracking` | Resumes tracking listeners. |
| `DevTracker: Re-sanitize History` | Re-applies Privacy Mode rules to all historical sessions and rebuilds daily aggregates. |
| `DevTracker: Backup Data` | Creates a manual backup copy of your database. |
| `DevTracker: Restore Data` | Restores database from a selected backup. |
| `DevTracker: Export Analytics Data` | Exports tracking logs as JSON, CSV, or Markdown. |

---

## ⚙️ Configuration Settings

Customize DevTracker by opening VS Code Settings (`Ctrl + ,` or `Cmd + ,`) and searching for `DevTracker`:

| Setting Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `devTracker.idleTimeout` | `Integer` | `300` | Inactive duration in seconds before tracking auto-pauses (1, 3, 5, 10, or 15 minutes). |
| `devTracker.dailyGoal` | `Integer` | `14400` | Target productivity hours in seconds (default is `4 hours`). |
| `devTracker.privacyMode` | `Boolean` | `false` | If enabled, obfuscates workspaces, file names, paths, repositories, and branches. |
| `devTracker.recordRawTerminalCommands` | `Boolean` | `false` | If true, records raw terminal inputs. If false, only category is stored and secrets are redacted. |
| `devTracker.showStatusBar` | `Boolean` | `true` | Show/hide the live status bar indicator. |
| `devTracker.userId` | `String` | `""` | User UUID for pairing with your hosted/online dashboard account. |

---

## 🚀 Getting Started & Onboarding

### Option A: From the Marketplace (Recommended)
1. Open VS Code.
2. Go to the Extensions panel (`Ctrl + Shift + X`).
3. Search for **`DevTracker`**.
4. Click **Install**.

### Option B: Local VSIX Installation
1. Package the extension locally (pre-requisite: `@vscode/vsce` installed):
   ```bash
   npx vsce package
   ```
2. In VS Code, open the Extensions panel, click the `...` menu at the top-right, and select **Install from VSIX...**.
3. Choose the generated `devtracker-1.0.1.vsix` file.

---

## 🛡️ Data Security & FAQ

* **Does DevTracker read my code?**  
  **No.** DevTracker only monitors file names, edit events, and editor activity counts. The contents of your files are never read or stored.
* **Is there cloud tracking?**  
  By default, **no**. All database records are stored locally on your machine in standard JSON files. If you sign up for the optional hosted web dashboard, you can paste your UUID to securely sync your logs—no passwords or database keys are ever exposed in VS Code.
* **How does interaction decay work?**  
  To prevent overcounting reading time (e.g. if you leave a file focused while away or reading on another screen), DevTracker stops counting active time after **60 seconds** of passive focus without user keystrokes, tab navigation, or cursor movement.

---

## 📖 Additional Docs

* [Troubleshooting Guide](file:///j:/Projects/dev-activity-tracker/docs/TROUBLESHOOTING.md)
* [Database Data Dictionary](file:///j:/Projects/dev-activity-tracker/docs/DATA_DICTIONARY.md)

---

<div align="center">
  <sub>Built by <b>Jeem Labs</b>. Distributed under the MIT License.</sub>
</div>
