const vscode = acquireVsCodeApi();
const startTime = 180;
let time = startTime;
let timerInterval;
const previousState = vscode.getState();
let task = previousState ? previousState.task : 0;

document.getElementById("submit").addEventListener("click", () => {
  const result = document.getElementById("result").value;
  const imageElement = document.getElementById("taskImage");
  const imageUri = imageElement ? imageElement.src : "";
  const timeTaken = startTime - time;
  task++;

  vscode.setState({ task: task });
  console.log(task);
  clearInterval(timerInterval);

  vscode.postMessage({
    command: "submitTask",
    text: result,
    image: imageUri,
    timeTaken: timeTaken,
    taskNumber: task,
  });
});

document.addEventListener("DOMContentLoaded", (event) => {
  const timerElement = document.getElementById("timer");
  const timerBar = document.getElementById("timerBar");
  function updateTimer() {
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    timerElement.textContent = `${minutes}:${seconds}`;
    timerBar.style.width = `${(time / 180) * 100}%`;

    if (time === 30 || time === 20 || time === 10) {
      alert(`Only ${time} seconds left!`);
      timerElement.classList.add("alert-timer");
      timerBar.classList.add("bg-danger");
    }

    time--;

    if (time < 0) {
      clearInterval(timerInterval);
    }
  }
  timerInterval = setInterval(() => {
    updateTimer();
  }, 1000);
});
