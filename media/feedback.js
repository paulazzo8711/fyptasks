const vscode = acquireVsCodeApi();
document.getElementById("submitFeedback").addEventListener("click", () => {
  const result = document.getElementById("feedback").value;

  vscode.postMessage({
    command: "submitFeedback",
    text: result,
  });
});
