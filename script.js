let chart;

// ---------- MODE SWITCH ----------
document.getElementById("mode").onchange = function () {
  let m = this.value;

  document.getElementById("dataBox").style.display = m === "data" ? "block" : "none";
  document.getElementById("funcBox").style.display = m === "function" ? "block" : "none";

  document.getElementById("color2Box").style.display = m === "function" ? "none" : "block";

  document.getElementById("color1Label").innerText = "Y1 Color";
  document.getElementById("color2Label").innerText = "Y2 Color";
};

// ✅ AUTO HIDE Y2 WHEN EMPTY
document.getElementById("y2Values").addEventListener("input", function () {
  let val = this.value.trim();

  if (val === "") {
    document.getElementById("color2Box").style.display = "none";
  } else {
    if (document.getElementById("mode").value === "data") {
      document.getElementById("color2Box").style.display = "block";
    }
  }
});

// ---------- CSV ----------
document.getElementById("file").addEventListener("change", function () {
  let file = this.files[0];
  let reader = new FileReader();

  reader.onload = function (e) {
    let rows = e.target.result.split("\n");
    let x = [], y = [];

    rows.forEach(r => {
      let c = r.split(",");
      if (c.length >= 2) {
        x.push(Number(c[0]));
        y.push(Number(c[1]));
      }
    });

    document.getElementById("xValues").value = x.join(",");
    document.getElementById("yValues").value = y.join(",");
  };

  reader.readAsText(file);
});

// ---------- STEP FUNCTION ----------
function buildStepData(x, y) {
  let stepPoints = [];

  for (let i = 0; i < x.length - 1; i++) {
    stepPoints.push({ x: x[i], y: y[i] });
    stepPoints.push({ x: x[i + 1], y: y[i] });
  }

  stepPoints.push({ x: x[x.length - 1], y: y[y.length - 1] });

  return stepPoints;
}

// ---------- MAIN ----------
function plot() {

  let mode = document.getElementById("mode").value;
  let type = document.getElementById("type").value;
  let graphTitle = document.getElementById("title").value;

  let x = [], y1 = [], y2 = [];

  if (mode === "data") {
    x = document.getElementById("xValues").value.split(",").map(Number).filter(n => !isNaN(n));
    y1 = document.getElementById("yValues").value.split(",").map(Number).filter(n => !isNaN(n));
    y2 = document.getElementById("y2Values").value.split(",").map(Number).filter(n => !isNaN(n));
  }

  else {
    let expr = document.getElementById("func").value;

    expr = expr
      .replace(/\|x\|/g, "abs(x)")
      .replace(/\[x\]/g, "floor(x)")
      .replace(/sgn\(x\)/g, "sign(x)")
      .replace(/sinx/g, "sin(x)")
      .replace(/cosx/g, "cos(x)")
      .replace(/tanx/g, "tan(x)");

    if (type === "pie") {
      alert("Pie not supported");
      return;
    }

    for (let i = -20; i <= 20; i += 0.1) {
      try {
        let val = math.evaluate(expr, { x: i });
        if (!isFinite(val)) continue;

        x.push(i);
        y1.push(val);

      } catch {
        alert("Invalid function");
        return;
      }
    }
  }

  if (chart) chart.destroy();

  let datasets = [];

  let isStep = document.getElementById("func").value.includes("[x]") || 
               document.getElementById("func").value.includes("floor");

  if (type === "line" && isStep) {

    let stepData = buildStepData(x, y1);

    datasets.push({
      label: "Y1",
      data: stepData,
      parsing: false,
      borderColor: document.getElementById("color1").value,
      borderWidth: 2,
      stepped: true,
      pointRadius: 0
    });

  } else {

    datasets.push({
      label: "Y1",
      data: type === "scatter"
        ? x.map((v, i) => ({ x: v, y: y1[i] }))
        : y1,
      borderColor: document.getElementById("color1").value,
      backgroundColor: document.getElementById("color1").value,
      borderWidth: 2,
      tension: mode === "function" ? 0.4 : 0
    });
  }

  if (mode === "data" && y2.length === y1.length && y2.some(v => !isNaN(v))) {
    datasets.push({
      label: "Y2",
      data: type === "scatter"
        ? x.map((v, i) => ({ x: v, y: y2[i] }))
        : y2,
      borderColor: document.getElementById("color2").value,
      backgroundColor: document.getElementById("color2").value,
      borderWidth: 2,
      tension: 0
    });
  }

  chart = new Chart(document.getElementById("chart"), {
    type: type,
    data: {
      labels: type === "scatter" ? undefined : x,
      datasets: datasets
    },
    options: {
      plugins: {
        title: {
          display: graphTitle !== "",
          text: graphTitle
        }
      },
      scales: type === "pie" ? {} : {
        x: { title: { display: true, text: "X" } },
        y: { title: { display: true, text: "Y" } }
      }
    }
  });

  analyze(y1);
}

// ---------- ANALYSIS ----------
function analyze(y) {
  if (!y.length) return;

  let max = Math.max(...y);
  let min = Math.min(...y);
  let avg = (y.reduce((a, b) => a + b, 0) / y.length).toFixed(2);

  document.getElementById("insight").innerHTML =
    `Max: ${max}<br>Min: ${min}<br>Avg: ${avg}`;
}

// ---------- DOWNLOAD ----------
function download() {
  let link = document.createElement("a");
  link.download = "graph.png";
  link.href = document.getElementById("chart").toDataURL();
  link.click();
}