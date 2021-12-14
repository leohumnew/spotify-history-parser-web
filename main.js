let fileReader = new FileReader();
let contentArray = null;
document.getElementById("fileResults").style.display = "none";

function changeDate() {
    document.getElementById("changeDateDiv").style.display = "none";
    document.getElementById("dateType").value = "def";
    document.getElementById("dateTypeDiv").style.display = "revert";
}
function readFile(input) {
    let file = input.files[0];
    fileReader.readAsText(file);
    fileReader.onload = function() {
        try {
            document.getElementById("selectButtonDiv").style.display = "none";
            document.getElementById("dateTypeDiv").style.display = "revert";
            contentArray = JSON.parse(fileReader.result);
        } catch (err) {
            alert('Invalid JSON provided. Reload & make sure to choose the StreamingHistory_.json file.');
        }
    };
    fileReader.onerror = function() {
        alert('Invalid file provided. Reload & make sure to choose the StreamingHistory_.json file.');
    };
}
function chooseDateType(choice) {
    document.getElementById("dateTypeDiv").style.display = "none";
    if(choice == "allTime") analyzeFile(0,0);
    else if(choice == "lastYear") analyzeFile(-1,0);
    else {
        document.getElementById("startDate").value = "";
        document.getElementById("startDateDiv").style.display = "revert";
        document.getElementById("startDate").setAttribute("min", contentArray[0]["endTime"].substring(0, 10));
        document.getElementById("startDate").setAttribute("max", contentArray[contentArray.length-1]["endTime"].substring(0, 10));
    }
}
let startDate;
function setStartDate(choice) {
    startDate = choice;
    document.getElementById("endDate").setAttribute("min", startDate);
    document.getElementById("endDate").setAttribute("max", contentArray[contentArray.length-1]["endTime"].substring(0, 10));
    document.getElementById("startDateDiv").style.display = "none";
    document.getElementById("endDate").value = "";
    document.getElementById("endDateDiv").style.display = "revert";
}
function setEndDate(choice) {
    document.getElementById("endDateDiv").style.display = "none";
    analyzeFile(new Date(startDate.substring(0,10)), new Date(choice.substring(0,10)));
}


var loaded = false;
var dateArray = [];
var dateArrayTimes = [];
var mostSeconds = 0;

