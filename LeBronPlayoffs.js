const svg = d3.select("svg");
const tooltip = d3.select("#tooltip");
const width = +svg.attr("width");
const height = +svg.attr("height");

const colorScale = d3.scaleThreshold()
    .domain([6, 11, 21, 31])
    .range(["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71"]);

const roundOrder = ["First Round", "Semifinals", "Conference Finals", "Finals"];

const yScale = d3.scaleBand()
    .domain(roundOrder)
    .range([50 + 100 * 4, 50])
    .paddingInner(0);

const yAxis = d3.axisLeft(yScale).tickSize(-width + 160);

svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(110,0)")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "12px");

svg.selectAll(".y-axis .tick line")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "2,2");

d3.json("./lebron_playoff_data.json").then(data => {
    const years = Array.from(new Set(data.map(d => d.year))).sort();
    const nested = d3.group(data, d => d.year);

    const xScale = d3.scaleBand()
        .domain(years)
        .range([120, width - 50])
        .padding(0.3);

    let selectedRound = "All";

    const barGroups = svg.selectAll("g.bar")
        .data(years)
        .join("g")
        .attr("class", "bar")
        .attr("transform", d => `translate(${xScale(d)}, 0)`);

    function renderBars() {
        barGroups.each(function (year) {
            const group = d3.select(this);
            group.selectAll("*").remove();

            const rounds = nested.get(year)
                .sort((a, b) => roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round));

            const visibleRounds = selectedRound === "All"
                ? rounds
                : rounds.filter(r => r.round === selectedRound);

            visibleRounds.forEach(round => {
                const segmentTop = yScale(round.round);

                group.append("rect")
                    .attr("x", 0)
                    .attr("y", segmentTop)
                    .attr("width", xScale.bandwidth())
                    .attr("height", yScale.bandwidth())
                    .attr("fill", colorScale(+round.srs_rank))
                    .attr("data-round", round.round)
                    .on("mouseover", function () {
                        tooltip.style("display", "block")
                            .html(`<strong>${round.round} - ${round.team}</strong><br>
                     Record: ${round.record}<br>
                     SRS Rank: ${round.srs_rank} / 30<br>
                     Odds: ${round.championship_odds}<br>
                     All-Stars: ${round.all_star_players.join(", ")}<br>
                     MVPs: ${round.mvp_players.join(", ")}`);
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 30) + "px");
                    })
                    .on("mouseout", () => tooltip.style("display", "none"));

                group.append("text")
                    .attr("x", xScale.bandwidth() / 2)
                    .attr("y", segmentTop + 12)
                    .style("font-weight", "bold")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("data-round", round.round)
                    .text(`${round.team}`);

                group.append("text")
                    .attr("x", xScale.bandwidth() / 2)
                    .attr("y", segmentTop + 26)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("data-round", round.round)
                    .text(`${round.results}`);

                const iconGroup = group.append("g")
                    .attr("transform", `translate(${xScale.bandwidth() / 2}, ${segmentTop + 42})`)
                    .attr("text-anchor", "middle");

                const iconSpacing = 16;

                function appendIcons(type, count, yOffsetRow, iconPath) {
                    for (let i = 0; i < count; i++) {
                        iconGroup.append("image")
                            .attr("href", iconPath)
                            .attr("width", 14)
                            .attr("height", 14)
                            .attr("x", -((count - 1) * iconSpacing) / 2 + i * iconSpacing)
                            .attr("y", yOffsetRow)
                            .attr("data-round", round.round);
                    }
                }

                appendIcons('allstar', round.all_stars, 0, './img/allStarLogo.png');
                appendIcons('mvp', round.mvps, 18, './img/MVP.png');
                if (round.defending_champ === "Yes") {
                    appendIcons('trophy', 1, 36, './img/LOB.png');
                }
            });

            group.append("text")
                .attr("x", xScale.bandwidth() / 2)
                .attr("y", yScale("First Round") + yScale.bandwidth() + 15)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .text(year);
        });
    }

    renderBars();

    const rounds = [...new Set(data.map(d => d.round))];
    d3.select("#buttons").selectAll("button")
        .data(["All", ...rounds])
        .join("button")
        .attr("class", "filter-btn")
        .text(d => d)
        .on("click", function (event, d) {
            d3.selectAll(".filter-btn").classed("active", false);
            d3.select(this).classed("active", true);
            selectedRound = d;
            renderBars();
        });
});
