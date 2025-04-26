const margin = { top: 60, right: 20, bottom: 80, left: 100 },
  width = 700 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart6-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom + 60)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("visibility", "hidden");

let activeCell = null;
let currentSort = "default";
let selectedFilter = null;
let displayMode = "count";
let firstRender = true;

function formatNumber(value) {
  return value.toLocaleString("vi-VN");
}

function formatPercent(value, total) {
  return total === 0 ? "0%" : ((value / total) * 100).toFixed(1) + "%";
}

d3.csv("task_6_Summary.csv").then(data => {
  data.forEach(d => {
    d.Count = +d["Count of project_heart_disease (1).csv"];
    d["BMI Bin"] = d["BMI Bin"].trim();
    d["Heart Disease Status"] = d["Heart Disease Status"].trim();
  });

  const bmiOrder = ["<18.5", "18.5-24.9", "25-29.9", ">=30"];
  const statusOrder = ["Yes", "No"];
  const maxCount = d3.max(data, d => d.Count);
  const color = d3.scaleLinear()
    .domain([0, maxCount])
    .range(["#deebf7", "#08306b"]);

  renderChart();

  d3.selectAll("input[name='filter']").on("change", function () {
    selectedFilter = this.value;
    d3.select("#sort-controls").classed("hidden", false);
    renderChart();
  });

  d3.select("#sortAsc").on("click", () => {
    currentSort = "asc";
    renderChart();
  });

  d3.select("#sortDesc").on("click", () => {
    currentSort = "desc";
    renderChart();
  });

  d3.select("#toggleDisplay").on("change", function () {
    displayMode = this.checked ? "percent" : "count";
    document.getElementById("toggleLabel").innerText = displayMode === "count" ? "số" : "phần trăm";
    renderChart();
  });

  document.body.addEventListener("click", e => {
    if (!e.target.closest(".control-section") && !e.target.closest("svg")) {
      selectedFilter = null;
      d3.select("#sort-controls").classed("hidden", true);
      document.querySelectorAll("input[name='filter']").forEach(r => r.checked = false);
      activeCell = null;
      renderChart();
    }
  });

  function renderChart() {
    svg.selectAll("*").remove();

    const fullData = [...data];

    let bmiOrderSorted = bmiOrder.slice();

    if (selectedFilter && (currentSort === "asc" || currentSort === "desc")) {
      bmiOrderSorted.sort((a, b) => {
        const sumA = d3.sum(fullData.filter(d => d["BMI Bin"] === a && d["Heart Disease Status"] === selectedFilter), d => d.Count);
        const sumB = d3.sum(fullData.filter(d => d["BMI Bin"] === b && d["Heart Disease Status"] === selectedFilter), d => d.Count);
        return currentSort === "asc" ? sumA - sumB : sumB - sumA;
      });
    }

    const x = d3.scaleBand()
      .domain(bmiOrderSorted)
      .range([0, width])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(statusOrder)
      .range([0, height])
      .padding(0.05);

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .text("Khoảng BMI");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -70)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .text("Tình trạng bệnh tim");

    svg.selectAll("rect.cell")
      .data(fullData)
      .join("rect")
      .attr("class", "cell")
      .attr("x", d => x(d["BMI Bin"]))
      .attr("y", d => y(d["Heart Disease Status"]))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => color(d.Count))
      .style("stroke", "#fff")
      .style("opacity", d => {
        const id = `${d["BMI Bin"]}_${d["Heart Disease Status"]}`;
        if (activeCell) return id === activeCell ? 1 : 0.2;
        if (selectedFilter) return d["Heart Disease Status"] === selectedFilter ? 1 : 0.2;
        return 1;
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        activeCell = `${d["BMI Bin"]}_${d["Heart Disease Status"]}`;
        renderChart();
      })
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible").html(`
          <strong>BMI Bin:</strong> ${d["BMI Bin"]}<br/>
          <strong>Tình trạng:</strong> ${d["Heart Disease Status"] === "Yes" ? "Có bệnh tim" : "Không có bệnh tim"}<br/>
          <strong>Số lượng:</strong> ${formatNumber(d.Count)}
        `);
      })
      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 20) + "px").style("left", (event.pageX + 20) + "px");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    svg.selectAll("text.count-label")
      .data(fullData)
      .join("text")
      .attr("class", "count-label")
      .attr("x", d => x(d["BMI Bin"]) + x.bandwidth() / 2)
      .attr("y", d => y(d["Heart Disease Status"]) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", "#000")
      .style("font-weight", "600")
      .style("opacity", d => {
        const id = `${d["BMI Bin"]}_${d["Heart Disease Status"]}`;
        if (activeCell) return id === activeCell ? 1 : 0.2;
        if (selectedFilter) return d["Heart Disease Status"] === selectedFilter ? 1 : 0.2;
        return 1;
      })
      .text(d => {
        if (displayMode === "count") {
          return formatNumber(d.Count);
        } else {
          const total = d3.sum(data.filter(item => item["Heart Disease Status"] === d["Heart Disease Status"]), item => item.Count);
          return formatPercent(d.Count, total);
        }
      });
  }

  document.getElementById("downloadBtn").addEventListener("click", () => {
    html2canvas(document.getElementById("export-area")).then(canvas => {
      const link = document.createElement("a");
      link.download = "task6-chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });
});
