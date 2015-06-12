"use strict";

// declare the margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 850 - margin.left - margin.right,
    height_map = 800 - margin.top - margin.bottom;

// append the svg element to the body
var svg = d3.select(".ukMap").append("svg")
    .attr("width", width)
    .attr("height", height_map)

var container = svg.append("g");

// create a projection, zoom in and set center op map to middle
var projection =  d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(6000)
    .translate([width / 2, height_map / 5])

// create a path variable using the projection
var path = d3.geo.path()
	.projection(projection);

// making a scale for the stadium capacity
var capacityScale = d3.scale.linear()
  .range([2, 8]);

d3.json("./data/uk.json", function(error, uk) {
  if (error) return console.error(error);
  console.log(uk)

  // make a countries variable that can be directly accessed
  var admin_units = uk.objects.subunits

  svg.append("path")
  	.datum(topojson.feature(uk, admin_units))
  	.attr("d", path);

  svg.selectAll(".subunit")
    .data(topojson.feature(uk, admin_units).features)
  	.enter().append("path")
    .attr("class", function(d) { return "subunit " + d.id; })
    .attr("d", path);

 
   svg.append("path")
    .datum(topojson.mesh(uk, admin_units, function(a, b) { return a !== b && a.id !== "IRL" || a.id !== "NIR" || a.id !== "SCT"}))
    .attr("d", path)
    .attr("class", "subunit-boundary");

    svg.append("path")
    .datum(topojson.mesh(uk, admin_units,
    	function(a, b){ return a === b && (a !== "ENG" || a !== "WLS") ||
    					a !== b && (a === "SCT" || a === "NIR" || a === "IRL")}))
    .attr("d", path)
    .attr("class", "subunit-boundary-hidden")

    d3.csv("./data/stadium_teams.csv", function(stadium_data){

      // transforming the data from string to integer
      stadium_data.forEach(function(d) {
        d.Capacity =+ d.Capacity;
        d.Latitude =+ d.Latitude;
        d.Longitude =+ d.Longitude;
        d.Season =+ d.Season;
      });

      // calculate the number of years in dataset and use this for the height variable
      var years = isUnique(stadium_data, "Season");
      var number_of_years = years.length;

      // deciding on the domain of capacity scalee
      capacityScale.domain([10000, 80000]);
      var point, pointEnter;

      // making the draw function that initializes the visualization
      function draw_map (data, year){

        // select
        point = svg.selectAll("circle")
          .data(stadium_data.filter(function(d){return d.Season === year}))

        // making the enter and exit selectinos
        pointEnter = point.enter()
        var pointExit = point.exit() 

        // remove the exit selection
        pointExit.transition().duration(500).remove();
        
        // Enter selection
        pointEnter
        .append("circle")
        .attr("class", "stadium")
        .attr("cx", function(d){
          return projection([d.Longitude, d.Latitude])[0]
        })
        .attr("cy", function(d){
          return projection([d.Longitude, d.Latitude])[1]
        })
        .attr("r", function(d){
          return capacityScale(d.Capacity);
        });

        // update selection
        point.select("circle")
          .transition()
          .duration(500)
          .attr("cx", function(d){
            return projection([d.Longitude, d.Latitude])[0]
          })
          .attr("cy", function(d){
            return projection([d.Longitude, d.Latitude])[1]
          })
          .attr("r", function(d){
            return capacityScale(d.Capacity);
          });

      }

      window.onload = draw_map(stadium_data, 1992);

      // making the dropdown menu
      var menu = d3.select(".map-drop-down")
        .selectAll("li")
        .data(years)
        .attr("role", "presentation")
        .enter()
        .append("li")
        .append("a")
        .attr("href",  "")
        .text(function(d,i){return years[i];})
        .on("click", function(d){
            d3.event.preventDefault();
            var year = d;
            var dataset = stadium_data.filter(function(d){return d.Season === year})
            console.log(dataset);
            console.log(year);
            draw_map(dataset, year);
      })

      function update(year) {
        var filtered = stadium_data.filter(function(d){return d.Season === year});

        var circles = svg.selectAll('circle')
          .data(filtered);

        circles.exit.remove();

        circles.enter()
          .append("circle")
          .attr("cx", function(d){
            return projection([d.Longitude, d.Latitude])[0]
          })
          .attr("cy", function(d){
            return projection([d.Longitude, d.Latitude])[1]
          })
          .attr("r", function(d){
            return capacityScale(d.Capacity);
          });
      }

    })

})