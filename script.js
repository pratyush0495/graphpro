let chart;

// ---------- STEP DATA GENERATOR ----------
function makeStepData(x, y) {
  let step = [];

  for (let i = 0; i < x.length - 1; i++) {
    step.push({ x: x[i], y: y[i] });
    step.push({ x: x[i + 1], y: y[i] });

    step.push({ x: x[i + 1], y: y[i] });
    step.push({ x: x[i + 1], y: y[i + 1] });
  }

  return step;
}

// ---------- OPEN / CLOSED DOTS ----------
function makeDots(x, y, color) {
  let openDots = [];
  let closedDots = [];

  for (let i = 0; i < x.length - 1; i++) {
    // closed dot
    closedDots.push({
      x: x[i],
      y: y[i]
    });

    // open dot
    openDots.push({
      x: x[i + 1],
      y: y[i]
    });
  }

  return {
    open: {
      type: "scatter",
      data: openDots,
      borderColor: color,
      backgroundColor: "white",
      pointBorderColor: color,
      pointRadius: 4,
      pointStyle: "circle"
    },
    closed: {
      type: "scatter",
      data: closedDots,
      backgroundColor: color,
      pointRadius: 4
    }
  };
}

// ---------- MODE SWITCH ----------
document.getElementById("mode").onchange = function () {
  let m = this.value;

  document.getElementById("dataBox").style.display = m === "data" ? "block" : "none";
  document.getElementById("funcBox").style.display = m === "function" ? "block" : "none";

  let color2Box = document.getElementById("color2Box");
  if (color2Box) color2Box.style.display = m === "function" ? "none" : "block";

  document.getElementById("color1").title = "Color for Y1";
  document.getElementById("color2").title = "Color for Y2";
};

// ---------- MAIN ----------
function plot() {

  let mode = document.getElementById("mode").value;
  let type = document.getElementById("type").value;
  let graphTitle = document.getElementById("title").value;

  let x = [], y1 = [], y2 = [];

  // ---------- DATA MODE ----------
  if (mode === "data") {
    x = document.getElementById("xValues").value.split(",").map(Number).filter(n => !isNaN(n));
    y1 = document.getElementById("yValues").value.split(",").map(Number).filter(n => !isNaN(n));
    y2 = document.getElementById("y2Values").value.split(",").map(Number).filter(n => !isNaN(n));
  }

  // ---------- FUNCTION MODE ----------
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
      alert("Pie not supported in Function Mode");
      return;
    }

    for (let i = -20; i <= 20; i += 1) { // 🔥 step-friendly sampling
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

  let isStep = mode === "function" && /floor|sign|abs/.test(document.getElementById("func").value);
  let color = document.getElementById("color1").value;

  // ---------- STEP FUNCTION ----------
  if (isStep) {

    datasets.push({
      label: "Y1",
      type: "scatter",
      data: makeStepData(x, y1),
      borderColor: color,
      showLine: true,
      fill: false,
      tension: 0
    });

    let dots = makeDots(x, y1, color);
    datasets.push(dots.closed);
    datasets.push(dots.open);
  }

  // ---------- NORMAL FUNCTION ----------
  else {

    datasets.push({
      label: "Y1",
      data: type === "scatter"
        ? x.map((v, i) => ({ x: v, y: y1[i] }))
        : y1,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      tension: mode === "function" ? 0.4 : 0
    });
  }

  // ---------- DATASET 2 ----------
  if (mode === "data" && y2.length === y1.length && y2.some(v => !isNaN(v))) {
    datasets.push({
      label: "Y2",
      data: x.map((v, i) => ({ x: v, y: y2[i] })),
      borderColor: document.getElementById("color2").value,
      borderWidth: 2,
      tension: 0
    });
  }

  // ---------- CHART ----------
  chart = new Chart(document.getElementById("chart"), {
    type: isStep ? "scatter" : type,
    data: {
      labels: isStep ? undefined : x,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        title: {
          display: graphTitle !== "",
          text: graphTitle
        },
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ctx.dataset.label + " = " + ctx.raw;
            }
          }
        }
      },

      scales: type === "pie" ? {} : {
        x: { type: "linear", title: { display: true, text: "X" } },
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