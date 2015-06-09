"use strict";

// declare the margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 850 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


// create an svg element
var svg = d3.select(".barChart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// C:/Users/Bobby/Documents/programming_final_project
// Load in the data
d3.csv("./data/yearly_teams.csv", function(error, data) {
	data.forEach(function(d) {
    	d.Points =+ d.Points;
    	d.Season =+ d.Season;
  	});

	// create a unique function
	function isUnique(data, variable){
    	var number_of_years = new Array()
    	var length = data.length;

    	for (var i = 0; i < length; i++){
    		if (number_of_years.indexOf(data[i][variable]) == -1 && !isNaN(data[i][variable])){
    			number_of_years.push(data[i][variable]);
    		}
    	}
    	return number_of_years;
    }

    // calculate the number of years in dataset and use this for the height variable
    var years = isUnique(data, "Season");
    var number_of_years = years.length;

    // make a linear x scale
    var x = d3.scale.linear()
        .domain([0, d3.max(data, function(d){return d.Points})])
        .range([0, width]);

    // making the bar variable
    var bar, barEnter, barHeight;

    // make a draw function
    function draw(data, year) {

        
        if (year < 1995){
            barHeight = height / 22;
        }
        else {
            barHeight = height / 20;
        }
		
		// bind the data
        bar = svg.selectAll("g")
            .data(data.filter(function(d){return d.Season === year}))

        // making the enter and exit selectinos
        barEnter = bar.enter()
        var barExit = bar.exit()

        // remove the exit selection
        barExit.transition().duration(500).remove();

        // append a grouping to the enter selection
        barEnter = barEnter
            .append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"})

        // append rectangles to the enter selection
        barEnter
            .append("rect")
            .attr("class", "rect")
            .attr("width", function(d){return x(d.Points);})
            .attr("height", barHeight - 1)

        // append text to the enter selection
        barEnter
            .append("text")
            .attr("class", "text")
            .attr("x", function(d) { return x(d.Points) - 100; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .text(function(d) { return d.Teams; });


        // update selection
        bar.select('rect')
            .transition()
            .duration(500)
            .attr("width", function(d){return x(d.Points);})

        bar.select('text')
            .transition()
            .duration(500)
            .text(function(d){return d.Teams;})
            .attr("x", function(d) { return x(d.Points) - 100; })

    };

    window.onload = draw(data, 1992);

    // making the drop down menu and adding an event listener
    var menu = d3.select(".dropdown-menu")
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
            var dataset = data.filter(function(d){return d.Season === year})
            draw(dataset, year);
        })

    // mouseover changes the fill of the rectangles, adds a new text class and displays Points
    barEnter.on('mouseover', function(d){
        d3.select(this)
        .select('.rect')
        .style("fill", "#ADD8E6")

        d3.select(this)
        .select(".text")
        .attr("class", "largeText")

        d3.select(this)
        .append("text")
        .attr("class", "largeText")
        .attr("x", function(d) { return x(d.Points) - 37; })
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) { return String(d.Points) + " " + "Points"; });
    });

    // mouseout moves the class steelblue back and hides the points of a team
    barEnter.on("mouseout", function(d){
        d3.select(this)
        .select('.rect')
        .style('fill', 'steelblue');

        d3.select(this)
        .select("text")
        .attr("class", "text")

        d3.select(".largeText").remove()
    })
        
});