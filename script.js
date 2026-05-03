let chart;

// ✅ PIE COLORS FIX
function generateColors(n) {
  let colors = [];
  for (let i = 0; i < n; i++) {
    colors.push(`hsl(${(i * 360) / n}, 70%, 60%)`);
  }
  return colors;
}

// ✅ SMART LABEL DRAW (IMPROVED)
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

// ---------- FUNCTION HELPER (NEW CORE ADDITION) ----------
function preprocessFunction(expr) {

  return expr
    // modulus |x|
    .replace(/\|x\|/g, "abs(x)")

    // greatest integer [x]
    .replace(/\[x\]/g, "floor(x)")

    // signum
    .replace(/sgn\(/g, "sign(")

    // trig DEGREE SUPPORT
    .replace(/sin\((.*?)\)/g, "sin(($1)*pi/180)")
    .replace(/cos\((.*?)\)/g, "cos(($1)*pi/180)")
    .replace(/tan\((.*?)\)/g, "tan(($1)*pi/180)")

    // inverse trig
    .replace(/asin\((.*?)\)/g, "(asin($1)*180/pi)")
    .replace(/acos\((.*?)\)/g, "(acos($1)*180/pi)")
    .replace(/atan\((.*?)\)/g, "(atan($1)*180/pi)")

    // extra trig
    .replace(/sec\((.*?)\)/g, "(1/cos(($1)*pi/180))")
    .replace(/cosec\((.*?)\)/g, "(1/sin(($1)*pi/180))")
    .replace(/cot\((.*?)\)/g, "(1/tan(($1)*pi/180))")

    // mod function
    .replace(/mod\((.*?),(.*?)\)/g, "($1 % $2)");
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

    expr = preprocessFunction(expr); // 🔥 MAIN UPGRADE

    if (type === "pie") {
      alert("Pie not supported");
      return;
    }

    for (let i = -360; i <= 360; i += 1) { // 🔥 better range for trig
      try {
        let val = math.evaluate(expr, { x: i });

        if (!isFinite(val) || Math.abs(val) > 1e4) {
          x.push(i);
          y1.push(null); // 🔥 break graph (important)
          continue;
        }

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

  // ---------- OTHER CHARTS ----------
  datasets.push({
    label: "Y1",
    data: type === "scatter"
      ? x.map((v, i) => ({ x: v, y: y1[i] }))
      : y1,
    borderColor: document.getElementById("color1").value,
    backgroundColor: document.getElementById("color1").value,
    spanGaps: false // 🔥 important for tan/sec
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
        x: {
          display: true,
          title: { display: true, text: "X Axis (Degree)" }
        },
        y: {
          display: true,
          title: { display: true, text: "Y Axis" }
        }
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

// ---------- ANALYSIS ----------
function analyze(y) {
  if (!y.length) return;

  let clean = y.filter(v => v !== null);

  let max = Math.max(...clean);
  let min = Math.min(...clean);
  let avg = (clean.reduce((a, b) => a + b, 0) / clean.length).toFixed(2);

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