function analyzeFile(start, end) {
    const songList = document.getElementById("songList");
    const listenTimeText = document.getElementById("listenTime");
    const timeDistributionChart = document.getElementById("timeDistribution");
    const dateDistributionLabels = document.getElementById("dateDistributionLabels");
    const dateDistributionChart = document.getElementById("dateDistribution");

    while(songList.firstChild) songList.removeChild(songList.firstChild);
    while(timeDistributionChart.firstChild) timeDistributionChart.removeChild(timeDistributionChart.firstChild);
    while(dateDistributionChart.firstChild) dateDistributionChart.removeChild(dateDistributionChart.firstChild);
    while(dateDistributionLabels.firstChild) dateDistributionLabels.removeChild(dateDistributionLabels.firstChild);

    let songArray = [];
    let sortedSongIndecesArray = [];
    let repetitionArray = [];
    let singerIndecesArray = [];
    let singerArray = [];
    let singerTimeArray = [];
    let sortedSingerIndecesArray = [];

    let totalTime = 0;
    let timeDistribution = new Array(24).fill(0);
    let months = ["0", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    loaded = false;
    dateArray = [];
    dateArrayTimes = [];
    mostSeconds = 0;

    let firstIndex = 0, lastIndex = contentArray.length;
    if(end != 0) {
        for (let i = 0; i < contentArray.length; i++){
            if(new Date(contentArray[i]["endTime"].substring(0,10)) >= start) {
                firstIndex = i;
                break;
            }
        }
        for (let i = contentArray.length-1; i >= 0; i--){
            if(new Date(contentArray[i]["endTime"].substring(0,10)) <= end) {
                lastIndex = i+1;
                break;
            }
        }
        if(lastIndex <= firstIndex) {
            document.getElementById("noDataText").style.display = "block";
            document.getElementById("explanationText").style.display = "none";
            return 1;
        }
    } else if (start == -1) {
        start = new Date(contentArray[contentArray.length - 1]["endTime"].substring(0,10));
        start.setFullYear(start.getFullYear() - 1);

        for (let i = 0; i < contentArray.length; i++){
            if(new Date(contentArray[i]["endTime"].substring(0,10)) >= start) {
                firstIndex = i;
                break;
            }
        }
    }

    // Loop through all songs in file and save them to an object
    for (let i = firstIndex; i < lastIndex; i++) {
        let song = contentArray[i];
        totalTime += song["msPlayed"];
        timeDistribution[parseInt(song["endTime"].substring(11,13))] += Math.round(song["msPlayed"]/1000);

        if(dateArray.indexOf(song["endTime"].substring(0,7)) === -1) {
            dateArray.push(song["endTime"].substring(0,7));
            dateArrayTimes.push(0);
        }
        dateArrayTimes[dateArray.indexOf(song["endTime"].substring(0,7))] += Math.round(song["msPlayed"]/1000);

        if (singerArray.indexOf(song["artistName"]) == -1) {
            singerArray.push(song["artistName"]);
            singerTimeArray.push(0);
        }

        if (songArray.indexOf(song["trackName"]) == -1) {
            songArray.push(song["trackName"]);
            singerIndecesArray.push(singerArray.indexOf(song["artistName"]));
            repetitionArray.push(0);
        }

        singerTimeArray[singerIndecesArray[songArray.indexOf(song["trackName"])]] += Math.round(song["msPlayed"]/1000);

        if (song["msPlayed"] > 2000) {
            repetitionArray[songArray.indexOf(song["trackName"])] += 1;
        }
    }

    // Populate array with song indeces sorted by number of times listened to
    sortedSongIndecesArray = Array.from(Array(repetitionArray.length).keys())
      .sort((a, b) => repetitionArray[b] - repetitionArray[a]);

    sortedSingerIndecesArray = Array.from(Array(singerTimeArray.length).keys())
      .sort((a, b) => singerTimeArray[b] - singerTimeArray[a]);

    // Loop through sorted array and add top # to unordered list
    for (let i = 0; i < 20; i++) {
        let node = document.createElement('li');
        node.innerHTML = songArray[sortedSongIndecesArray[i]] + "  (<i>" + singerArray[singerIndecesArray[sortedSongIndecesArray[i]]] + "</i>) <span style='float: right;'><b>" + repetitionArray[sortedSongIndecesArray[i]] + "</b></span>";
        songList.appendChild(node);
    }

    // Stats
    listenTimeText.innerHTML = "Total listen time: " + Math.round(totalTime/60000) + " min / " + Math.round(totalTime/60000/6)/10 + " hours";

    // Set up time distribution graph
    let maxTimeInHour = 0;
    for (let i = 0; i < 24; i++) {
        if(timeDistribution[i] > maxTimeInHour) maxTimeInHour = timeDistribution[i];
    }
    for (let i = 0; i < 24; i++) {
        timeDistributionChart.innerHTML += "<div class='bar' style='height:" + Math.round(timeDistribution[i] * 180 / maxTimeInHour) +"px'></div>";
    }



    // Overview
    document.getElementById("topSong").innerHTML = songArray[sortedSongIndecesArray[0]] + "<br><span style='font-size:0.75em'>Played " + repetitionArray[sortedSongIndecesArray[0]] + " times</span>";
    document.getElementById("topArtist").innerHTML = singerArray[sortedSingerIndecesArray[0]] + "<br><span style='font-size:0.75em'>Listened to for " + Math.round(singerTimeArray[sortedSingerIndecesArray[0]]/60) + " minutes</span>";

    getSpotifyCredentials(songArray[sortedSongIndecesArray[0]], singerArray[singerIndecesArray[sortedSongIndecesArray[0]]], singerArray[sortedSingerIndecesArray[0]]);

    getWikipediaInformation(singerArray[sortedSingerIndecesArray[0]], singerArray, sortedSingerIndecesArray);


    document.getElementById("explanationText").style.display = "none";
    document.getElementById("changeDateDiv").style.display = "revert";
    document.getElementById("fileResults").style.visibility = "visible";
    document.getElementById("fileResults").style.display = "";

    // Set up date distribution graph
    dateDistributionLabels.style.setProperty("--month-count", dateArray.length);
    dateDistributionChart.style.setProperty("--month-count", dateArray.length);
    for (let i = 0; i < dateArray.length; i++) if(dateArrayTimes[i] > mostSeconds) mostSeconds = dateArrayTimes[i];
    for (let i = 0; i < dateArray.length; i++) {
        if(dateArray[i].substring(5,7) == "01" || i == 0 || i == dateArray.length - 1)dateDistributionLabels.innerHTML += "<p>" + months[parseInt(dateArray[i].substring(5,7))] + "<br>" + dateArray[i].substring(0,4) + "</p>";
        else dateDistributionLabels.innerHTML += "<p>" + months[parseInt(dateArray[i].substring(5,7))] + "</p>";

        let pointHeight = dateArrayTimes[i] * dateDistributionChart.clientHeight / mostSeconds;
        let hyp = Math.sqrt(Math.pow(dateDistributionChart.clientWidth/dateArray.length, 2) + Math.pow((dateArrayTimes[i+1] - dateArrayTimes[i]) * dateDistributionChart.clientHeight / mostSeconds, 2));
        let deg = Math.asin(((dateArrayTimes[i] - dateArrayTimes[i+1]) * dateDistributionChart.clientHeight / mostSeconds) / hyp) * (180 / Math.PI);
        dateDistributionChart.innerHTML += "<div style='position:relative;'> <div class='point' style='margin-top: "+ (dateDistributionChart.clientHeight-pointHeight) +"px'></div> <div class='point-line' style='--hyp:" + hyp + ";--angle:" + deg + "'></div> </div>"
    }

    loaded = true;
}

//Get Spotify credentials
async function getSpotifyCredentials(topSong, topSongArtist, topArtist) {
    let response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": 'Basic NzlkYzdhM2FjYzFkNDg2YTk3MjYyNTBhMzBjMDgwYzY6OGU3ZGM5NDFkN2VkNDQ3ZmIyZGJkNTg5ZjcwZjEyNTU=',
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
        body: "grant_type=client_credentials"
    });
    if(response.ok) {
        let json = await response.json();
        makeSearches(json.access_token, topSong, topSongArtist, topArtist);
    }
}

