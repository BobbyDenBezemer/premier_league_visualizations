"use strict";

// declare the margins
var margin = {top: 20, right: 20, bottom: 80, left: 50},
    width_map = 650 - margin.left - margin.right,
    height_map = 650 - margin.top - margin.bottom,
    width_line_graph = 650 - (margin.left *2) - margin.right,
    height_line_graph = 400 - margin.top - margin.bottom;

// append the svg element to the body
var uk_map = d3.select(".ukMap").append("svg")
    .attr("width", width_map)
    .attr("height", height_map)

// create a projection, zoom in and set center on map to middle
var projection =  d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(4200)
    .translate([width_map / 2, height_map / 5])

// create a path variable using the projection
var path = d3.geo.path()
	.projection(projection);

// making a scale for the stadium capacity
var capacityScale = d3.scale.linear()
  .range([4, 8]);

// append the linegraph svg
var line_graph = d3.select("#foreignPlayers")
    .append("svg")
    .attr("width", width_line_graph + margin.left + margin.right)
    .attr("height", height_line_graph + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// Set the ranges
var x = d3.scale.linear().range([0, width_line_graph])
var y = d3.scale.linear().range([height_line_graph, 0]);

// main function that draws the map and line
var drawMapLineGraph = function(error, data){
  // give each dataset its own variable name
  var uk = data[0];
  var stadium_data = data[1];
  var data_foreign = data[2];
  console.log(stadium_data);
  console.log(data_foreign);

  // convert floats to ints
  stadium_data.forEach(function(d) {
    d.Capacity =+ d.Capacity;
    d.Latitude =+ d.Latitude;
    d.Points =+ d.Points;
    d.Longitude =+ d.Longitude;
    d.Season =+ d.Season;
  });

  data_foreign.forEach(function(d) {
    d.Year =+ d.Year
    d.Perc_foreign =+ d.Perc_foreign
  });

  // make a countries variable that can be directly accessed
  var admin_units = uk.objects.subunits

  // adding the map paths such that the map is drawn
  uk_map.append("path")
  	.datum(topojson.feature(uk, admin_units))
  	.attr("d", path);

  // give each country in the UK its own class
  uk_map.selectAll(".subunit")
    .data(topojson.feature(uk, admin_units).features)
  	.enter().append("path")
    .attr("class", function(d) { return "subunit " + d.id; })
    .attr("d", path);   

  // timer that keeps track of which yearly animation
  var yearTimer = 0; 

  // calculate the number of years in dataset and use this for the height variable
  var years = isUnique(stadium_data, "Season");
  var number_of_years = years.length;

  // deciding on the domain of capacity scalee
  capacityScale.domain([10000, 80000]);
  var point, pointEnter, tmp
  var oldData;

  // making the axis scale
  var width_axis = width_map - margin.left;
  var xScale = d3.scale.linear()
    .domain([d3.min(stadium_data, function(d){return d.Season}), 
    d3.max(stadium_data, function(d){return d.Season})])
          .range([margin.left, width_axis]);

  var xAxisMap = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .tickFormat(d3.format("d"));

  // append axis
  uk_map.append("g")
    .attr("class", "axis")  //Assign "axis" class
    .attr("transform", "translate(0," + (height_map - 25) + ")")
    .call(xAxisMap);

  // Scale the range of the data
  x.domain([1992, 2014]);
  y.domain([0, 100]);

  // making the function for the linegraph
  var valueline = d3.svg.line()
    .x(function(d) { return x(d.Year); })
    .y(function(d) { return y(d.Perc_foreign); })
    .interpolate("basis");

  // variables for constructing the legend of the linegraph
  var legend;
  var horizontal_spacing = 180;
  var vertical_spacing = 20;
  var extra_spacing = 20;

  // Define the axes
  var xAxisGraph = d3.svg.axis().scale(x)
    .orient("bottom").ticks(16).tickFormat(d3.format("d"));

  var yAxisGraph = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

  //teams
  var num_teams_selected = 0;
  var team_selected = []

  // making the draw function that initializes the visualization
  function draw_map (data, year){
    // increase year timer
    yearTimer += 1;

    // sort and filter the data
    data = data.filter(function(d){return d.Season === year});
    //data = data.filter(function(d){return !d.Teams in oldData.Teams;})
    data = data.sort(function(a, b){return d3.descending(a.Points, b.Points); })

    // select all circles
    point = uk_map.selectAll("circle")
      .data(data, function(d){return d.Teams;})

    // making the exit selection
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
          
      // enter selection should have a fadeIn transition 
      pointEnter = point.enter()
        .append("circle")
        .attr("class", "stadium")
        .attr("opacity", "0")
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
        .attr("opacity", "1")

      // remove the exit selection
      pointExit.transition().duration(1000).style('opacity', '0').remove();

      // remove the hidden class of the marker
      d3.select("#marker").classed("hidden", false)

      // add an event handler to all the new circular elements
      point = uk_map.selectAll("circle");
      point
        .on('mouseover', function(d){

          // highlight the element
          //d3.select(this)
          //.style("fill", "#ADD8E6")

          // decide on the position of the textbox
          var xPosition = parseFloat(d3.select(this).attr("cx"));
          if (xPosition + parseInt(d3.select("#textBox").style("width")) > width_map + margin.right){
            xPosition = xPosition - parseInt(d3.select("#textBox").style("width"));
          }
          var yPosition = parseFloat(d3.select(this).attr("cy")) + 180;

          // set the textbox to the location details
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
        // set the colour back to its original colour
        //d3.select(this)
        //.style("fill", "steelblue")

        // hide the textbox
        d3.select("#textBox").classed("hidden", true);

      })
      var test;
      point.on('click', function(d){
        var teamClass

        // if the team is already displayed in a graph, remove it
        if (contains(team_selected, d.Teams)){

          // take the class based on team name and remove it
          teamClass = "." + String(d.Teams).substring(0,3) + 
            String(d.Teams).substring(d.Teams.length - 3, d.Teams.length);
          d3.selectAll(teamClass).remove();

          // select the index of the removed team
          var index = team_selected.indexOf(d.Teams);

          // if the index returned is zero and there are 2 teams displayed adjust the legend and the colour
          if (index === 0 && team_selected.length == 2){
            vertical_spacing = 20;
            d3.select(".legend" + " " + "." + String(team_selected[1]).substring(0,3) + 
              String(team_selected[1]).substring((team_selected[1].length) - 3, team_selected[1].length))
              .attr("y", vertical_spacing + margin.top)
              .attr("fill", "red");

            d3.select(".line" + "." + String(team_selected[1]).substring(0,3) + 
              String(team_selected[1]).substring((team_selected[1].length) - 3, team_selected[1].length))
              .attr("stroke", "red");
          }

          // remove the team from the array and update the number of teams variable
          team_selected.splice(index, 1); 
          num_teams_selected--;

          // set class back to stadium
          d3.select(this)
            .attr("class", "stadium");
        }

        // if the number of teams selected is larger than 2, do nothing
        else if (num_teams_selected >= 2){
          return;
        }

        // make a linegraph of the amount of foreign players of the team
        else {

          // update the array of selected teams
          team_selected.push(d.Teams);
          num_teams_selected++;

          // make a new class for the legend based on its team name and points
          teamClass = String(d.Teams).substring(0,3) + 
            String(d.Teams).substring(d.Teams.length - 3,d.Teams.length);
          console.log(teamClass);

          // reset vertical spacing
          vertical_spacing = 20;
          var colour = "red"
          var item = "firstSelected";

          // if theres already a line, change spacing and colour
          if (num_teams_selected == 2){
            vertical_spacing = vertical_spacing + extra_spacing;
            colour = "green";
            item = "secondSelected";
          }
          // change the colour of the point so its clear on the map
          d3.select(this)
            .attr("class", item);

          // add a new line
          add_line(data_foreign, d.Teams, colour);

          // update the legend
          legend.append('text')
            .attr('x', width_line_graph - horizontal_spacing)
            .attr('y', vertical_spacing + margin.top)
            .attr("class", teamClass)
            .attr("fill", colour)
            .attr("font-weight", "bold")
            .text(d.Teams);
          }
        
      })

      // Making the timeline: Set the timer variable
      var timer;
      for (var i = 0; i < years.length; i++){
        if (years[i] === year) {
          timer = i
        }
      }

      // use the timer variable to determine position of the timeline marker
      var width_marker = parseInt(d3.select("#marker").style("width"));
      var xCoord = (margin.left - width_marker) + (width_axis / (number_of_years + 1)) * (timer + 1);
      var yCoord = height_map + 200;

      d3.select("#marker")
        .style("left", xCoord + "px")
        .style("top", yCoord + "px");

      // clear the timer interval if it reaches 2014
      if (yearTimer === number_of_years){
        clearTimeout(mapInterval);
      }
        
    }

    // a function that initializes the line graph with the average of foreign players
    function make_line_graph(data){
      // filter data on the average
      var data = data.filter(function(d){return d.Team === "Average"});

      // Add the valueline path.
      line_graph.append("path")
        .attr("class", "line")
        .attr("stroke", "steelblue")
        .attr("d", valueline(data));

      // Add the X Axis
      line_graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height_line_graph + 5) + ")")
        .call(xAxisGraph)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-45)" 
        })
      // Add the X axis label
      line_graph.append("g")
        .attr("class", "x_label")
        .append("text")
        .attr("text-anchor", "start")
        .attr("x", width_line_graph / 4)
        .attr("y", height_line_graph + 70)
        .text("Premier league seasons");

      // Add the Y Axis
      line_graph.append("g")
        .attr("class", "y axis")
        .call(yAxisGraph)

      // Add the Y axis label
      line_graph.append("g")
        .attr("class", "y_label")
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", -40)
        .attr("y", height_line_graph - 335)
        .attr("transform", "rotate(-90)")
        .text("Percentage of foreign players") 

        legend = line_graph.append('g')
          .attr("class", "legend")    


        legend.append('text')
          .attr('x', width_line_graph - horizontal_spacing)
          .attr('y', vertical_spacing)
          .attr("fill", "steelblue")
          .attr("font-weight", "bold")
          .text("Average");
      }

    // make a function add_line
    function add_line(data, team, colour){
      // filter data on the average
      var data = data.filter(function(d){return d.Team === team});

      var teamClass = String(team).substring(0,3) + 
        String(team).substring(team.length - 3,team.length);
      
      // Add the valueline path.
      line_graph.append("path")
        .attr("class", "line" + " " + teamClass)
        .attr("stroke", colour)
        .attr("d", valueline(data));
    }

    // set the interval and make run it
    var mapInterval = setInterval(function(){draw_map(stadium_data, years[yearTimer])}, 2000);
    mapInterval;

    // run the function make_line_graph
    make_line_graph(data_foreign);

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

      // a pauze button that clears the time interval
      var pauzeButton = d3.select("#mapPauzeButton")
        .on("click", function(){
          clearTimeout(mapInterval);
        })

      // continue button that continues interval from where global variable yearTimer is
      var continueButton = d3.select("#mapContinueButton")
        .on("click", function(){
          if (mapInterval){
            clearTimeout(mapInterval);  
          }
        mapInterval = setInterval(function(){draw_map(stadium_data, years[yearTimer])}, 2000);
      })

      // restart button that sets yearTimer to zero and makes the interval run again
      var restartButton = d3.select("#mapRestartButton")
        .on("click", function(){
          yearTimer = 0;
          clearTimeout(mapInterval);
          mapInterval = setInterval(function(){draw_map(stadium_data, years[yearTimer])}, 2000);
        })

  // a contains function that checks whether an element is in an array
  function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
  }
}

// a queue which makes sure all data objects are available in drawMapLineGraph
var q = queue(1);
q.defer(d3.json, "./data/uk.json");
q.defer(d3.csv, "./data/stadium_teams.csv");
q.defer(d3.csv, "./data/perc_foreign.csv");
q.awaitAll(drawMapLineGraph); 

// TODO:
// Clear magic numbers
// Display the exact rank before the team name when you hoover in the barchart
// Clean webscraper premier league top scorers
// Make the report
// Update readme