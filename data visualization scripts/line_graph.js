"use strict";

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 30},
    width_line_graph = 450 - margin.left - margin.right,
    height_line_graph = 270 - margin.top - margin.bottom


// Set the ranges
var x = d3.scale.linear().range([0, width_line_graph])
var y = d3.scale.linear().range([height_line_graph, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(8);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

// Define the line
var valueline = d3.svg.line()
    .x(function(d) { return x(d.Year); })
    .y(function(d) { return y(d.Perc_foreign); })
    .interpolate("basis");
    
// Adds the svg canvas
var line_graph = d3.select("#foreignPlayers")
    .append("svg")
        .attr("width", width_line_graph + margin.left + margin.right)
        .attr("height", height_line_graph + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("./data/perc_foreign.csv", function(error, data_foreign) {
    data_foreign.forEach(function(d) {
        d.Year =+ d.Year
        d.Perc_foreign =+ d.Perc_foreign
    });
    
    data_foreign = data_foreign.filter(function(d){return d.Team === "Average"});
    // Scale the range of the data
    x.domain([1992, 2014]);
    y.domain([0, 100]);

    // Add the valueline path.
    line_graph.append("path")
        .attr("class", "line")
        .attr("d", valueline(data_foreign));

    // Add the X Axis
    line_graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height_line_graph - 10) + ")")
        .call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-45)" 
                });

    // Add the Y Axis
    line_graph.append("g")
        .attr("class", "y axis")
        .call(yAxis);

});
