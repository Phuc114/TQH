const svg = d3.select("svg"),
      margin = {top: 50, right: 30, bottom: 60, left: 60},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("visibility", "hidden");

let activeBar = null;
let showPercent = false;
let isFirstRender = true;

function updateLabels() {
    g.selectAll(".bar-label").text(d => {
      const total = d.data.Yes + d.data.No;
      const value = d[1] - d[0];
      return showPercent ? `${((value / total) * 100).toFixed(1)}%` : value;
    });
  }

// Event listener for toggle display mode
document.getElementById("toggleDisplay").addEventListener("change", function () {
  showPercent = this.checked;
  document.getElementById("toggleLabel").innerText = showPercent ? "phần trăm" : "số";
  updateLabels();
});

// Event listener for filters
document.querySelectorAll(".filter-status").forEach(cb => {
  cb.addEventListener("change", () => {
    updateHighlights();
    updateLabels();
  });
});

d3.csv("task_3_Summary.csv").then(data => {
  data.forEach(d => {
    d.Count = +d["Count of project_heart_disease (1).csv"];
  });

  const nested = d3.rollups(data, v => ({
    Yes: v.find(d => d["Heart Disease Status"] === "Yes")?.Count || 0,
    No: v.find(d => d["Heart Disease Status"] === "No")?.Count || 0
  }), d => d.Smoking);

  const stackData = nested.map(([key, val]) => ({
    Smoking: key,
    Yes: val.Yes,
    No: val.No
  }));

  const subgroups = ["Yes", "No"];
  const color = d3.scaleOrdinal().domain(subgroups).range(["#1f77b4", "orange"]);
  const x = d3.scaleBand().domain(stackData.map(d => d.Smoking)).range([0, width]).padding(0.5);
  const y = d3.scaleLinear().domain([0, d3.max(stackData, d => d.Yes + d.No)]).nice().range([height, 0]);

  const stack = d3.stack().keys(subgroups);
  const stackedData = stack(stackData);

  const bars = g.append("g")
    .selectAll("g")
    .data(stackedData)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data.Smoking))
    .attr("y", height)
    .attr("height", 0)
    .attr("width", x.bandwidth())
    .style("opacity", 1)
    .attr("stroke", "none")
    .attr("class", d => `bar-${d.data.Smoking}-${d[1] - d[0]}`)
    .on("mouseover", function(event, d) {
      const status = d[1] - d[0] === d.data.Yes ? "Yes" : "No";
      tooltip.style("visibility", "visible")
             .html(`<strong>Smoking:</strong> ${d.data.Smoking}<br>
                    <strong>Status:</strong> ${status}<br>
                    <strong>Count:</strong> ${d[1] - d[0]}`);
    })
    .on("mousemove", event => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"))
    .on("click", function(event, d) {
      event.stopPropagation();
      activeBar = {smoking: d.data.Smoking, value: d[1] - d[0]};
      updateHighlights();
    });

  if (isFirstRender) {
    bars.transition()
        .duration(800)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]));
    isFirstRender = false;
  } else {
    bars.attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]));
  }

  g.selectAll(".bar-label")
    .data(stackedData.flatMap(d => d))
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.data.Smoking) + x.bandwidth() / 2)
    .attr("y", d => (y(d[0]) + y(d[1])) / 2)
    .attr("text-anchor", "middle")
    .style("fill", "#000")
    .style("font-size", "13px")
    .style("font-weight", "600")
    .text(d => d[1] - d[0]);

  

  function updateHighlights() {
    const checked = Array.from(document.querySelectorAll(".filter-status:checked")).map(d => d.value);
  
    g.selectAll("rect")
      .style("opacity", d => {
        const status = d[1] - d[0] === d.data.Yes ? "Yes" : "No";
  
        if (activeBar) {
          return (d.data.Smoking === activeBar.smoking && (d[1] - d[0]) === activeBar.value) ? 1 : 0.2;
        }
  
        if (checked.length === 1) {
          return status === checked[0] ? 1 : 0.2;
        }
  
        return 1;
      })
      .attr("stroke", d => {
        const status = d[1] - d[0] === d.data.Yes ? "Yes" : "No";
  
        if (activeBar && d.data.Smoking === activeBar.smoking && (d[1] - d[0]) === activeBar.value) {
          return "#000";
        }
  
        if (checked.length === 1 && status === checked[0]) {
          return "#000";
        }
  
        return "none";
      });
  }  

  document.body.addEventListener("click", () => {
    activeBar = null;
    updateHighlights();
  });

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#333")
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Smoking");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -65)
    .attr("dy", "1em")
    .attr("fill", "#333")
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Count");

    document.querySelector(".download-button").addEventListener("click", () => {
        const captureArea = document.getElementById("chart3-download-area");
        html2canvas(captureArea).then(canvas => {
          const link = document.createElement("a");
          link.download = "task3-chart.png";
          link.href = canvas.toDataURL();
          link.click();
        });
      });          
});