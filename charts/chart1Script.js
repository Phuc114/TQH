const svg = d3.select("svg"),
      margin = {top: 50, right: 150, bottom: 60, left: 80},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
let originalData;
let isFirstRender = true;

d3.csv("task_1_Summary.csv").then(data => {
  data.forEach(d => d.Count = +d["Count of Heart Disease Status"]);
  originalData = data;
  updateChart(data);
});

function updateChart(data) {
  g.selectAll("*").remove();

  let ageGroups = ["16-20", "20-30", "30-40", "40-60", ">60"];
  const sortOption = document.getElementById("sort")?.value;
  if (sortOption === "asc" || sortOption === "desc") {
    const totalByGroup = d3.rollups(data, v => d3.sum(v, d => d.Count), d => d["age group"]);
    totalByGroup.sort((a, b) => sortOption === "asc" ? a[1] - b[1] : b[1] - a[1]);
    ageGroups = totalByGroup.map(d => d[0]);
  }

  const x = d3.scalePoint().domain(ageGroups).range([0, width]).padding(0.5);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.Count)]).nice().range([height, 0]);
  const color = d3.scaleOrdinal().domain(["No", "Yes"]).range(["orange", "#1f77b4"]);
  const line = d3.line().x(d => x(d["age group"])).y(d => y(d.Count));
  const nested = d3.group(data, d => d["Heart Disease Status"]);

  for (const [status, values] of nested) {
    const path = g.append("path")
      .datum(values)
      .attr("class", `line ${status.toLowerCase()}`)
      .attr("fill", "none")
      .attr("stroke", color(status))
      .attr("stroke-width", 3)
      .attr("d", line);

    if (isFirstRender) {
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }

    g.selectAll(`.dot-${status}`)
      .data(values)
      .enter()
      .append("circle")
      .attr("class", d => `dot dot-${status} highlight-${d["age group"].replace(">", "over")}`)
      .attr("cx", d => x(d["age group"]))
      .attr("cy", d => y(d.Count))
      .attr("r", 5)
      .attr("fill", color(status))
      .on("mouseover", function (event, d) {
        const groupClass = d["age group"].replace(">", "over");
        tooltip.style("visibility", "visible")
          .html(`<strong>Age group:</strong> ${d["age group"]}<br/>
                 <strong>Heart Disease Status:</strong> ${d["Heart Disease Status"]}<br/>
                 <strong>Count:</strong> ${d.Count}`);
        d3.selectAll(`.highlight-${groupClass}`)
          .attr("r", 8)
          .attr("stroke", "#555")
          .attr("stroke-width", 2);
      })
      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function (event, d) {
        const groupClass = d["age group"].replace(">", "over");
        tooltip.style("visibility", "hidden");
        d3.selectAll(`.highlight-${groupClass}`)
          .attr("r", 5)
          .attr("stroke", "none");
      });

    g.selectAll(`.label-${status}`)
      .data(values)
      .enter()
      .append("text")
      .attr("x", d => x(d["age group"]))
      .attr("y", d => y(d.Count) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("fill", "#333")
      .text(d => d.Count);
  }

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 45)
    .attr("fill", "#333")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .style("text-anchor", "middle")
    .text("Nhóm tuổi");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -70)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .attr("fill", "#333")
    .text("Số người mắc bệnh tim");

  const legendContainer = d3.select("#legend-container");
  legendContainer.html("");
  legendContainer.append("div")
    .style("font-weight", "bold")
    .style("font-size", "14px")
    .text("Tình trạng bệnh tim:");
  ["Không có bệnh tim", "Có bệnh tim"].forEach(status => {
    const item = legendContainer.append("div").attr("class", "legend-item");
    item.append("div").attr("class", "legend-color").style("background", color(status));
    item.append("div").text(status);
  });

  isFirstRender = false;
}

function applyFilters() {
  const statusSelected = [];
  d3.selectAll(".status").each(function () {
    if (d3.select(this).property("checked")) statusSelected.push(this.value);
  });
  const filtered = originalData.filter(d => statusSelected.includes(d["Heart Disease Status"]));
  updateChart(filtered);
}

document.getElementById("sort").addEventListener("change", applyFilters);
d3.selectAll(".status").on("change", applyFilters);

document.querySelector(".download-button").addEventListener("click", () => {
    html2canvas(document.getElementById("chart1-capture")).then(canvas => {
      const link = document.createElement("a");
      link.download = "task1-chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });     
  
