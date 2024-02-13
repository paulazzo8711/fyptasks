import * as vscode from "vscode";
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
async function startCognitiveLoadEstimation() {
  console.log("Starting cognitive load estimation...");
  try {
    const extension = vscode.extensions.getExtension(
      "paulazzopardi.cognitiveloadestimator"
    );
    if (extension) {
      await extension.activate(); // Ensure the extension is activated
      await vscode.commands.executeCommand(
        "cognitiveloadestimator.customTimeOn"
      ); // Corrected command
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
      await extension.activate(); // Ensure the extension is activated
      return await vscode.commands.executeCommand(
        "cognitiveloadestimator.customTimeOff"
      ); // Assuming this is the correct command
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
  image: any;
  tlxScores: any;
  cognitiveLoad: any;
}) {
  const desktopPath = path.join(require("os").homedir(), "Desktop");
  const filePath = path.join(desktopPath, "TaskData.xlsx");
  const workbook = new ExcelJS.Workbook();
  console.log("Writing to Excel file...", data);

  try {
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, load the existing workbook
      await workbook.xlsx.readFile(filePath);
    } else {
      // Ensure the directory exists
      if (!fs.existsSync(desktopPath)) {
        fs.mkdirSync(desktopPath, { recursive: true });
      }
      // If the file doesn't exist, add a new worksheet
      workbook.addWorksheet("Task Data");
    }

    // Get the worksheet, if it doesn't exist create a new one
    let sheet =
      workbook.getWorksheet("Task Data") || workbook.addWorksheet("Task Data");

    // Check if the worksheet has columns defined, if not define them
    // if (!sheet.columns || sheet.columns.length === 0) {
    //   console.log("Defining columns");

    sheet.columns = [
      { header: "Submitted Value", key: "value", width: 30 },
      { header: "Time Taken (Seconds)", key: "time", width: 20 },
      { header: "Task Image Link", key: "image", width: 50 },
      { header: "Predicted Load", key: "cognitiveLoad", width: 15 },
      // Define columns for each TLX score
      { header: "Mental Demand", key: "mentalDemand", width: 15 },
      { header: "Physical Demand", key: "physicalDemand", width: 15 },
      { header: "Temporal Demand", key: "temporalDemand", width: 15 },
      { header: "Performance", key: "performance", width: 15 },
      { header: "Effort", key: "effort", width: 15 },
      { header: "Frustration", key: "frustration", width: 15 },
      { header: "Mean", key: "mean", width: 15 },
    ];
    // }

    // Add a row
    sheet.addRow(data);

    // Commit changes to the workbook
    // await workbook.commit();

    // Write back to the file
    await workbook.xlsx.writeFile(filePath);
    console.log(`File saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving the file:", error);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("fyptasks.showTasks", () => {
      TaskPanel.createOrShow(context.extensionUri);
    })
  );

  // Automatically show tasks when the extension is activated
  vscode.commands.executeCommand("fyptasks.showTasks");
}
exports.activate = activate;
class TaskPanel {
  public static currentPanel: TaskPanel | undefined;
  public static readonly viewType = "taskView";
  public tempTaskData: {
    value: any;
    time: any;
    image: any;
    tlxScores: any;
    cognitiveLoad: any;
  } | null = null;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private currentState: "task" | "tlx" | "feedback" = "task"; // Add currentState property
  public totalTasks = 10; // Total number of tasks to be completed
  public tasksCompleted = 0; // Counter for completed tasks

  public static createOrShow(extensionUri: vscode.Uri) {
    // Open in the main editor window
    const column = vscode.ViewColumn.One; // Or vscode.ViewColumn.Active

    if (TaskPanel.currentPanel) {
      TaskPanel.currentPanel._panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel(
        TaskPanel.viewType,
        "Task View",
        column, // Target the main editor area
        {
          enableScripts: true,
        }
      );

      TaskPanel.currentPanel = new TaskPanel(panel, extensionUri);

      // Toggle Zen Mode after opening the webview
      vscode.commands.executeCommand("workbench.action.toggleZenMode");
    }
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    // Inside TaskPanel's message handling
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
                " Seconds, Task Image Link: " +
                message.image
            );
            stopCognitiveLoadEstimation().then((cognitiveLoadData) => {
              this.tempTaskData = {
                value: message.text,
                time: message.timeTaken,
                image: message.image,
                tlxScores: null,
                cognitiveLoad: cognitiveLoadData,
              };
              this.currentState = "tlx"; // Proceed to TLX after task submission

              this._update(); // Refresh the view to show TLX form
            });
            break;
          case "submitTLX":
            console.log("TLX Scores submitted", message.scores);
            // Combine TLX data with temporary task data and write to Excel

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
              this.tempTaskData = null; // Clear temporary storage after writing
            }

            // Right after incrementing tasksCompleted
            if (this.tasksCompleted >= this.totalTasks) {
              // All tasks are done, prepare to show feedback
              this.currentState = "feedback"; // Assuming you use "feedback" as a state for showing the feedback form
            } else {
              // Proceed to the next task or TLX assessment
              this.currentState = "task"; // or "task", depending on your logic
            }

            this._update(); // Refresh to show a new task
            break;
          case "submitFeedback":
            console.log("Feedback submitted", message.feedback);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    TaskPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    let htmlContent = "";
    if (this.currentState === "task" && this.tasksCompleted < this.totalTasks) {
      htmlContent = this._getHtmlForWebview(this._panel.webview) || "";
    } else if (this.currentState === "tlx") {
      htmlContent = this._getTlxHtmlForWebview(this._panel.webview) || "";
    } else if (this.tasksCompleted === this.totalTasks) {
      htmlContent = this._getFeedbackHtmlForWebview(this._panel.webview) || "";
    }

    this._panel.webview.html = htmlContent || "";
  }

  public imageIndex = 0;
  private _getHtmlForWebview(webview: vscode.Webview) {
    startCognitiveLoadEstimation();
    // Determine whether to show a task or the TLX page based on the extension state.

    if (this.currentState === "task") {
      // Task view setup
      const imageNumber = this.imageIndex + 1;
      this.imageIndex = imageNumber;
      const imageUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this._extensionUri,
          "media",
          "taskImages",
          `image${imageNumber}.png`
        )
      );
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
      </style>
  </head>
  
  <body>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12 text-center">
        <p><strong>Timer:</strong> <span id="timer">03:00</span></p>
        <!-- Timer progress bar -->
        <div class="progress">
            <div class="progress-bar timer-bar" role="progressbar" style="width: 100%" id="timerBar"></div>
        </div>
      </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <img src="${imageUri}" class="img-fluid" alt="Task Image" id="taskImage">
            <p>Task description here.</p>
        </div>
        <div class="col-md-6 d-flex flex-column justify-content-between">
            <textarea id="result" class="form-control mb-2" placeholder="Enter your result" style="flex-grow: 1;"></textarea>
            <button id="submit" class="btn btn-primary btn-block">Submit</button>
        </div>
    </div>
  </div>
  <script src="${scriptUri}"></script>
  <script>
    window.onload = function() {
      // Ensure the image is loaded to get its height
      const imageHeight = document.getElementById('taskImage').clientHeight;
      document.getElementById('result').style.height = imageHeight + 'px';
    };
  </script>
</body>


      </html>`;
    } else if (this.currentState === "tlx") {
      // Call a separate function to get the HTML for the TLX page
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
              <input type="range" class="form-control-range" id="mentalDemand">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
            <label for="physicalDemand class="text-center""><strong>Physical Demand:</strong> How physically demanding was the task?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" id="physicalDemand">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
            <label for="temporalDemand class="text-center""><strong>Temporal Demand:</strong> How hurried or rushed was the pace of the task?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" id="temporalDemand">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
            <label for="performance" class="text-center"><strong>Performance:</strong> How successful were you in accomplishing what you were asked to do?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" id="performance">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
            <label for="effort" class="text-center"><strong>Effort:</strong> How hard did you have to work to accomplish your level of performance?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" id="effort">
              <span>Very High</span>
            </div>
          </div>
          <div class="form-group">
            <label for="frustration" class="text-center"><strong>Frustration:</strong> How insecure, discouraged, irritated, stressed, and annoyed versus secure, gratified, content, relaxed, and complacent did you feel during the task?</label>
            <div class="d-flex justify-content-between">
              <span>Very Low</span>
              <input type="range" class="form-control-range" id="frustration">
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
    // Similar setup for scripts and styles as in _getHtmlForWebview
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
