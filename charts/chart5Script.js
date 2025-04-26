const margin = { top: 60, right: 20, bottom: 80, left: 100 },
  width = 700 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart5-container")
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

d3.csv("task_5_Summary.csv").then(data => {
  data.forEach(d => {
    d.Count = +d["Count of project_heart_disease (1).csv"];
    d["Cholesterol Bin"] = d["Cholesterol Bin"].trim();
    d["Heart Disease Status"] = d["Heart Disease Status"].trim();
  });

  const cholesterolOrder = ["150-199", "200-239", "240-279", "≥280"];
  const statusOrder = ["Yes", "No"];
  const maxCount = d3.max(data, d => d.Count);
  const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxCount]);

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

  d3.select("#displayMode").on("change", function () {
    displayMode = this.value;
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

  function renderLegend() {
    d3.select("#color-legend").html("");

    const legendSvg = d3.select("#color-legend")
      .append("svg")
      .attr("width", 220)
      .attr("height", 45);

    const defs = legendSvg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
      .data([
        { offset: "0%", color: color(0) },
        { offset: "100%", color: color(maxCount) }
      ])
      .enter()
      .append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    legendSvg.append("text")
      .attr("x", 110)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .text("Số lượng người");

    legendSvg.append("rect")
      .attr("x", 10)
      .attr("y", 16)
      .attr("width", 200)
      .attr("height", 10)
      .style("fill", "url(#legend-gradient)");

    legendSvg.append("text")
      .attr("x", 10)
      .attr("y", 40)
      .style("font-size", "12px")
      .text("271");

    legendSvg.append("text")
      .attr("x", 210)
      .attr("y", 40)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .text("2637");
  }

  function renderChart() {
    svg.selectAll("*").remove();

    const fullData = [...data];

    let cholesterolOrderSorted = cholesterolOrder.slice();
    if (selectedFilter && (currentSort === "asc" || currentSort === "desc")) {
      cholesterolOrderSorted.sort((a, b) => {
        const sumA = d3.sum(fullData.filter(d => d["Cholesterol Bin"] === a && d["Heart Disease Status"] === selectedFilter), d => d.Count);
        const sumB = d3.sum(fullData.filter(d => d["Cholesterol Bin"] === b && d["Heart Disease Status"] === selectedFilter), d => d.Count);
        return currentSort === "asc" ? sumA - sumB : sumB - sumA;
      });
    }

    const x = d3.scaleBand().domain(cholesterolOrderSorted).range([0, width]).padding(0.05);
    const y = d3.scaleBand().domain(statusOrder).range([0, height]).padding(0.05);

    svg.append("g").call(d3.axisLeft(y));
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .text("Khoảng Cholesterol");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .text("Tình trạng bệnh tim");

    const cells = svg.selectAll("rect.cell")
      .data(fullData)
      .join("rect")
      .attr("class", "cell")
      .attr("x", d => x(d["Cholesterol Bin"]))
      .attr("y", d => y(d["Heart Disease Status"]))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => color(d.Count))
      .style("stroke", d => `${d["Cholesterol Bin"]}_${d["Heart Disease Status"]}` === activeCell ? "#000" : "#fff")
      .style("stroke-width", d => `${d["Cholesterol Bin"]}_${d["Heart Disease Status"]}` === activeCell ? 2 : 1)
      .style("opacity", d => {
        const id = `${d["Cholesterol Bin"]}_${d["Heart Disease Status"]}`;
        if (activeCell) return id === activeCell ? 1 : 0.2;
        if (selectedFilter) return d["Heart Disease Status"] === selectedFilter ? 1 : 0.2;
        return 1;
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        activeCell = `${d["Cholesterol Bin"]}_${d["Heart Disease Status"]}`;
        renderChart();
      })
      .on("mouseover", (event, d) => {
        const totalRow = d3.sum(data.filter(item => item["Heart Disease Status"] === d["Heart Disease Status"]), item => item.Count);
        tooltip.style("visibility", "visible").html(`
          <strong>Cholesterol:</strong> ${d["Cholesterol Bin"]}<br/>
          <strong>Tình trạng:</strong> ${d["Heart Disease Status"] === "Yes" ? "Có bệnh tim" : "Không có bệnh tim"}<br/>
          <strong>Số lượng:</strong> ${formatNumber(d.Count)}<br/>
          <strong>Tỷ lệ trong nhóm:</strong> ${formatPercent(d.Count, totalRow)}
        `);
      })
      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 20) + "px").style("left", (event.pageX + 20) + "px");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

    if (firstRender) {
      cells.style("opacity", 0)
        .transition()
        .duration(800)
        .style("opacity", d => {
          const id = `${d["Cholesterol Bin"]}_${d["Heart Disease Status"]}`;
          if (activeCell) return id === activeCell ? 1 : 0.2;
          if (selectedFilter) return d["Heart Disease Status"] === selectedFilter ? 1 : 0.2;
          return 1;
        });
    }

    svg.selectAll("text.count-label")
      .data(fullData)
      .join("text")
      .attr("class", "count-label")
      .attr("x", d => x(d["Cholesterol Bin"]) + x.bandwidth() / 2)
      .attr("y", d => y(d["Heart Disease Status"]) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", "#000")
      .style("font-weight", "600")
      .style("opacity", d => {
        const id = `${d["Cholesterol Bin"]}_${d["Heart Disease Status"]}`;
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

    renderLegend();
    firstRender = false;
  }

  document.getElementById("downloadBtn").addEventListener("click", () => {
    html2canvas(document.getElementById("export-area")).then(canvas => {
      const link = document.createElement("a");
      link.download = "task5-chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });

  document.getElementById("toggleDisplay").addEventListener("change", function () {
    displayMode = this.checked ? "percent" : "count";
    document.getElementById("toggleLabel").innerText = displayMode === "count" ? "số" : "phần trăm";
    renderChart();
  });
});
