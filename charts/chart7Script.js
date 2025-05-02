const cellWidth = 140;
const cellHeight = 36;
const margin = { top: 40, right: 50, bottom: 60, left: 280 };
const svgWidth = 1200;
const svgHeight = 1000;

const svg = d3.select("#heatmap-container")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const g = svg.append("g").attr("transform", `translate(${margin.left + 130},${margin.top})`);
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip");

d3.csv("task_7_Summary.csv").then(data => {
  const ageGroups = [...new Set(data.map(d => d["Age Group"]))];
  const lifestyleGroups = [...new Set(data.map(d => d["Smoking | Alcohol | Exercise"]))];

  data.forEach(d => d.Count = +d["Count of Heart Disease Status"]);

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlGn)
    .domain([d3.max(data, d => d.Count), d3.min(data, d => d.Count)]);

  // Create scales
  const xScale = d3.scaleBand()
    .domain(ageGroups)
    .range([0, ageGroups.length * cellWidth])
    .padding(0);

  const yScale = d3.scaleBand()
    .domain(lifestyleGroups)
    .range([0, lifestyleGroups.length * cellHeight])
    .padding(0);

  // Draw cells
  data.forEach(d => {
    g.append("rect")
      .attr("x", xScale(d["Age Group"]))
      .attr("y", yScale(d["Smoking | Alcohol | Exercise"]))
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", colorScale(d.Count))
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event) {
        d3.select(this).attr("stroke-width", 1.5);
        tooltip.style("visibility", "visible")
          .html(`<strong>Age Group:</strong> ${d["Age Group"]}<br/>
                 <strong>Smoking | Alcohol | Exercise:</strong> ${d["Smoking | Alcohol | Exercise"]}<br/>
                 <strong>Count of Heart Disease Status:</strong> ${d.Count}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", (event.pageY + 15) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 0.5);
        tooltip.style("visibility", "hidden");
      });

    // Add count text
    g.append("text")
      .attr("x", xScale(d["Age Group"]) + cellWidth / 2)
      .attr("y", yScale(d["Smoking | Alcohol | Exercise"]) + cellHeight / 2 + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#000")
      .text(d.Count);
  });

  // X Axis (bottom)
  g.append("g")
    .attr("transform", `translate(0, ${lifestyleGroups.length * cellHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .style("font-size", "14px");

  // Y Axis (left)
  g.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "13px");

  // Trục X label
  svg.append("text")
    .attr("x", svgWidth / 2 + 80)
    .attr("y", margin.top + lifestyleGroups.length * cellHeight + 45)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "500")
    .text("Nhóm tuổi");

  // Trục Y label
  svg.append("text")
    .attr("transform", `rotate(-90)`)
    .attr("x", -svgHeight / 2 + 150)
    .attr("y", 220)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "500")
    .text("Hút thuốc | Tiêu thụ rượu | Thói quen tập thể dục");

  // Legend
  const legend = d3.select("#legend");
    legend.html("");

    legend.append("div")
    .attr("class", "legend-title")
    .text("Số người mắc bệnh tim");

    const colorBar = legend.append("div").attr("class", "color-scale-bar");

    const colorSteps = [
    "#00441b", "#1b7837", "#a6dba0", "#fddbc7", "#e34a33", "#99000d"
    ];

    colorSteps.forEach(color => {
    colorBar.append("div")
        .attr("class", "color-step")
        .style("background-color", color);
    });

    legend.append("div")
    .attr("class", "legend-values")
    .html(`<span>${d3.min(data, d => d.Count).toFixed(1)}</span><span>${d3.max(data, d => d.Count).toFixed(1)}</span>`);

});

// Export ảnh
document.querySelector(".download-button").addEventListener("click", () => {
    html2canvas(document.getElementById("chart7-capture")).then(canvas => {
      const link = document.createElement("a");
      link.download = "task7-chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });  
