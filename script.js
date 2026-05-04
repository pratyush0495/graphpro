let chart;

// ✅ PIE COLORS FIX
function generateColors(n) {
  let colors = [];
  for (let i = 0; i < n; i++) {
    colors.push(`hsl(${(i * 360) / n}, 70%, 60%)`);
  }
  return colors;
}

// ✅ SMART LABEL DRAW
const pieLabelPlugin = {
  id: "pieLabelPlugin",
  afterDatasetsDraw(chart) {
    if (chart.config.type !== "pie") return;

    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);

    ctx.save();
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000";

    meta.data.forEach((arc, i) => {
      let value = chart.data.datasets[0].data[i];
      if (value === 0 || isNaN(value)) return;

      let angle = (arc.startAngle + arc.endAngle) / 2;
      let radius = arc.outerRadius;

      let isBigSlice = arc.circumference > 0.4;
      let distance = isBigSlice ? radius * 0.6 : radius * 1.15;

      let x = arc.x + Math.cos(angle) * distance;
      let y = arc.y + Math.sin(angle) * distance;

      ctx.fillText(value, x, y);
    });

    ctx.restore();
  }
};

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

  // ✅ DATA MODE (UNCHANGED — EXACT SAME)
  if (mode === "data") {
    x = document.getElementById("xValues").value.split(",").map(Number).filter(n => !isNaN(n));
    y1 = document.getElementById("yValues").value.split(",").map(Number).filter(n => !isNaN(n));
    y2 = document.getElementById("y2Values").value.split(",").map(Number).filter(n => !isNaN(n));
  }

  // ✅ FUNCTION MODE (ONLY THIS PART UPGRADED)
  else {
    let expr = document.getElementById("func").value;

    // 🔥 ADD CUSTOM FUNCTIONS
    const scope = {
      sin: x => Math.sin(x),
      cos: x => Math.cos(x),
      tan: x => Math.tan(x),

      sec: x => 1 / Math.cos(x),
      cosec: x => 1 / Math.sin(x),
      cot: x => 1 / Math.tan(x),

      asin: x => Math.asin(x),
      acos: x => Math.acos(x),
      atan: x => Math.atan(x),

      abs: x => Math.abs(x),
      floor: x => Math.floor(x),

      sgn: x => (x > 0 ? 1 : x < 0 ? -1 : 0)
    };

    // 🔥 SYMBOL SUPPORT
    expr = expr
      .replace(/\|x\|/g, "abs(x)")
      .replace(/⌊x⌋/g, "floor(x)");

    if (type === "pie") {
      alert("Pie not supported");
      return;
    }

    for (let i = -20; i <= 20; i += 0.1) {
      try {
        let val = math.evaluate(expr, { x: i, ...scope });

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

  // ================= PIE (UNCHANGED) =================
  if (type === "pie") {

    let container = document.getElementById("chart").parentNode;

    container.innerHTML = "";

    let chartCount = 0;
    if (y1.length) chartCount++;
    if (y2.length && y2.some(v => !isNaN(v))) chartCount++;

    container.style.display = "grid";
    container.style.justifyContent = "center";
    container.style.gap = "20px";

    if (chartCount === 1) {
      container.style.gridTemplateColumns = "300px";
    } else {
      container.style.gridTemplateColumns = "repeat(2, 300px)";
    }

    function createPie(data, labelText) {

      let cleanData = data.filter(v => !isNaN(v) && v !== 0);
      if (!cleanData.length) return;

      let wrapper = document.createElement("div");
      wrapper.style.width = "300px";
      wrapper.style.height = "300px";

      let canvas = document.createElement("canvas");
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);

      new Chart(canvas, {
        type: "pie",
        data: {
          labels: x.length === data.length ? x : cleanData.map((_, i) => `Item ${i + 1}`),
          datasets: [{
            data: cleanData,
            backgroundColor: generateColors(cleanData.length)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: graphTitle + " (" + labelText + ")"
            },
            legend: { position: "bottom" }
          }
        },
        plugins: [pieLabelPlugin]
      });
    }

    if (y1.length) createPie(y1, "Y1");

    if (y2.length && y2.some(v => !isNaN(v))) {
      createPie(y2, "Y2");
    }

    analyze(y1);
    return;
  }

  // ---------- OTHER CHARTS (UNCHANGED) ----------
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

        scales: {
          x: { display: true, title: { display: true, text: "X Axis" } },
          y: { display: true, title: { display: true, text: "Y Axis" } }
        },

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
  link.href = document.querySelector("canvas").toDataURL();
  link.click();
}
