let chart;

// ---------- MODE SWITCH ----------
document.getElementById("mode").onchange = function () {
  let m = this.value;

  document.getElementById("dataBox").style.display = m === "data" ? "block" : "none";
  document.getElementById("funcBox").style.display = m === "function" ? "block" : "none";

  // ✅ FIX: Function mode → hide Y2 color
  document.getElementById("color2Box").style.display = m === "function" ? "none" : "block";
};

// ---------- CSV LOADER ----------
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

// ---------- MAIN PLOT ----------
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
      .replace(/sinx/g, "sin(x)")
      .replace(/cosx/g, "cos(x)")
      .replace(/tanx/g, "tan(x)");

    if (type === "pie") {
      alert("Pie chart not supported in Function Mode");
      return;
    }

    for (let i = -50; i <= 50; i++) { // 🔥 wider range
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

  let colors = [
    "#ff6384", "#36a2eb", "#ffce56",
    "#4caf50", "#9c27b0", "#ff9800",
    "#00bcd4", "#8bc34a"
  ];

  // ---------- DATASET 1 ----------
  datasets.push({
    label: "Y1",
    data: type === "scatter"
      ? x.map((v, i) => ({ x: v, y: y1[i] }))
      : y1,
    borderColor: document.getElementById("color1").value,
    backgroundColor: type === "pie" ? colors : document.getElementById("color1").value,
    borderWidth: 2,
    tension: 0 // straight line
  });

  // ---------- DATASET 2 ----------
  if (mode === "data" && y2.length === y1.length && y2.some(v => !isNaN(v))) {
    datasets.push({
      label: "Y2",
      data: type === "scatter"
        ? x.map((v, i) => ({ x: v, y: y2[i] }))
        : y2,
      borderColor: document.getElementById("color2").value,
      backgroundColor: type === "pie" ? colors : document.getElementById("color2").value,
      borderWidth: 2,
      tension: 0
    });
  }

  // ---------- CREATE CHART ----------
  chart = new Chart(document.getElementById("chart"), {
    type: type,
    data: {
      labels: type === "scatter" ? undefined : x,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {

        title: {
          display: graphTitle !== "",
          text: graphTitle,
          font: { size: 18 }
        },

        legend: {
          display: true,
          position: "top"
        },

        tooltip: {
          callbacks: {
            label: function (context) {
              return context.dataset.label + " → " + context.label + " : " + context.raw;
            }
          }
        },

        zoom: type === "pie" ? {} : {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'xy'
          },
          pan: {
            enabled: true,
            mode: 'xy'
          }
        }
      },

      // 🔥 GRID + AXIS LABELS (NEW FEATURE)
      scales: type === "pie" ? {} : {
        x: {
          title: {
            display: true,
            text: "X Axis"
          },
          grid: {
            display: true
          }
        },
        y: {
          title: {
            display: true,
            text: "Y Axis"
          },
          grid: {
            display: true
          }
        }
      }
    }
  });

  analyze(y1);
}

// ---------- ANALYSIS ----------
function analyze(y) {
  if (y.length === 0) return;

  let max = Math.max(...y);
  let min = Math.min(...y);
  let avg = (y.reduce((a, b) => a + b, 0) / y.length).toFixed(2);

  let trend = y[y.length - 1] > y[0] ? "Increasing" : "Decreasing";

  document.getElementById("insight").innerHTML =
    `Max: ${max}<br>Min: ${min}<br>Avg: ${avg}<br>Trend: ${trend}`;
}

// ---------- DOWNLOAD ----------
function download() {
  let link = document.createElement("a");
  link.download = "graph.png";
  link.href = document.getElementById("chart").toDataURL();
  link.click();
}