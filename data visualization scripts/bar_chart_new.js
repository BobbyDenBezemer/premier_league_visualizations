"use strict";

// declare the margins
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 950 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;


// create an svg element
var svg1 = d3.select(".barChart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

// Load in the data
var drawVisualization = function(error, data){
    var dataRanking = data[0];
    var dataScores = data[1];
    console.log(dataScores);

    dataRanking.forEach(function(d){
        d.Points =+ d.Points;
        d.Season =+ d.Season;
    });

    dataScores.forEach(function(d){
        d.Goals =+ d.Goals;
        d.Year =+ d.Year;
    })

    // calculate the number of years in dataset and use this for the height variable
    var years = isUnique(dataRanking, "Season");
    var number_of_years = years.length;

    // make a linear x scale
    var x = d3.scale.linear()
        .domain([0, d3.max(dataRanking, function(d){return d.Points})])
        .range([120, width]);

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
        bar = svg1.selectAll("g")
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

    var table, thead, tbody, rows;
    table = d3.select("#Table").append("table")
            .attr("id", "scoreTable")

    thead = table.append("thead"),
    tbody = table.append("tbody");

    var columns = ["Year", "Name", "Team", "Goals"];        

    // append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(function(column) { return column; });

    function draw_table(data, year){

        // the columns you'd like to display
        var data = data.filter(function(d){return d.Year === year})
        
        // create a row for each object in the data
        rows = tbody.selectAll("tr")
            .data(data)

        // the enter selection for each row    
        rows.enter()
            .append("tr")


        // create a cell in each row for each column
        var cells = rows.selectAll("td")
            .data(function(row) {
            return columns.map(function(column) {
                return {column: column, value: row[column]};
            });
        })
        // the enter selection for each cells
        cells.enter()
        .append("td")

        // the update functions that updates the text of each td

        rows.exit().remove()
        cells.exit().remove()

        cells
            .text(function(d) { return d.value; });
    } 
    draw(dataRanking, 1992)
    draw_table(dataScores, 1992)
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
            var dataset = dataRanking.filter(function(d){return d.Season === year})
            var tableData = dataScores.filter(function(d){return d.Year === year})
            console.log(tableData);
            console.log(year);
            draw(dataset, year);
            draw_table(tableData, year)
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
}
var q = queue(1);
q.defer(d3.csv, "./data/yearly_teams.csv");
q.defer(d3.csv, "./data/top_scores.csv");
q.awaitAll(drawVisualization);       

