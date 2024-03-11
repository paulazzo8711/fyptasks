import * as vscode from "vscode";
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
let statusBarBtn: vscode.StatusBarItem;
async function startCognitiveLoadEstimation() {
  console.log("Starting cognitive load estimation...");
  try {
    const extension = vscode.extensions.getExtension(
      "paulazzopardi.cognitiveloadestimator"
    );
    if (extension) {
      await extension.activate();
      await vscode.commands.executeCommand(
        "cognitiveloadestimator.customTimeOn"
      );
    } else {
      console.error("Extension not found.");
    }
  } catch (error) {
    console.error("Error starting cognitive load estimation:", error);
  }
}
async function stopCognitiveLoadEstimation() {
  console.log("Stopping cognitive load estimation...");
  try {
    const extension = vscode.extensions.getExtension(
      "paulazzopardi.cognitiveloadestimator"
    );
    if (extension) {
      await extension.activate();
      console.log("Extension activated.");

      return await vscode.commands.executeCommand(
        "cognitiveloadestimator.customTimeOff"
      );
      console.log("Command executed.");
    } else {
      console.error("Extension not found.");
    }
  } catch (error) {
    console.error("Error stopping cognitive load estimation:", error);
  }
}

async function writeToExcel(data: {
  mentalDemand: any;
  physicalDemand: any;
  temporalDemand: any;
  performance: any;
  effort: any;
  frustration: any;
  mean: any;
  value: any;
  time: any;
  taskNumber: any;
  tlxScores: any;
  cognitiveLoad: any;
}) {
  const desktopPath = path.join(require("os").homedir(), "Desktop");
  const filePath = path.join(desktopPath, "TaskData.xlsx");
  const workbook = new ExcelJS.Workbook();
  console.log("Writing to Excel file...", data);

  try {
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
    } else {
      if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
      }
      workbook.addWorksheet("Task Data");
    }

    let sheet =
      workbook.getWorksheet("Task Data") || workbook.addWorksheet("Task Data");

    sheet.columns = [
      { header: "Submitted Value", key: "value", width: 30 },
      { header: "Time Taken (Seconds)", key: "time", width: 20 },
      { header: "Task Number", key: "taskNumber", width: 50 },
      { header: "Predicted Load", key: "cognitiveLoad", width: 15 },
      { header: "Mental Demand", key: "mentalDemand", width: 15 },
      { header: "Physical Demand", key: "physicalDemand", width: 15 },
      { header: "Temporal Demand", key: "temporalDemand", width: 15 },
      { header: "Performance", key: "performance", width: 15 },
      { header: "Effort", key: "effort", width: 15 },
      { header: "Frustration", key: "frustration", width: 15 },
      { header: "Mean", key: "mean", width: 15 },
      { header: "Date", key: "date", width: 15 },
      { header: "Timestamp", key: "timestamp", width: 15 },
    ];

    const date = new Date();
    const dateString = date.toLocaleDateString();
    const timestampString = date.toLocaleTimeString();

    sheet.addRow({
      ...data,
      date: dateString,
      timestamp: timestampString,
    });

    await workbook.xlsx.writeFile(filePath);
    console.log(`File saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving the file:", error);
  }
}

export function activate(context: vscode.ExtensionContext) {
  statusBarBtn = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarBtn.command = "fyptasks.showTask";
  statusBarBtn.text = "$(checklist) Begin Tasks";
  statusBarBtn.tooltip = "Click to begin tasks";
  statusBarBtn.show();

  let toggleEstimationDisposable = vscode.commands.registerCommand(
    "fyptasks.showTask",
    () => {
      TaskPanel.createOrShow(context.extensionUri);
    }
  );

  context.subscriptions.push(toggleEstimationDisposable);
}
exports.activate = activate;
class TaskPanel {
  public static currentPanel: TaskPanel | undefined;
  public static readonly viewType = "taskView";
  public tempTaskData: {
    value: any;
    time: any;
    taskNumber: any;
    tlxScores: any;
    cognitiveLoad: any;
  } | null = null;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private currentState: "task" | "tlx" | "feedback" = "task";
  public totalTasks = 11;
  public tasksCompleted = 0;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.ViewColumn.One;

    if (TaskPanel.currentPanel) {
      TaskPanel.currentPanel._panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel(
        TaskPanel.viewType,
        "Task View",
        column,
        {
          enableScripts: true,
        }
      );

      TaskPanel.currentPanel = new TaskPanel(panel, extensionUri);
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "submitTask":
            this.tasksCompleted++;
            console.log(
              "Submitted value: " +
                message.text +
                ", Time taken: " +
                message.timeTaken +
                " Seconds, Task : " +
                message.taskNumber
            );
            this.currentState = "tlx";
            this._update();
            stopCognitiveLoadEstimation().then((cognitiveLoadData) => {
              this.tempTaskData = {
                value: message.text,
                time: message.timeTaken,
                taskNumber: message.taskNumber,
                tlxScores: null,
                cognitiveLoad: cognitiveLoadData,
              };

              this._update();
            });
            break;
          case "submitTLX":
            console.log("TLX Scores submitted", message.scores);

            if (this.tempTaskData) {
              writeToExcel({
                ...this.tempTaskData,
                mentalDemand: message.scores.mentalDemand,
                physicalDemand: message.scores.physicalDemand,
                temporalDemand: message.scores.temporalDemand,
                performance: message.scores.performance,
                effort: message.scores.effort,
                frustration: message.scores.frustration,
                mean: message.scores.mean,
              });
              this.tempTaskData = null;
            }
            this.taskNumber++;
            if (this.tasksCompleted >= this.totalTasks) {
              this.currentState = "feedback";
            } else {
              this.currentState = "task";
            }

            this._update();
            break;
          case "submitFeedback":
            console.log("Feedback submitted", message.feedback);
            this._panel.dispose();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    TaskPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    let htmlContent = "";
    if (this.currentState === "task" && this.tasksCompleted < this.totalTasks) {
      htmlContent = (await this._getHtmlForWebview(this._panel.webview)) || "";
    } else if (this.currentState === "tlx") {
      htmlContent =
        (await this._getTlxHtmlForWebview(this._panel.webview)) || "";
    } else if (this.tasksCompleted === this.totalTasks) {
      htmlContent =
        (await this._getFeedbackHtmlForWebview(this._panel.webview)) || "";
    }

    this._panel.webview.html = htmlContent || "";
  }

  public taskNumber = 0;

  private async _getHtmlForWebview(webview: vscode.Webview) {
    startCognitiveLoadEstimation();

    if (this.currentState === "task") {
      const taskNumber = this.taskNumber + 1;

      const taskPath = path.join(
        this._extensionUri.fsPath,
        "media",
        "tasks",
        `task${taskNumber}`
      );

      const descriptionPath = path.join(taskPath, "description.txt");
      const codePath = path.join(taskPath, "code.java");

      const description = await vscode.workspace.fs.readFile(
        vscode.Uri.file(descriptionPath)
      );
      const code = await vscode.workspace.fs.readFile(
        vscode.Uri.file(codePath)
      );

      const descriptionText = Buffer.from(description).toString("utf8");
      const codeText = Buffer.from(code).toString("utf8");
      const codeLines = codeText.split("\n");
      const codeWithLineNumbers = codeLines
        .map((line, index) => `${index + 1} ${line}`)
        .join("\n");

      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
      );
      const bootstrapCssUri =
        "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css";

      return `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${bootstrapCssUri}" rel="stylesheet">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css" rel="stylesheet" />

      <title>Task View</title>
      <style>
      .container-fluid {
          padding: 20px;
      }
      #result {
          height: 100px; /* Make the input box taller */
      }
      .timer-bar {
          height: 30px;
          transition: width 1s ease-in-out;
      }
      .alert-timer {
          color: red; /* Change text color to red for alerts */
      }
      .col-md-6{
        padding-top: 60px;
      }
      .description-text {
        font-size: 1.2em;
        line-height: 1.6;
        color: #333;
      }
      .question-number {
        font-size: 2em;
        font-weight: bold;
        margin-bottom: 20px;
      }
  </style>
  </head>

  <body>
  <div class="container-fluid">
  <div class="row">
    <div class="col-md-12 text-center">
      <p class="question-number">Question ${taskNumber}</p>
      <p><strong>Timer:</strong> <span id="timer">03:00</span></p>
      <!-- Timer progress bar -->
      <div class="progress">
          <div class="progress-bar timer-bar" role="progressbar" style="width: 100%" id="timerBar"></div>
      </div>
    </div>
  </div>
  <div class="row">
      <div class="col-md-6">
      <p class="description-text">${descriptionText}</p>
      <pre><code class="language-java">${codeWithLineNumbers}</code></pre>
          
      </div>
        <div class="col-md-6 d-flex flex-column justify-content-between">
            <textarea id="result" class="form-control mb-2" placeholder="Enter your result" style="flex-grow: 1;"></textarea>
            <button id="submit" class="btn btn-primary btn-block">Submit</button>
        </div>
    </div>
    <div class="row">
    <div class="col-md-6">

    </div>
