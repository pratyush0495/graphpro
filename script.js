let chart;

// mode switch
document.getElementById("mode").onchange = function () {
  let m = this.value;
  document.getElementById("dataBox").style.display = m === "data" ? "block" : "none";
  document.getElementById("funcBox").style.display = m === "function" ? "block" : "none";
};

// CSV loader
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

    document.getElementById("xValues").value = x;
    document.getElementById("yValues").value = y;
  };

  reader.readAsText(file);
});

function plot() {

  let mode = document.getElementById("mode").value;
  let type = document.getElementById("type").value;

  let x = [], y1 = [], y2 = [];

  if (mode === "data") {

    x = document.getElementById("xValues").value.split(",").map(Number);
    y1 = document.getElementById("yValues").value.split(",").map(Number);
    y2 = document.getElementById("y2Values").value.split(",").map(Number);

  } else {

    let expr = document.getElementById("func").value;

    for (let i = -10; i <= 10; i++) {
      let val = math.evaluate(expr, { x: i });
      x.push(i);
      y1.push(val);
    }
  }

  if (chart) chart.destroy();

  let datasets = [];

  datasets.push({
    label: "Dataset 1",
    data: type === "scatter"
      ? x.map((v, i) => ({ x: v, y: y1[i] }))
      : y1,
    borderColor: document.getElementById("color1").value,
    borderWidth: 2
  });

  if (y2.length > 0 && !isNaN(y2[0])) {
    datasets.push({
      label: "Dataset 2",
      data: type === "scatter"
        ? x.map((v, i) => ({ x: v, y: y2[i] }))
        : y2,
      borderColor: document.getElementById("color2").value,
      borderWidth: 2
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
      plugins: {
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
      },
      scales: type === "scatter" ? {
        x: { type: "linear" }
      } : {}
    }
  });

  analyze(y1);
}

function analyze(y) {
  let max = Math.max(...y);
  let min = Math.min(...y);
  let avg = (y.reduce((a, b) => a + b, 0) / y.length).toFixed(2);

  let trend = y[y.length - 1] > y[0] ? "Increasing" : "Decreasing";

  document.getElementById("insight").innerHTML =
    `Max: ${max}<br>Min: ${min}<br>Avg: ${avg}<br>Trend: ${trend}`;
}

function download() {
  let link = document.createElement("a");
  link.download = "graph.png";
  link.href = document.getElementById("chart").toDataURL();
  link.click();
}