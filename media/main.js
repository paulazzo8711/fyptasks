const vscode = acquireVsCodeApi();
const startTime = 180; // 3 minutes in seconds
let time = startTime; // This will decrease every second
let timerInterval; // Declare interval variable for access in submit event

document.getElementById("submit").addEventListener("click", () => {
  const result = document.getElementById("result").value;
  const imageElement = document.getElementById("taskImage");
  const imageUri = imageElement ? imageElement.src : "";
  const timeTaken = startTime - time; // Calculate time taken

  clearInterval(timerInterval); // Stop the timer

  vscode.postMessage({
    command: "submitTask",
    text: result,
    image: imageUri,
    timeTaken: timeTaken,
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
    timerBar.style.width = `${(time / 180) * 100}%`; // Update progress bar width

    // Change color and show alerts at specific times
    if (time === 30 || time === 20 || time === 10) {
      alert(`Only ${time} seconds left!`);
      timerElement.classList.add("alert-timer");
      timerBar.classList.add("bg-danger"); // Change to red
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
