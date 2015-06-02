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

# change working directory
os.chdir("C:/Users/Bobby/Documents/premier_league")

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
csv_writer("stadiums.csv", data = location_details_teams) 

teams_per_year = pd.read_csv("yearly_teams.csv", sep = ",")

def get_player_nationality_2001(url, teams_per_year):
    # Take only the teams till 2001
    filter = (teams_per_year.Year <= 2001)
    teams_per_year = teams_per_year[filter]
   
    root_url = "http://en.wikipedia.org/wiki/"
    premier_league_start_year = 1992
    premier_league_end_year = 2002
    premier_league_duration = premier_league_end_year - premier_league_start_year
    
    # get all the years as a list of strings
    years = [str(premier_league_start_year + year) + '–' + \
        str(premier_league_start_year + 1 + year)[2:4] \
        for year in range(premier_league_duration)]
    
    years[7] = str(1999) + '-' + str(2000)
           
    # get how many teams per year there are
    grouped = teams_per_year.groupby('Year').count()
    grouped['cum_sum'] = grouped['Team'].cumsum()
    
    # Use a mapping function to change every team to appropriate url
    f = lambda x: x.replace(" ", "_")       
    teams_per_year['Team'] = teams_per_year['Team'].map(f)
    
    for index, item in enumerate(teams_per_year['Team']):
        if item == "Wolverhampton_Wndrs":
            teams_per_year['Team'].ix[index] = "Wolverhampton_Wanderers"
         
    
    # make an extension that should be added to every url
    data = []
    count = 0
    value = 0
    year= 1992
    
    # AFC contains list of exceptions
    AFC = ['Leeds_United', 'Oldham_Athletic', 'Sunderland', \
    'Bradford_City', 'Hull_City', 'Swansea_City']
    
    while count < grouped['cum_sum'][2001]:
        # at first we have to increase value at 22 because of 22 teams
        # after 3 seasons, there are only 20 teams left
        if count < 66 and count > 0:
            if count % 22 == 0:
                value += 1
                year += 1
        elif count >= 66:
            print 'threshold reached'
            for item in grouped['cum_sum']:
                if count == item:
                    value += 1
                    year += 1
        print value
        if teams_per_year['Team'][count] in AFC:
            extension = "_A.F.C._season"
            link = root_url + years[value] + "_" + teams_per_year['Team'][0 + count] + extension
            print link      
            url = URL(link)
            dom = DOM(url.download(cached=True))
        else:
            extension = "_F.C._season"
            link = root_url + years[value] + "_" + teams_per_year['Team'][0 + count] + extension
            print link      
            url = URL(link)
            dom = DOM(url.download(cached=True))               
        
        # get player nationality. The following conditions are used
        # to comply with the years 1992 / 1993. At first a few exceptions to
        # the rules are stated
        nationality_per_team = []
        if link == "http://en.wikipedia.org/wiki/1998%E2%80%9399_West_Ham_United_F.C._season":
            for index, element in enumerate(dom('p+ table .thumbborder')):
                nationality_per_team.append(element.attrs['alt']) 
   
        elif link == "http://en.wikipedia.org/wiki/2001%E2%80%9302_Arsenal_F.C._season":
            for index, element in enumerate(dom('.vcard td .thumbborder')):
                nationality_per_team.append(element.attrs['alt'])
                
        elif link == "http://en.wikipedia.org/wiki/1998%E2%80%9399_West_Ham_United_F.C._season":
            for index, element in enumerate(dom('p+ table .thumbborder')):
                element.attrs['alt']

        else:
            for index, element in enumerate(dom('table tr[class="vcard agent"] span[class="flagicon"] img')):
                if index < 30:            
                    nationality_per_team.append(element.attrs['alt'])
            if not nationality_per_team or len(nationality_per_team) < 20 \
            or len(nationality_per_team) > 32:
                for index, element in enumerate(dom('.plainrowheaders td a')):
                    if 'title'in element.attrs:
                        nationality_per_team.append(element.attrs['title'])
                if not nationality_per_team or len(nationality_per_team) < 20 \
                or len(nationality_per_team) > 32:
                    for index, element in enumerate(dom('h2+ .wikitable .thumbborder')):
                        nationality_per_team.append(element.attrs['alt'])
                # conditions for Newcastle United until 1996
                if not nationality_per_team or len(nationality_per_team) < 20 \
                or len(nationality_per_team) > 32:
                    for index, element in enumerate(dom('dl+ .wikitable .thumbborder')):
                        if 'alt'in element.attrs:
                            nationality_per_team.append(element.attrs['alt'])
                # conditions for Arsenal until 1997
                if not nationality_per_team or len(nationality_per_team) < 20 \
                or len(nationality_per_team) > 32:
                    for index, element in enumerate(dom('.plainrowheaders .flagicon+ a')):
                        nationality_per_team.append(element.attrs['title'])                

                    
        print nationality_per_team
        
        for nat in nationality_per_team:
            data.append([teams_per_year['Team'].ix[count], year, nat])
      
        count += 1

