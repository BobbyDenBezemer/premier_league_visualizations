### reads in data in multiple Dataframes
import pandas as pd
import os
import csv
import json
import pattern
from pattern.web import URL, DOM, abs
import requests
from urllib2 import URLError
from httplib import BadStatusLine
from requests.exceptions import HTTPError, ConnectionError
import re

# change working directory
# os.chdir("C:/Users/Bobby/Documents/premier_league")

def wage_data_reader(filename, seperator):
    """
    Function that reformats the very naughty data format in which I retrieved
    the data to a workable format
    """
    data = []
    count = 1
    season = 2000
    with open(filename, 'rU') as csvfile:
        reader = csv.reader(csvfile, delimiter= seperator)
        
        # first append a header to our data object
        data.append(['Team', 'Wage_bill', 'Rank','Num_points', 'Season'])
        # loop over the rows. Skip the first iteration
        for i, row in enumerate(reader):
            if i == 0:
                pass
            # Skip every 22nd iteration as this is an ugly header format
            elif i == (22 * count):
                pass
                count += 1
                season += 1
            else:
                # filter the row on lines with empty strings
                row = filter(None, row[0:4])
                if row:
                    row.append(str(season))
                    data.append(row)
    return data

def csv_writer(filename, data):
    """
    Function that writes nested lists to a csv file
    """
    with open(filename, "wb") as f:
        writer = csv.writer(f)
        writer.writerows(data)

data = wage_data_reader(filename = "wage_data.csv", seperator = ";")        
csv_writer("wages_data.csv", data = data)

def get_premier_league_teams(root_url, premier_league_start_year, premier_league_end_year):
    """
    Function takes a root_url and premier league start and end year
    and scrapes all the teams that participated per year from statto.com
    """

    teams = [['Team', 'Year']]
    premier_league_duration = premier_league_end_year - premier_league_start_year
    
    # get all the years as a list of strings
    years = [str(premier_league_start_year + year) + '-' + \
        str(premier_league_start_year + 1 + year) \
        for year in range(premier_league_duration)] 
    
    data = []
    # keep going until you have all the teams per year
    while len(years) > 0:
        # get url
        sub_url = years.pop(0)
        url = URL(root_url + sub_url) 
        print url
        
        # empty list and download the html page         
        dom = DOM(url.download(cached=True))
        
        # get all the teams per year
        teams = []
        for team in dom('.league-table-mini td:nth-child(2) a'):
            teams.append(team.content)
            
            
        points = []
        for index, point in enumerate(dom('.league-table-mini tr')):
            for td in point('td')[4:5]:
                points.append(td.content)
        data.append(['Teams', 'Season', 'Points']) 
        
        # zip takes two lists and loops over them
        for team, point in zip(teams, points):
            data.append([team, sub_url[0:4], point])
        
    return data
        
teams_1992_2015 = get_premier_league_teams(root_url = "http://www.statto.com/football/stats/england/premier-league/", \
premier_league_start_year = 1992, premier_league_end_year = 2015)
csv_writer("./data/yearly_teams.csv", data = teams_1992_2015)

def get_location_details(url):
    """
    Function takes the url to get the stadium data from (long, lat and capacity)
    """
    url = URL(url)
    dom = DOM(url.download(cached=True))
    
    teams = [['Stadium', 'Team', 'Capacity', 'Latitude', 'Longitude']]
    
    for team in dom('.stadiumsTable tbody tr'):
        details = []
        for index, cell in enumerate(team):
            if index == 0:
                details.append(cell('a')[0].content)
            else:
                details.append(cell.content)
        teams.append(details)
        
    return teams

location_details_teams = get_location_details(url = "http://www.doogal.co.uk/FootballStadiums.php")
stadiums = pd.read_csv("stadiums.csv")
teams = pd.read_csv("yearly_teams.csv")

def merge_teams_location(teams, stadiums):
    """
    Merges 2 data frames
    """
    stadium_teams = pd.merge(teams, stadiums, how = "inner", \
                left_on = "Teams", right_on = "Team" )
    stadium_teams['Capacity'] = stadium_teams['Capacity'].str.replace(',', '')
    return stadium_teams

stadium_teams = merge_teams_location(teams, stadiums)
stadium_teams.to_csv("stadium_teams.csv", index = False)