// Search spotify images
async function makeSearches(t, topSong, topSongArtist, topArtist) {
    let response = await fetch("https://api.spotify.com/v1/search?q=track%3A"+ encodeURIComponent(topSong) +"+artist%3A"+ encodeURIComponent(topSongArtist) +"&type=track&limit=1", {
        headers: {
            "Authorization": 'Bearer ' + t
        }
    });
    if(response.ok) {
        let json = await response.json();
        document.getElementById("topSongImage").src = json.tracks.items[0].album.images[1].url;
    }

    let response2 = await fetch("https://api.spotify.com/v1/search?q=artist%3A" + encodeURIComponent(topArtist) + "&type=artist&limit=1", {
        headers: {
            "Authorization": 'Bearer ' + t
        }
    });
    if(response2.ok) {
        let json = await response2.json();
        document.getElementById("topArtistImage").src = json.artists.items[0].images[1].url;
    }
}

async function getWikipediaInformation(artist, singerArray, sortedSingerIndecesArray) {
    try {
        const countryList = document.getElementById("artistOriginList");
        const ageDistributionChart = document.getElementById("ageDistribution");
        while(ageDistributionChart.firstChild) ageDistributionChart.removeChild(ageDistributionChart.firstChild);
        while(countryList.firstChild) countryList.removeChild(countryList.firstChild);

        document.getElementsByClassName("wikidataDiv")[0].style.visibility = "hidden";
        document.getElementsByClassName("wikidataDiv")[1].style.visibility = "hidden";
        document.getElementsByClassName("wikidataLoader")[0].style.visibility = "visible";
        document.getElementsByClassName("wikidataLoader")[1].style.visibility = "visible";

        const errorCorrectionBefore = ["Alan Walker", "Sia", "MARINA", "Halsey", "Bastille", "P!nk", "BANNERS", "Céline Dion", "JP Saxe", "Rutger Zuydervelt", "Sub Urban", "NF"];
        const errorCorrectionAfter = ["Alan Walker (music producer)", "Sia (musician)", "Marina Diamandis", "Halsey (singer)", "Bastille (band)", "Pink (singer)", "Banners (musician)", "Celine Dion", "JP Saxe", "Machinefabriek", "Sub Urban (musician)", "NF (rapper)"];
        const alwaysLowercase = ["and", "at", "the", "of"];

        let queryString = "SELECT ?page ?birth ?locLabel WHERE{VALUES ?page{";
        for (let i = 0; (i < 50) && (i < singerArray.length); i++) {
            if(errorCorrectionBefore.indexOf(singerArray[sortedSingerIndecesArray[i]]) != -1) {
                queryString += '"' + errorCorrectionAfter[errorCorrectionBefore.indexOf(singerArray[sortedSingerIndecesArray[i]])] + '"@en';
            } else {
                const words = singerArray[sortedSingerIndecesArray[i]].split(" ");
                for (let i = 0; i < words.length; i++) {
                    if(alwaysLowercase.indexOf(words[i].toLowerCase()) == -1 || i == 0) {
                        if(words[i].toUpperCase() === words[i]) words[i] = words[i][0].toUpperCase() + words[i].substr(1).toLowerCase();
                        else words[i] = words[i][0].toUpperCase() + words[i].substr(1);
                    } else words[i] = words[i].toLowerCase();
                }
                queryString += '"' + words.join(" ") + '"@en';
            }
        }
        queryString += '}?sitelink schema:name ?page;schema:isPartOf <https://en.wikipedia.org/>;schema:about ?item.OPTIONAL{?item wdt:P27 ?loc.}OPTIONAL{?item wdt:P495 ?loc.}OPTIONAL{?item wdt:P569 ?birth.}OPTIONAL{?item wdt:P527 ?members. ?members wdt:P569 ?birth.}SERVICE wikibase:label{bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".}}';
        queryString = encodeURIComponent(queryString);
        let response = await fetch("https://query.wikidata.org/sparql?query=" + queryString + "&format=json&origin=*", {
            headers: {
                'User-Agent': 'SpotifyHistoryAnalyzer/0.8 (leohumnew.com/spotifyanalyzer;' + atob('bGVvaHVtbmV3QHByb3Rvbm1haWwuY29t') + ')'
            }
        });
        let json = await response.json();
        let artistInfo = json.results.bindings;
        let countries = [];
        let countryCount = [];
        // <20, 20-29, 30-39, 40-49, >49
        let ageCount = [0,0,0,0,0];
        let ageExtremesNames = ["",""];
        let ageExtremes = [0,0];

        if(artistInfo.length < 30){
            document.getElementsByClassName("warningLowData")[0].style.display = "block";
            document.getElementsByClassName("warningLowData")[1].style.display = "block";
        } else {
            document.getElementsByClassName("warningLowData")[0].style.display = "none";
            document.getElementsByClassName("warningLowData")[1].style.display = "none";
        }

        for(let i = 0; i < artistInfo.length; i++) {
            try{
                if(countries.indexOf(artistInfo[i].locLabel.value) == -1) {
                    countries.push(artistInfo[i].locLabel.value);
                    countryCount.push(1);
                } else {
                    countryCount[countries.indexOf(artistInfo[i].locLabel.value)] += 1;
                }
                let age = 0;
                if(artistInfo[i].birth.value.length >= 10)age = Math.floor((new Date() - new Date(artistInfo[i].birth.value.substring(0,10))) / 31557600000);
                else age = Math.floor((new Date() - new Date(artistInfo[i].birth.value.substring(0,4), 0, 1)) / 31557600000);
                if(age < ageExtremes[0] || i == 0){
                    ageExtremes[0] = age;
                    ageExtremesNames[0] = artistInfo[i].page.value;
                }
                if(age > ageExtremes[1]){
                    ageExtremes[1] = age;
                    ageExtremesNames[1] = artistInfo[i].page.value;
                }
                if(age < 20) ageCount[0]++;
                else if(age < 30) ageCount[1]++;
                else if(age < 40) ageCount[2]++;
                else if(age < 50) ageCount[3]++;
                else  ageCount[4]++;
            } catch(err) {
                console.log("Missing age or birthplace for artist");
            }
        }
        document.getElementById("youngestText").innerHTML = "Youngest Artist: " + ageExtremesNames[0] + " (" + ageExtremes[0] + ")";
        document.getElementById("oldestText").innerHTML = "Oldest Artist: " + ageExtremesNames[1] + " (" + ageExtremes[1] + ")";

        // Make country list
        let sortedCountriesIndeces = Array.from(Array(countryCount.length).keys())
          .sort((a, b) => countryCount[b] - countryCount[a]);
        for(let i = 0; i < 7 && i < sortedCountriesIndeces.length; i++){
            countryList.innerHTML += "<li>" + countries[sortedCountriesIndeces[i]] + "<span style='float: right;'><b>" + countryCount[sortedCountriesIndeces[i]] + "</b></span></li>";
        }

        // Make age chart
        let maxAgeCount = 0;
        for (let i = 0; i < 5; i++) {
            if(ageCount[i] > maxAgeCount) maxAgeCount = ageCount[i];
        }
        for (let i = 0; i < 5; i++) {
            ageDistributionChart.innerHTML += "<div class='bar' style='height:" + Math.round(ageCount[i] * 180 / maxAgeCount) +"px'></div>";
        }

        document.getElementsByClassName("wikidataLoader")[0].style.visibility = "hidden";
        document.getElementsByClassName("wikidataLoader")[1].style.visibility = "hidden";
        document.getElementsByClassName("wikidataDiv")[0].style.visibility = "visible";
        document.getElementsByClassName("wikidataDiv")[1].style.visibility = "visible";
    } catch(err) {
        console.log("Error on Wikidata search: " + err);
    }
}


// Recalculate time distribution by date chart when window size changed
window.addEventListener('resize', function(event){
    if(loaded) {
        let dateDistributionChart = document.getElementById("dateDistribution");
        let children = dateDistributionChart.children;
        for (let i = 0; i < children.length; i++) {
            let hyp = Math.sqrt(Math.pow(dateDistributionChart.clientWidth/dateArray.length, 2) + Math.pow((dateArrayTimes[i+1] - dateArrayTimes[i]) * dateDistributionChart.clientHeight / mostSeconds, 2));
            let deg = Math.asin(((dateArrayTimes[i] - dateArrayTimes[i+1]) * dateDistributionChart.clientHeight / mostSeconds) / hyp) * (180 / Math.PI);
            children[i].children[1].style.setProperty("--angle", deg);
            children[i].children[1].style.setProperty("--hyp", hyp);
        }

    }
});