teams_per_year = pd.read_csv("yearly_teams.csv", sep = ",")
def get_player_nationality_from_2002(url, teams_per_year):
    # Take only the teams from 2002
    filter = (teams_per_year.Year > 2001)
    teams_per_year = teams_per_year[filter]
    index = [i for i in range(len(teams_per_year))]
    teams_per_year = teams_per_year.set_index([index])
       
    root_url = "http://en.wikipedia.org/wiki/"
    premier_league_start_year = 2002
    premier_league_end_year = 2015
    premier_league_duration = premier_league_end_year - premier_league_start_year
    
    # get all the years as a list of strings
    years = [str(premier_league_start_year + year) + '–' + \
        str(premier_league_start_year + 1 + year)[2:4] \
        for year in range(premier_league_duration)]
           
    # get how many teams per year there are
    grouped = teams_per_year.groupby('Year').count()
    grouped['cum_sum'] = grouped['Team'].cumsum()
    
    # Use a mapping function to change every team to appropriate url
    f = lambda x: x.replace(" ", "_")       
    teams_per_year['Team'] = teams_per_year['Team'].map(f)
    
    for index, item in enumerate(teams_per_year['Team']):
        if item == "Wolverhampton_Wndrs":
            teams_per_year['Team'].ix[index] = "Wolverhampton_Wanderers"
    
    # make an extension that should be added to every url
    data2 = []
    count = 0
    value = 0
    year= 2002
    
    # AFC contains list of exceptions
    AFC = ['Leeds_United', 'Oldham_Athletic', 'Sunderland', \
    'Bradford_City', 'Hull_City', 'Swansea_City']
    
    while count < grouped['cum_sum'][2014]:
    #while count < 180:
        if count >= 20:
            print 'threshold reached'
            for item in grouped['cum_sum']:
                if count == item:
                    value += 1
                    year += 1
        print value
        if teams_per_year['Team'][count] in AFC:
            extension = "_A.F.C._season"
            link = root_url + years[value] + "_" + teams_per_year['Team'][0 + count] + extension
            print link      
            url = URL(link)
            dom = DOM(url.download(cached=True))
        else:
            extension = "_F.C._season"
            link = root_url + years[value] + "_" + teams_per_year['Team'][0 + count] + extension
            print link      
            url = URL(link)
            dom = DOM(url.download(cached=True))               
        
        # get player nationality. The following conditions are used
        # to comply with the years 1992 / 1993. At first a few exceptions to
        # the rules are stated
        nationality_per_team = []
        if link == "http://en.wikipedia.org/wiki/2002%E2%80%9303_Middlesbrough_F.C._season" \
        or link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Everton_F.C._season":
            for index, element in enumerate(dom('.vcard .thumbborder')):
                if element.attrs['alt']:
                    nationality_per_team.append(element.attrs['alt'])
                
        elif link == "http://en.wikipedia.org/wiki/2003%E2%80%9304_Wolverhampton_Wanderers_F.C._season":
            for index, element in enumerate(dom('table td:nth-child(3) span[class="flagicon"] a')):
                nationality_per_team.append(element.attrs['title'])
                
        elif link == "http://en.wikipedia.org/wiki/2007%E2%80%9308_West_Ham_United_F.C._season":
            for index, element in enumerate(dom('table td:nth-child(3) span[class="flagicon"] a')):
                if index < 30:                
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/Bolton_Wanderers_F.C.":
            for index, element in enumerate(dom('.agent .thumbborder')):
                nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2007%E2%80%9308_Arsenal_F.C._season": 
            for index, element in enumerate(dom('.vcard td .thumbborder')):
                nationatliy_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Arsenal_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 57 and index < 93:
                    nationality_per_team.append(element.attrs['title'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Fulham_F.C._season":
            for index, element in enumerate(dom('.thumbborderr')):
                if index < 41:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Tottenham_Hotspur_F.C._season":
            for index, element in enumerate(dom('table td:nth-child(3) span[class="flagicon"] img')[::-1]):               
                if index > 9 and index < 42:                
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Manchester_City_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 110 and index < 145:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Portsmouth_F.C._season":
            for index, element in enumerate(dom('h4+ table .thumbborder')): 
                nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2010%E2%80%9311_Wigan_Athletic_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 49 and index < 84:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2010%E2%80%9311_Wolverhampton_Wanderers_F.C._season":
            for index, element in enumerate(dom('.thumbborder')): 
                if index < 46:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2007%E2%80%9308_Bolton_Wanderers_F.C._season":
            for index, element in enumerate(dom('.thumbborder')): 
                if index > 4 and index < 42:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2012%E2%80%9313_Queens_Park_Rangers_F.C._season":
                for index, element in enumerate(dom('.thumbborder')): 
                    if index < 21 and index % 2 ==0 or index > 20 and index < 48 and index % 2 != 0:
                        nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2014%E2%80%9315_Manchester_City_F.C._season":
            for index, element in enumerate(dom('.thumbborder')): 
                if index > 71 and index < 104:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2014%E2%80%9315_Burnley_F.C._season":
            for index, element in enumerate(dom('.flagicon+ a')): 
                nationality_per_team.append(element.attrs['title'])
        elif link == "http://en.wikipedia.org/wiki/2013%E2%80%9314_Aston_Villa_F.C._season":
            for index, element in enumerate(dom('.thumbborder')): 
                if index < 37:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2011%E2%80%9312_West_Bromwich_Albion_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 37:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2010%E2%80%9311_Queens_Park_Rangers_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 84 and index % 2 == 0:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Middlesbrough_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                 if index > 29 and index < 63:
                     nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2007%E2%80%9308_Manchester_City_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 233 and index < 266:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2005%E2%80%9306_Middlesbrough_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > -1 and index < 38:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2011%E2%80%9312_Manchester_City_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 77:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/Wolverhampton_Wanderers_F.C.":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 30:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2014%E2%80%9315_Chelsea_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 23 and index % 2 != 0 and index < 65:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2005%E2%80%9306_Wigan_Athletic_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 23:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2006%E2%80%9307_Arsenal_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 29:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2007%E2%80%9308_Birmingham_City_F.C._season":
            for index, element in enumerate(dom('.flagicon+ a')):
                nationality_per_team.append(element.attrs['title'])
        elif link == "http://en.wikipedia.org/wiki/2007%E2%80%9308_Middlesbrough_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 36 and index < 72:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_Everton_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 32:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2008%E2%80%9309_West_Ham_United_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index < 39:
                    nationality_per_team.append(element.attrs['alt'])
        elif link == "http://en.wikipedia.org/wiki/2010%E2%80%9311_Manchester_City_F.C._season":
            for index, element in enumerate(dom('.thumbborder')):
                if index > 84 and index < 120:
                    nationality_per_team.append(element.attrs['alt'])

            
                    

        else:
            for index, element in enumerate(dom('table tr[class="vcard agent"] span[class="flagicon"] img')):
                if index < 30:            
                    nationality_per_team.append(element.attrs['alt'])
            if not nationality_per_team or len(nationality_per_team) < 20 \
            or len(nationality_per_team) > 32:
                for index, element in enumerate(dom('.plainrowheaders td a')):
                    if 'title'in element.attrs:
                        nationality_per_team.append(element.attrs['title'])
                if not nationality_per_team or len(nationality_per_team) < 20 \
                or len(nationality_per_team) > 32:
                    for index, element in enumerate(dom('h2+ .wikitable .thumbborder')):
                        nationality_per_team.append(element.attrs['alt'])
                # conditions for Newcastle United until 1996
                if not nationality_per_team or len(nationality_per_team) < 20 \
                or len(nationality_per_team) > 32:
                    for index, element in enumerate(dom('dl+ .wikitable .thumbborder')):
                        if 'alt'in element.attrs:
                            nationality_per_team.append(element.attrs['alt'])
                # conditions for Arsenal until 1997
                if not nationality_per_team or len(nationality_per_team) < 20 \
                or len(nationality_per_team) > 32:
                    for index, element in enumerate(dom('.plainrowheaders .flagicon+ a')):
                        nationality_per_team.append(element.attrs['title'])                

                    
        print nationality_per_team

        for nat in nationality_per_team:
            data2.append([teams_per_year['Team'].ix[count], year, nat])
      
        count += 1    
    

















csv_writer("test.csv", data = years)          
    
url = "http://en.wikipedia.org/wiki/2010%E2%80%9311_Manchester_City_F.C._season"
url = URL(url)
dom = DOM(url.download(cached=True))

for index, element in enumerate(dom('.thumbborder')):
    if index > 84 and index < 120:
        element.attrs['alt']

url = "http://en.wikipedia.org/wiki/2007%E2%80%9308_Middlesbrough_F.C._season"
url = URL(url)
dom = DOM(url.download(cached=True))

for index, element in enumerate(dom('.thumbborder')):
    if index < 32:
        element.attrs['alt']
    if index < 38:
        element.attrs['alt']
.plainrowheaders .thumbborder

for i in test:
    print i
a = test[0]
print a[0]('alt')

url = "http://www.transfermarkt.co.uk/"
url = URL(url)
dom = DOM(url.download(cached=True))
dom.content
    
for i in test:
    print i('img')[0].attrs("alt")
    "\n"
    "\n"
    
for index, element in enumerate(dom('tr:nth-child(3) td:nth-child(2) span img')):
    try:    
        print element.attrs("alt")
    except TypeError:
        pass