# programming_final_project
Directory contains all the material for the final programming project of the minor programming at the University of Amtsterdam.

# Proposal

## Introduction
The Premier League is the most-watched football league in the world, broadcast in 212 territories to 643 million homes and a potential TV audience of 4.7 billion people (Ebner, 2013). Its inception took place in 1992. Since then, 47 teams have competed in the league. 

This data visualization will deal with football data on the English premier league that has been collected by webscraping, webcrawling and through a reddit blog. The visualization will tell the story of the premier league since its inception by highlighting 5 points:

- Premier league team rankings
- The dispersion of premier league teams throughout the UK
- Premier league wage expenses
- Premier league transfer expenses
- Nationality of premier league players

## Premier league team rankings
Premier league team rankings are scraped from statto.com. The data is then put into long format. The long format consists of 3 columns, a year column, a team column and a points column. 

The data are visualized using an interactive bar chart. The user can select a given year from a drop down menu. Based on the year selected by the user, the data is reordered and displayed in descending order.

A second barchart on the right will show all the teams that have won the league since its inception including the amount of times that they have won the league.

## The dispersion of premier league teams throughout the UK
The second visualization, which is displayed below, will show a map of the UK with all the teams that have participated during a given year. The location of a team is determined by means of the lattitude and longitude of the location of the team. The size of the team is calculated using the stadium capacity of the team. This data is also scraped from the web. 

During a given year the visualization only shows those teams that have participated that given year within the league. Furthermore, the visualization also contains a drop down menu where you can select the given year that you want to be displayed on the map.

## Premier league wage expenses
The third visualization will consists of two interactive line graphs. The first line graph, the user will see the yearly average wage expense across teams. In the second line graph, the user can select a given team to be displayed. In both graphs the user can hover the lines after which a tooltip will pop up.

## Premier league transfer expenses
If I have time left, I will scrape transfer expenses data of all premier league teams from 1992-2015 from the website transfermarkt.co.uk. 

## Nationality of premier league players
I have webscraped the nationality of all premier league players since 1992 until 2015 from wikipedia. Unfortunately no other website, as far as I am aware of, contained this data. 

From this data a percentage of English players across teams will be calculated for each year. This will then be displayed in a linegraph. A second visualization will allow the user to pick a given nationality. This nationality is then shown logitudinally over the years.

One final visualization will show a map world map. It will allow the user to pick a given year through the dropdown menu. Each year will receive a colour depending on the proportion of premier league players that are from that country. Finally a user will be able to hover the country on which a tooltip will appear that displays to the user the proportion of players from the given country. 

## Time frame

The first week will dedicated to the following tasks:

- Writing the proposal
- Data acquisition
- Making a design document / prototype user interface
- Making the premier league teams rankings

The second week wil be dedicated to the following tasks:

- Making the visualization on the dispersion of premier league teams throughout the UK
- Making the visualization on the premier league wage expenses

The third week will be dedicated to the following tasks:

- Making the nationality of premier league players visualization
- Upgrading previous visualizations
- In case there is time, making the premier league transfer expenses visualization.
