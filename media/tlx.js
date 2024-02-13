const vscode = acquireVsCodeApi();
console.log("TLX script loaded");

document.getElementById("tlxForm").addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent the default form submission via HTTP

  // Collect TLX scores
  const mentalDemand = parseInt(
    document.getElementById("mentalDemand").value,
    10
  );
  const physicalDemand = parseInt(
    document.getElementById("physicalDemand").value,
    10
  );
  const temporalDemand = parseInt(
    document.getElementById("temporalDemand").value,
    10
  );
  const performance = parseInt(
    document.getElementById("performance").value,
    10
  );
  const effort = parseInt(document.getElementById("effort").value, 10);
  const frustration = parseInt(
    document.getElementById("frustration").value,
    10
  );

  // Calculate mean of the scores
  const scoresArray = [
    mentalDemand,
    physicalDemand,
    temporalDemand,
    performance,
    effort,
    frustration,
  ];
  const sum = scoresArray.reduce((a, b) => a + b, 0);
  const mean = sum / scoresArray.length;

  // Post message back to the extension with the collected scores and their mean
  vscode.postMessage({
    command: "submitTLX",
    scores: {
      mentalDemand,
      physicalDemand,
      temporalDemand,
      performance,
      effort,
      frustration,
      mean,
    },
  });
});
