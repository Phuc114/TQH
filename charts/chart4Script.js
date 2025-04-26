const svg = d3.select("#chart4-svg"),
      margin = {top: 50, right: 30, bottom: 60, left: 60},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("visibility", "hidden");

let activeBar = null;
let showPercent = false;
let rawData = [];
let isFirstRender = true;

document.getElementById("toggleDisplay").addEventListener("change", function () {
  showPercent = this.checked;
  document.getElementById("toggleLabel").innerText = showPercent ? "phần trăm" : "số";
  renderChart();
});

document.querySelectorAll(".filter-status").forEach(cb => {
  cb.addEventListener("change", renderChart);
});

d3.csv("task_4_Summary.csv").then(data => {
  data.forEach(d => {
    d.Count = +d["Count of project_heart_disease (1).csv"];
  });
  rawData = data;
  renderChart();
});

function renderChart() {
  g.selectAll("*").remove();

  const selected = Array.from(document.querySelectorAll(".filter-status:checked")).map(d => d.value);
  const groups = [...new Set(rawData.map(d => d["Exercise Habits"]))];
  const subgroups = ["No", "Yes"];
  const color = d3.scaleOrdinal().domain(["No", "Yes"]).range(["orange", "#1f77b4"]);

  const dataMap = {};
  rawData.forEach(d => {
    if (!dataMap[d["Exercise Habits"]]) dataMap[d["Exercise Habits"]] = {};
    dataMap[d["Exercise Habits"]][d["Heart Disease Status"]] = d.Count;
  });

  const data = groups.map(group => {
    const row = { group };
    subgroups.forEach(sg => row[sg] = dataMap[group]?.[sg] || 0);
    return row;
  });

  const x0 = d3.scaleBand().domain(groups).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(subgroups).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.Yes + d.No)]).nice().range([height, 0]);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  g.append("g").call(d3.axisLeft(y));

  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Thói quen tập thể dục");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Số người");

  const bars = g.append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", d => `translate(${x0(d.group)},0)`)
    .selectAll("rect")
    .data(d => subgroups.map(key => ({ key, value: d[key], total: d.Yes + d.No, group: d.group })))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", height)
    .attr("height", 0)
    .attr("width", x1.bandwidth())
    .attr("fill", d => color(d.key))
    .style("opacity", d => {
      if (activeBar) return (activeBar.group === d.group && activeBar.key === d.key) ? 1 : 0.2;
      if (selected.length === 1) return d.key === selected[0] ? 1 : 0.2;
      return 1;
    })
    .attr("stroke", d => {
      if (activeBar && activeBar.group === d.group && activeBar.key === d.key) return "#000";
      if (selected.length === 1 && d.key === selected[0]) return "#000";
      return "none";
    })
    .on("click", (event, d) => {
      event.stopPropagation();
      activeBar = d;
      renderChart();
    })
    .on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible").html(
        `<strong>Exercise:</strong> ${d.group}<br/>
         <strong>Status:</strong> ${d.key}<br/>
         <strong>Count:</strong> ${d.value}`
      );
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  if (isFirstRender) {
    bars.transition()
      .duration(800)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));
    isFirstRender = false;
  } else {
    bars.attr("y", d => y(d.value)).attr("height", d => height - y(d.value));
  }

  g.selectAll(".bar-label")
    .data(data.flatMap(d => subgroups.map(key => ({ key, value: d[key], group: d.group, total: d.Yes + d.No }))))
    .enter()
    .append("text")
    .attr("x", d => x0(d.group) + x1(d.key) + x1.bandwidth() / 2)
    .attr("y", d => y(d.value) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .text(d => {
      if (selected.length === 1 && d.key !== selected[0]) return "";
      return showPercent ? `${((d.value / d.total) * 100).toFixed(1)}%` : d.value;
    });
}

document.body.addEventListener("click", () => {
  activeBar = null;
  renderChart();
});

document.querySelector(".download-button").addEventListener("click", () => {
  html2canvas(document.getElementById("chart4-wrapper")).then(canvas => {
    const link = document.createElement("a");
    link.download = "task4-chart.png";
    link.href = canvas.toDataURL();
    link.click();
  });
});