def extract_league_scores(url):
    url = "https://en.wikipedia.org/wiki/List_of_top_Premier_League_goal_scorers_by_season#1993.E2.80.9394"
    url = URL(url)
    dom = DOM(url.download(cached=True))

    data = []
    scorers = []
    # append column names
    # data.append()
    # extract the top 5 players each year
    start_year = 1992
    for year in dom('table[class="wikitable"]'):
        for index, player in enumerate(year('tr')):
            if index < 6 and index > 0:
                for index2, element in enumerate(player('td')[1:4]):
                    print index2
                    if index2 == 0 or index2 == 1:
                        try:  
                            scorers.append(element('a')[1].content)
                        except IndexError:
                            try:
                                scorers.append(element('a').content)
                            except AttributeError:
                                scorers.append(element.content)
                    else:
                        scorers.append(element.content)
                        scorers.append(str(start_year))
            scorers = []
            data.append(scorers)
        start_year = start_year + 1
    # properly edit the data. Filter out empty lists
    cleanr =re.compile('<.*?>')
    new_data = []
    for element in data:
        if element:
            new_data.append(element)
        else:
            pass
    clean_scores = []
    data = []
    data.append(['Name', 'Team', 'Goals', 'Year'])
    for element in new_data:
        for value in element:
            cleantext = re.sub(cleanr,'', value)
            clean_scores.append(cleantext)
        if clean_scores:
            data.append(clean_scores)
        else:
            pass
        clean_scores = []
                
                
    
    return data
    
top_scorers = extract_league_scores("https://en.wikipedia.org/wiki/List_of_top_Premier_League_goal_scorers_by_season#1993.E2.80.9394")
csv_writer("top_scores.csv", top_scorers)

# Extract team names
def scrape_transfermarkt(root_url, start_year, end_year):
    """
    Crawler that crawls transfermarkt.co.uk for the nmber of foreign player
    per team and the market capitalization of teams in the premier league
    """
    
    # number of pges to crawl
    premier_league_duration = end_year - start_year
    
    # get all the years as a list of strings
    years = [str(start_year + year) 
        for year in range(premier_league_duration)]
            
    data = []
    data.append(['Year', 'Team', 'Num_players', 'Av_Age', 'Num_foreign', 'Market_value'])
    # keep going until you have all the teams per year
    while len(years) > 0:
        # get url
        sub_url = years.pop(0)
        url = URL(root_url + sub_url) 
        print url
        
        # empty list and download the html page         
        dom = DOM(url.download(cached=True))
        
        # get all the teams per year
        teams = []
        num_player = []
        av_age = []
        num_foreign = []
        market_value = []
            
        for index1, item in enumerate(dom('table[class="items"] tbody tr')):
            if index1 < 20:
                for index, team in enumerate(item('td')):
                    if index == 0:
                        teams.append(team('img')[0].attr['alt'])
                    elif index == 3:
                        num_player.append(team('a')[0].content)
                    elif index == 4:
                        av_age.append(team.content)
                    elif index == 5:
                        num_foreign.append(team.content)
                    elif index == 6:
                        market_value.append(team('a')[0].content)
        
        # Make sure it is put in the right format whre every nested list is a row
        for a,b,c,d,e in zip(teams, num_player, av_age, num_foreign, market_value):
            data.append([sub_url, a, b, c, d, e])
            
    return data
    
data = scrape_transfermarkt(start_year = 1992, \
    end_year = 2015, \
    root_url = "http://www.transfermarkt.co.uk/premier-league/startseite/wettbewerb/GB1/plus/?saison_id=")

# Now edit the data in such a way that we can work with it in d3
csv_writer("nationality_market.csv", data = data)  
data = pd.read_csv("nationality_market.csv")

# Convert av_age column
# Use a mapping function
f = lambda x: x.replace(",", ".")       
data['Av_Age'] = data['Av_Age'].map(f)

# Replace missing market value by 0
f = lambda x: x.replace('-', "0")
data['Market_value'] = data['Market_value'].map(f)

# Calculate percentage foreign players per team
data['Perc_foreign'] = ((data['Num_foreign'] / data['Num_players']) * 100).round(2)

# Now let's group the dataframe by Year and calculate general average across years
import numpy as np
data_average = data.groupby('Year')
data_average = data_average.agg({'Perc_foreign': np.mean})
data_average.columns = ['Average']


# Now make a dataset with mean of each year
data_average_team_year = data[['Year', 'Team', 'Perc_foreign']]
data_wide = data_average_team_year.pivot('Year', 'Team', 'Perc_foreign')
data_wide['Average'] = data_average['Average']

# Data is in wide format. Let's now trn it back to long format
#data_long = pd.melt(test, id_vars = ['Team'])
data_long = data_wide.unstack('Team')
data_long = pd.DataFrame(data_long)
data_long.reset_index(inplace=True)
data_long.columns = ['Team', 'Year', 'Perc_foreign']

# now replace some last values
f = lambda x: x.replace(" FC", "") 
data_long['Team'] = data_long['Team'].map(f)
f = lambda x: x.replace(" AFC", "")
data_long['Team'] = data_long['Team'].map(f)
data_long.to_csv("perc_foreign.csv", index = False)
    

                

            