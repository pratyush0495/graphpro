let chart;

// ✅ PIE COLORS FIX
function generateColors(n) {
  let colors = [];
  for (let i = 0; i < n; i++) {
    colors.push(`hsl(${(i * 360) / n}, 70%, 60%)`);
  }
  return colors;
}

// ---------- MODE SWITCH ----------
document.getElementById("mode").onchange = function () {
  let m = this.value;

  document.getElementById("dataBox").style.display = m === "data" ? "block" : "none";
  document.getElementById("funcBox").style.display = m === "function" ? "block" : "none";

  document.getElementById("color2Box").style.display = m === "function" ? "none" : "block";
};

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
      .replace(/\[x\]/g, "floor(x)");

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

  // ✅ PIE FIX (MULTI VALUES + LABELS)
  if (type === "pie") {

    // 🔥 FIX 1: Ensure all slices visible
    let labels = x.length === y1.length ? x : y1.map((_, i) => `Value ${i+1}`);

    datasets = [{
      data: y1,
      backgroundColor: generateColors(y1.length)
    }];

    chart = new Chart(document.getElementById("chart"), {
      type: "pie",
      data: {
        labels: labels,
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

          legend: {
            position: "bottom"
          },

          // 🔥 FIX 2: SHOW VALUES ON SLICES (INSIDE/OUTSIDE)
          tooltip: {
            enabled: true
          }
        }
      },

      // 🔥 CUSTOM DRAW LABELS
      plugins: [{
        id: "sliceLabels",
        afterDraw(chart) {
          const { ctx } = chart;
          const meta = chart.getDatasetMeta(0);

          ctx.save();
          ctx.font = "12px Arial";
          ctx.fillStyle = "#000";
          ctx.textAlign = "center";

          meta.data.forEach((slice, i) => {
            let val = chart.data.datasets[0].data[i];

            let pos = slice.tooltipPosition();

            ctx.fillText(val, pos.x, pos.y);
          });

          ctx.restore();
        }
      }]
    });

    analyze(y1);
    return;
  }

  // ---------- OTHER CHARTS ----------
  else {

    datasets.push({
      label: "Y1",
      data: type === "scatter"
        ? x.map((v, i) => ({ x: v, y: y1[i] }))
        : y1,
      borderColor: document.getElementById("color1").value,
      backgroundColor: document.getElementById("color1").value
    });

    if (mode === "data" && y2.length === y1.length && y2.some(v => !isNaN(v))) {
      datasets.push({
        label: "Y2",
        data: type === "scatter"
          ? x.map((v, i) => ({ x: v, y: y2[i] }))
          : y2,
        borderColor: document.getElementById("color2").value,
        backgroundColor: document.getElementById("color2").value
      });
    }

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
            text: graphTitle
          },

          zoom: {
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
        }
      }
    });

    analyze(y1);
  }
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