</div>
  </div>
  <script src="${scriptUri}"></script>
  <script>
  const vscode = acquireVsCodeApi();
  const taskNumber = ${taskNumber};
</script>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-java.min.js"></script>

</body>

      </html>`;
    } else if (this.currentState === "tlx") {
      return this._getTlxHtmlForWebview(webview);
    }
  }
  private _getTlxHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "tlx.js")
    );
    const bootstrapCssUri =
      "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css";

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${bootstrapCssUri}" rel="stylesheet">
  <title>Task View</title>
</head>
<style>
  .text-center {
    display: block;
  }
</style>

  <body>
      <div class="container">
      <h2 class="text-center">NASA TLX Score</h2>
<br/>
          <form id="tlxForm">
          <div class="form-group">
            <label for="mentalDemand" class="text-center"><strong>Mental Demand:</strong> How mentally demanding was the task?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" min="0" max="100" step="5" value="0" id="mentalDemand">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
          <label for="physicalDemand" class="text-center"><strong>Physical Demand:</strong> How physically demanding was the task?</label>
          <div class="d-flex justify-content-between">
            <span>Very Low</span>
            <input type="range" class="form-control-range" min="0" max="100" step="5" value="0" id="physicalDemand">
            <span>Very High</span>
          </div>
        </div>
        <div class="form-group">
          <label for="temporalDemand" class="text-center"><strong>Temporal Demand:</strong> How hurried or rushed was the pace of the task?</label>
          <div class="d-flex justify-content-between">
            <span>Very Low</span>
            <input type="range" class="form-control-range" min="0" max="100" step="5" value="0" id="temporalDemand">
            <span>Very High</span>
          </div>
        </div>
          <div class="form-group">
            <label for="performance" class="text-center"><strong>Performance:</strong> How successful were you in accomplishing what you were asked to do?</label>
            <div class="d-flex justify-content-between">
              <span>Perfect</span>
              <input type="range" class="form-control-range" min="0" max="100" step="5" value="0" id="performance">
              <span>Failure</span>
            </div>
          </div>
          <div class="form-group">
            <label for="effort" class="text-center"><strong>Effort:</strong> How hard did you have to work to accomplish your level of performance?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" min="0" max="100" step="5" value="0" id="effort">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
            <label for="frustration" class="text-center"><strong>Frustration:</strong> How insecure, discouraged, irritated, stressed, and annoyed versus secure, gratified, content, relaxed, and complacent did you feel during the task?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" min="0" max="100" step="5" value="0" id="frustration">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
          <div class="d-flex justify-content-center">
            <button type="submit" id="submitTlx" class="btn btn-primary mt-2">Submit</button>
          </div>
        </div>

        </form>

      </div>
      <script src="${scriptUri}"></script>
  </body>
  </html>`;
  }
  private _getFeedbackHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "feedback.js")
    );
    const bootstrapCssUri =
      "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css";

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${bootstrapCssUri}" rel="stylesheet">
  <title>Task View</title>
</head>
      <!-- Head content including bootstrap CSS -->
    </head>
    <body>
      <div class="container">
        <h2>Tasks Complete</h2>
        <p>Please provide your feedback below:</p>
        <textarea id="feedback" class="form-control" rows="5"></textarea>
        <button id="submitFeedback" class="btn btn-primary mt-2">Submit Feedback</button>
      </div>
      <!-- Include your script for handling feedback submission -->
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}
