(function() {
    var width = 800, height = 600, margin = {top: 60, right: 40, bottom: 60, left: 80};
    var svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;

    var chartG = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    var statFields = [
        { value: "PTS", label: "Points" },
        { value: "AST", label: "Assists" },
        { value: "TRB", label: "Rebounds" },
        { value: "STL", label: "Steals" },
        { value: "BLK", label: "Blocks" },
        { value: "G", label: "Games Played" },
        { value: "FG", label: "Field Goals" },
        { value: "3P", label: "3-Point Field Goals" },
        { value: "FT", label: "Free Throws" }
    ];

    var controlsDiv = d3.select("body")
        .append("div")
        .attr("id", "controls")
        .style("margin-bottom", "10px");

    controlsDiv.append("label")
        .attr("for", "stat-select")
        .text("Stat: ");

    var dropdown = controlsDiv
        .append("select")
        .attr("id", "stat-select");

    dropdown.selectAll("option")
        .data(statFields)
        .enter()
        .append("option")
        .attr("value", d => d.value)
        .text(d => d.label);

    controlsDiv.append("label")
        .attr("for", "cumulative-toggle")
        .style("margin-left", "20px")
        .text("Show Cumulative");

    var cumulativeToggle = controlsDiv
        .append("input")
        .attr("type", "checkbox")
        .attr("id", "cumulative-toggle")
        .property("checked", true);

    var color = d3.scaleOrdinal()
        .domain(["LeBron James", "Michael Jordan"])
        .range(["#1d428a", "#ce1141"]);

    Promise.all([
        d3.csv("LebronTotals.csv"),
        d3.csv("MJTotals.csv")
    ]).then(function([lebronData, mjData]) {
        lebronData.forEach((d, i) => {
            d.SeasonNum = i + 1;
            d.Player = "LeBron James";
            statFields.forEach(f => d[f.value] = +d[f.value]);
        });
        mjData.forEach((d, i) => {
            d.SeasonNum = i + 1;
            d.Player = "Michael Jordan";
            statFields.forEach(f => d[f.value] = +d[f.value]);
        });

        function computeCumulative(data) {
            statFields.forEach(f => {
                let runningTotal = 0;
                data.forEach(d => {
                    runningTotal += d[f.value];
                    d["CUM_" + f.value] = runningTotal;
                });
            });
        }
        computeCumulative(lebronData);
        computeCumulative(mjData);

        function computeAverages(data) {
            statFields.forEach(f => {
                data.forEach(d => {
                    d["AVG_" + f.value] = d[f.value]; 
                });
            });
        }
        computeAverages(lebronData);
        computeAverages(mjData);

        var allData = [
            { name: "LeBron James", values: lebronData },
            { name: "Michael Jordan", values: mjData }
        ];

        var currentStat = statFields[0].value;
        var isCumulative = true;

        var xScale = d3.scaleLinear()
            .range([0, chartWidth]);
        var yScale = d3.scaleLinear()
            .range([chartHeight, 0]);

        var xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d"));
        var yAxis = d3.axisLeft(yScale);

        chartG.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${chartHeight})`);

        chartG.append("g")
            .attr("class", "y-axis");

        svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", margin.left + chartWidth / 2)
            .attr("y", height - 15)
            .text("Season Number");

        var yLabel = svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", `translate(20,${margin.top + chartHeight / 2}) rotate(-90)`)
            .text(statFields[0].label + " (Cumulative)");

        var line = d3.line()
            .x(d => xScale(d.SeasonNum))
            .y(d => yScale(isCumulative ? d["CUM_" + currentStat] : d["AVG_" + currentStat]));

        var legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right - 120},${margin.top - 40})`);

        legend.selectAll("rect")
            .data(allData)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 25)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d.name));

        legend.selectAll("text")
            .data(allData)
            .enter()
            .append("text")
            .attr("x", 25)
            .attr("y", (d, i) => i * 25 + 13)
            .text(d => d.name);

        function updateChart(stat, cumulative) {
            var maxSeason = d3.max(allData, d => d.values.length);
            xScale.domain([1, maxSeason]);
            var yMax = d3.max(allData, d => d3.max(d.values, v => cumulative ? v["CUM_" + stat] : v["AVG_" + stat]));
            yScale.domain([0, yMax * 1.1]);

            chartG.select(".x-axis").transition().call(xAxis);
            chartG.select(".y-axis").transition().call(yAxis);

            var statLabel = statFields.find(f => f.value === stat).label;
            yLabel.text(statLabel + (cumulative ? " (Cumulative)" : " (Per Season)"));

            line.y(d => yScale(cumulative ? d["CUM_" + stat] : d["AVG_" + stat]));

            var playerLines = chartG.selectAll(".player-line")
                .data(allData, d => d.name);

            playerLines.enter()
                .append("path")
                .attr("class", "player-line")
                .merge(playerLines)
                .transition()
                .attr("fill", "none")
                .attr("stroke", d => color(d.name))
                .attr("stroke-width", 3)
                .attr("d", d => line(d.values));

            playerLines.exit().remove();
        }

        updateChart(currentStat, isCumulative);

        dropdown.on("change", function() {
            currentStat = this.value;
            updateChart(currentStat, isCumulative);
        });

        cumulativeToggle.on("change", function() {
            isCumulative = this.checked;
            updateChart(currentStat, isCumulative);
        });

    }).catch(function(error) {
        console.error("Error loading data:", error);
    });

})();
