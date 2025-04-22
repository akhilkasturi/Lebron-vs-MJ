
(function() {
//iife - this wraps the code in a function so it isn't accidentally exposed
//to other javascript in other files. It is not required.

    var width=800, height=600

    //read in our csv file
    d3.csv("./cars.csv").then((data) => {
        const svg = d3.select("#scatterplot");

        //create an svg g element and add 50px of padding
        const chart = svg.append("g")
            .attr("transform", `translate(50, 50)`);

        //create linear scales to map your data
        //x and y become functions that can be called later (functions are 1st class citizens in JS)
        var x = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => { return +d.hwy})])
            .range([ 0, width ]);

        var y = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => { return +d.cty})])
            .range([height, 0]);

        //add axes
        chart.append("g")
            .attr("transform", "translate(0," + (height) + ")")
            .call(d3.axisBottom(x));
        chart.append("g")
            .call(d3.axisLeft(y));

        // Add marks (points/circles)
        chart.append('g')
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle") //map data attributes to channels
            .attr("cx", function (d) { return x(+d.hwy); } )
            .attr("cy", function (d) { return y(+d.cty); } )
            .attr("r", 4)
            .style("opacity", 0.25)
            .style("fill", "#69b3a2")

    });

})();