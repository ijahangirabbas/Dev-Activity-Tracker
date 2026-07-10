# Developer Activity & Coding Analytics

[![Version](https://img.shields.io/visual-studio-marketplace/v/jeem-labs.dev-activity-tracker.svg?color=indigo)](https://marketplace.visualstudio.com/items?itemName=jeem-labs.dev-activity-tracker)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/jeem-labs.dev-activity-tracker.svg)](https://marketplace.visualstudio.com/items?itemName=jeem-labs.dev-activity-tracker)
[![License](https://img.shields.io/github/license/ijahangirabbas/Dev-Activity-Tracker?color=emerald)](LICENSE)

A professional, production-grade Visual Studio Code extension that automatically tracks your complete coding workflow with **zero manual interaction**. No start buttons, no stop buttons, no manual timers—it runs quietly in the background, respects your privacy, and visualizes your coding productivity in a premium interactive dashboard.

---

## ✨ Features

* **⚡ Zero-Configuration, Auto-Tracking**: Activates instantly. Tracks keypresses, cursor navigation, tab switches, file saves, and window focus changes.
* **🧠 Smart Heuristic Classification**: Intelligently distinguishes between active **Coding**, **Reading Code**, **Debugging**, **Terminal Usage**, **Git Operations**, **Testing**, and **AI Assistant Usage** (GitHub Copilot, Continue, Cline, etc.).
* **🔒 Privacy & Offline First**: All data is stored locally on your machine in a structured JSON database. No code, filenames, paths, prompts, or inputs are ever uploaded. Supports **Privacy Mode** to automatically mask file paths and project names.
* **📊 Premium Analytics Dashboard**: An interactive glassmorphic dashboard showcasing:
  * **GitHub-Style Yearly Heatmap** of coding intensity.
  * **Daily Goal Progress** tracking (e.g. 4-hour target).
  * **Language & Workspace Breakdowns** (time spent per language and per project folder).
  * **File Analytics** (most edited files, total read/write time, edit counts).
  * **Chronological Timeline** of system, git, and coding events.
* **🔥 Consistency Streaks**: Tracks daily and weekly coding streaks to motivate progress.
* **📟 Dynamic Status Bar**: Displays live progress (e.g., `💻 Today 2h 15m | ⚡ Coding | 🔥 5d`) with click-to-open dashboard integration.
* **📤 Backup & Export**: Export logs as JSON, CSV, or formatted Markdown. Create and restore manual or rolling automated backups.

---

## 🎨 Interactive Dashboard Preview

The dashboard is built with a premium dark-themed glassmorphism aesthetic that responds to your VS Code system theme (fully compatible with light, dark, and high contrast themes).

* **Header Controls**: Switch time ranges (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Lifetime) and trigger data exports instantly.
* **Goal Completion Ring**: A dynamic SVG progress ring displaying goal percentage completion.
* **Detailed lists**: Filter and sort files by interaction type (Edits vs. Reads) and search files by path queries.

---

## 🔧 How It Works: Smart Detection Heuristics

Every second, the tracking engine evaluates your IDE interaction events:
1. **Idle Detection**: If no mouse, selection, typing, or terminal activity is detected for the timeout period (default `5 minutes`, configurable to `1, 3, 5, 10, 15 minutes`), the session automatically pauses.
2. **Classifications**:
   * **Debugging**: Debugger session is active.
   * **AI Assisting**: Copilot, Continue, or LLM commands executed within the last 15 seconds.
   * **Terminal**: Integrated terminal focused or shell commands run within the last 30 seconds.
   * **Git**: Commit, merge, or branch-switch occurred within the last 15 seconds.
   * **Testing**: Test suite run results changed within the last 15 seconds.
   * **Coding**: Editing or saving document text within the last 30 seconds.
   * **Reading**: Active document open and window is focused, with no text edits.

---

## ⚙️ Extension Settings

Configure the extension by opening your VS Code Settings (`Ctrl + ,` / `Cmd + ,`) and searching for `Developer Activity`:

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `devActivityTracker.idleTimeout` | Integer | `300` | Inactive duration in seconds before session auto-pauses (1, 3, 5, 10, or 15 mins). |
| `devActivityTracker.dailyGoal` | Integer | `14400` | Target productivity hours in seconds (default is `4 hours`). |
| `devActivityTracker.privacyMode` | Boolean | `false` | If enabled, hashes workspace names and file paths to obscure privacy. |
| `devActivityTracker.showStatusBar` | Boolean | `true` | Toggles whether the live status bar indicator is displayed. |

---

## 📂 Exporting & Backing Up Data

* **Export Report**: Export stats directly from the dashboard panel into:
  * **JSON**: Complete raw tracking logs.
  * **CSV**: Row-by-row daily metrics.
  * **Markdown**: A formatted markdown report with details, metrics, and project splits.
* **Automatic Backups**: The database triggers a rolling backup (keeping the 5 most recent backups) in a dedicated local folder to prevent data loss in the event of hardware or OS failures.

---

## 🚀 Setup & Installation

### Option A: From the Extension Marketplace
*(Once published)*
1. Open VS Code.
2. Go to the Extensions panel (`Ctrl + Shift + X`).
3. Search for **`Developer Activity & Coding Analytics`**.
4. Click **Install**.

### Option B: Local Installation (For Personal Use)
1. Generate the `.vsix` installer bundle in the project root:
   ```bash
   npx @vscode/vsce package
   ```
2. Open VS Code.
3. Open the Extensions panel (`Ctrl + Shift + X`), click the `...` menu at the top right, and choose **`Install from VSIX...`**.
4. Select the generated `dev-activity-tracker-1.0.0.vsix` file.

---

## 🛡️ Privacy & Security First

This extension is built for developers who care about code privacy.
* **Zero Cloud Connectivity**: All logs are written locally to your machine.
* **No Code Analysis**: We track time and keystroke counts, **never** your actual source code content, clipboard contents, prompts, or AI model responses.
* **Full Data Ownership**: You can wipe, export, merge, or import your data logs at any time from the dashboard settings.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
