"use strict";

// declare the margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 850 - margin.left - margin.right,
    height_map = 850 - margin.top - margin.bottom;

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
  .range([4, 8]);

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

      // timer
      var yearTimer = 0; 

      // transforming the data from string to integer
      // transform to function
      stadium_data.forEach(function(d) {
        d.Capacity =+ d.Capacity;
        d.Latitude =+ d.Latitude;
        d.Points =+ d.Points;
        d.Longitude =+ d.Longitude;
        d.Season =+ d.Season;
      });

      // calculate the number of years in dataset and use this for the height variable
      var years = isUnique(stadium_data, "Season");
      var number_of_years = years.length;

      // deciding on the domain of capacity scalee
      capacityScale.domain([10000, 80000]);
      var point, pointEnter, tmp
      var oldData;

      // making the axis scale
      var xScale = d3.scale.linear()
          .domain([d3.min(stadium_data, function(d){return d.Season}), 
          d3.max(stadium_data, function(d){return d.Season})])
          .range([20, width - 20]);

      var xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient("bottom");

      // append axis
      svg.append("g")
        .attr("class", "axis")  //Assign "axis" class
        .attr("transform", "translate(0," + (height_map - 25) + ")")
        .call(xAxis);

      // making the draw function that initializes the visualization
      function draw_map (data, year){
        // increase year timer
        yearTimer += 1;
        console.log(yearTimer);

        // sort and filter the data
        data = data.filter(function(d){return d.Season === year});
        //data = data.filter(function(d){return !d.Teams in oldData.Teams;})
        data = data.sort(function(a, b){return d3.descending(a.Points, b.Points); })

        console.log(data);

        // select all circles
        point = svg.selectAll("circle")
          .data(data, function(d){return d.Teams;})

        // making the enter and exit selectinos
        //pointEnter = point.enter()
        var pointExit = point.exit() 


        // update selection.
        var update = point
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
        console.log(update);
          

        // enter selection should have a fadeIn transition which does not work so far
        pointEnter = point.enter()
          .append("circle")
          .attr("class", "stadium")
          .attr("fill-opacity", "0")
          .attr("cx", function(d){
            return projection([d.Longitude, d.Latitude])[0];
          })
          .attr("cy", function(d){
            return projection([d.Longitude, d.Latitude])[1];
          })
          .attr("r", function(d){
            return capacityScale(d.Capacity);
          })
          .transition()
          .duration(1000)
          .attr("fill-opacity", "1")

        // remove the exit selection
        pointExit.transition().duration(1000).style('opacity', '0').remove();

        // add an event handler to all the new circular elements
        point = svg.selectAll("circle");
        point
          .on('mouseover', function(d){
          d3.select(this)
          .style("fill", "#ADD8E6")

          var xPosition = parseFloat(d3.select(this).attr("cx")) + 30;
          var yPosition = parseFloat(d3.select(this).attr("cy")) - 20;

          // determine location of textBox and include date information
          d3.select("#textBox")
            .style("left", xPosition + "px")
            .style("top", yPosition + "px")
            .select("#team")
            .text(d.Teams);

          // put in the team name
          d3.select("#textBox")
            .select("#points")
            .text(d.Points);

          // include stadium capacity
          d3.select("#textBox")
            .select("#capacity")
            .text(d.Capacity);        

          // remove the hidden class from textBox
          d3.select("#textBox").classed("hidden", false);
        });

          point.on('mouseout',function(d){
            d3.select(this)
          .style("fill", "steelblue")

          d3.select("#textBox").classed("hidden", true);
        })

        //
        // paint the axis and then find its ticks
        var timer;
        for (var i = 0; i < years.length; i++){
          if (years[i] === year) {
            timer = i
          }
        }
        console.log(year)
        //var timer = 
        var xCoord = 33.5 * (timer + 1);
        var yCoord = 830;
        console.log(xCoord);
        d3.select("#marker")
          .style("left", xCoord + "px")
          .style("top", yCoord + "px");

        if (yearTimer === number_of_years){
          clearTimeout(mapInterval);
        }
        
      }
      var mapInterval = setInterval(function(){draw_map(stadium_data, years[yearTimer])}, 2000);
      window.onload = mapInterval;

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
            //console.log(dataset);
            console.log(year);
            draw_map(stadium_data, year);
      })


      

    })

})