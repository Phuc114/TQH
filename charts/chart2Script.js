const width = 300, height = 300, radius = Math.min(width, height) / 2;
const color = d3.scaleOrdinal().domain(["No", "Yes"]).range(["orange", "#1f77b4"]);

let activeSlice = null;
let showPercent = false;
let isFirstRender = true;

d3.csv("task_2_Summary.csv", d => ({
  Gender: d.Gender,
  "Heart Disease Status": d["Heart Disease Status"],
  Count: +d["Count of project_heart_disease (1)"]
})).then(data => {
  renderChart(data);

  d3.selectAll(".filter-status").on("change", () => {
    activeSlice = null;
    renderChart(data);
  });

  d3.select("body").on("click", (event) => {
    if (!event.target.closest("svg")) {
      activeSlice = null;
      renderChart(data);
    }
  });

  d3.select("#toggleDisplay").on("change", function () {
    showPercent = this.checked;
    document.getElementById("toggleLabel").innerText = showPercent ? "phần trăm" : "số";
    renderChart(data);
  });

  document.querySelector(".download-button").addEventListener("click", () => {
    const captureArea = document.getElementById("chart2-download-area");
    html2canvas(captureArea).then(canvas => {
      const link = document.createElement("a");
      link.download = "task2-chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });  
});

function renderChart(data) {
  d3.selectAll("svg").remove();
  d3.selectAll(".tooltip").remove();

  const selected = Array.from(document.querySelectorAll(".filter-status:checked")).map(el => el.value);
  const genders = ["Female", "Male"];

  genders.forEach(gender => {
    const svg = d3.select(`#${gender.toLowerCase()}Chart`)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const genderData = data.filter(d => d.Gender === gender);
    const pie = d3.pie().value(d => d.Count)(genderData);
    const total = d3.sum(genderData, d => d.Count);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("visibility", "hidden");

    const path = svg.selectAll("path")
      .data(pie)
      .enter()
      .append("path")
      .attr("fill", d => color(d.data["Heart Disease Status"]))
      .attr("stroke", d => {
        const isActive = activeSlice &&
          d.data.Gender === activeSlice.Gender &&
          d.data["Heart Disease Status"] === activeSlice["Heart Disease Status"];
        const isFiltered = selected.length === 1 && d.data["Heart Disease Status"] === selected[0];
        return isActive || isFiltered ? "#000" : "none";
      })
      .attr("stroke-width", 2)
      .style("opacity", d => {
        if (activeSlice) {
          return (d.data.Gender === activeSlice.Gender && d.data["Heart Disease Status"] === activeSlice["Heart Disease Status"]) ? 1 : 0.2;
        } else if (selected.length === 1) {
          return d.data["Heart Disease Status"] === selected[0] ? 1 : 0.2;
        }
        return 1;
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        activeSlice = d.data;
        renderChart(data);
      })
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .html(
            `<strong>Gender:</strong> ${d.data.Gender}<br/>
             <strong>Heart Disease Status:</strong> ${d.data["Heart Disease Status"]}<br/>
             <strong>Count:</strong> ${d.data.Count}`
          );
      })
      .on("mousemove", event => {
        tooltip.style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    if (isFirstRender) {
      path.transition()
        .duration(800)
        .attrTween("d", function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return t => arc(i(t));
        });
    } else {
      path.attr("d", arc);
    }

    svg.selectAll("text")
      .data(pie)
      .enter()
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text(d => {
        if (selected.length === 1 && d.data["Heart Disease Status"] !== selected[0]) return "";
        return showPercent ? `${((d.data.Count / total) * 100).toFixed(1)}%` : d.data.Count;
      });
  });

  isFirstRender = false;
}
