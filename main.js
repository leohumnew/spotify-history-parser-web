let contentArray = [];
document.getElementById("fileResults").style.display = "none";

// Get file input
// Wrap filereader in promise
const readUploadedFileAsText = (inputFile) => {
    const temporaryFileReader = new FileReader();
  
    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(temporaryFileReader.error);
      };
      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result);
      };
      temporaryFileReader.readAsText(inputFile);
    });
};
// Loop over files calling readUploadedFileAsText promise for each one
async function readFile(i) {
    document.getElementById("selectButtonDiv").style.display = "none";

    for (let j = 0; j < i.files.length; j++) {
        try {
            contentArray = contentArray.concat(Object.values(JSON.parse(await readUploadedFileAsText(i.files[j]))));
        } catch (e) {
            console.warn(e.message);
            alert('Invalid file provided. Make sure to select your StreamingHistory_.json files only.');
        }
    }
    document.getElementById("dateTypeDiv").style.display = "revert";
}

// Set date
function changeDate() {
    document.getElementById("changeDateDiv").style.display = "none";
    document.getElementById("dateType").value = "def";
    document.getElementById("dateTypeDiv").style.display = "revert";
}
// Choose date type: 0,0 if all time, -1,0 if past year, -2,0 if past two months, otherwise prepare for custom selection
function chooseDateType(choice) {
    document.getElementById("dateTypeDiv").style.display = "none";
    if(choice == "allTime") analyzeFile(0,0);
    else if(choice == "pastYear") analyzeFile(-1,0);
    else if(choice == "past2Months") analyzeFile(-2,0);
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

// Analyze data and display in graphs
var loaded = false;
var dateArray = [];
var dateArrayTimes = [];
var mostSeconds = 0;

function analyzeFile(start, end) {
    // Set HTML elements to const variables
    const songList = document.getElementById("songList");
    const listenTimeText = document.getElementById("listenTime");
    const timeDistributionChart = document.getElementById("timeDistribution");
    const dateDistributionLabels = document.getElementById("dateDistributionLabels");
    const dateDistributionChart = document.getElementById("dateDistribution");
    const hours = document.getElementById("hours");

    // Make sure charts / lists are empty
    while(songList.firstChild) songList.removeChild(songList.firstChild);
    while(timeDistributionChart.firstChild) timeDistributionChart.removeChild(timeDistributionChart.firstChild);
    while(dateDistributionChart.firstChild) dateDistributionChart.removeChild(dateDistributionChart.firstChild);
    while(dateDistributionLabels.firstChild) dateDistributionLabels.removeChild(dateDistributionLabels.firstChild);
    while(hours.firstChild) hours.removeChild(hours.firstChild);
    document.getElementById("noDataText").style.display = "none";

    // Init variables
    let songArray = [];
    let sortedSongIndecesArray = [];
    let repetitionArray = [];
    let singerIndecesArray = [];
    let singerArray = [];
    let singerTimeArray = [];
    let sortedSingerIndecesArray = [];

    let totalTime = 0;
    let timeDistribution = new Array(24).fill(0);
    let months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    loaded = false;
    dateArray = [];
    dateArrayTimes = [];
    mostSeconds = 0;

    // Find start / end indeces
    let firstIndex = 0, lastIndex = contentArray.length;
    if(end != 0) { // If custom date range
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
            document.getElementById("changeDateDiv").style.display = "revert";
            document.getElementById("explanation1").style.display = "none";
            document.getElementById("explanation2").style.display = "none";
            return 1;
        }
        document.getElementById("dateRangeText").innerHTML = start.toDateString() + " - " + end.toDateString();
    } else if (start == -1) { // If past year
        start = new Date(contentArray[contentArray.length - 1]["endTime"].substring(0,10));
        start.setFullYear(start.getFullYear() - 1);
        document.getElementById("dateRangeText").innerHTML = start.toDateString() + " - " + new Date(contentArray[contentArray.length - 1]["endTime"].substring(0,10)).toDateString();

        for (let i = 0; i < contentArray.length; i++){
            if(new Date(contentArray[i]["endTime"].substring(0,10)) >= start) {
                firstIndex = i;
                console.log(i);
                break;
            }
        }
    } else if (start == -2) { // If past two months
        start = new Date(contentArray[contentArray.length - 1]["endTime"].substring(0,10));
        start.setDate(start.getDate() - 61);
        document.getElementById("dateRangeText").innerHTML = start.toDateString() + " - " + new Date(contentArray[contentArray.length - 1]["endTime"].substring(0,10)).toDateString();

        for (let i = 0; i < contentArray.length; i++){
            if(new Date(contentArray[i]["endTime"].substring(0,10)) >= start) {
                firstIndex = i;
                console.log(i);
                break;
            }
        }
    } else {
        document.getElementById("dateRangeText").innerHTML = new Date(contentArray[0]["endTime"].substring(0,10)).toDateString() + " - " + new Date(contentArray[contentArray.length - 1]["endTime"].substring(0,10)).toDateString();
    }

    // Loop through all songs in date range
    for (let i = firstIndex; i < lastIndex; i++) {
        let song = contentArray[i];
        let date = new Date(song["endTime"].substring(0,16)).toLocaleString();
        totalTime += song["msPlayed"]; // Increment total time
        timeDistribution[parseInt(date.substring(12,14))] += Math.round(song["msPlayed"]/1000); // Increment time for hourly time distribution graph

        if(dateArray.indexOf(date.substring(3,10)) === -1) { // If date is not in dateArray
            dateArray.push(date.substring(3,10));
            dateArrayTimes.push(0);
        }
        dateArrayTimes[dateArray.indexOf(date.substring(3,10))] += Math.round(song["msPlayed"]/1000); // Increment time for monthly time distribution graph

        if (singerArray.indexOf(song["artistName"]) == -1) { // Add artist to artist array if not already there and initialize artist listen time to 0
            singerArray.push(song["artistName"]);
            singerTimeArray.push(0);
        }

        if (songArray.indexOf(song["trackName"]) == -1) { // Add song to song array if not already there, add artist link to singer indeces array, and initialize song repetitions to 0
            songArray.push(song["trackName"]);
            singerIndecesArray.push(singerArray.indexOf(song["artistName"]));
            repetitionArray.push(0);
        }

        singerTimeArray[singerIndecesArray[songArray.indexOf(song["trackName"])]] += Math.round(song["msPlayed"]/1000); // Add listen time to relevant artist

        if (song["msPlayed"] > 2000) { // If song was played for more than 2 seconds, add repetition
            repetitionArray[songArray.indexOf(song["trackName"])] += 1;
        }
    }

    // Populate array with song indeces sorted by number of times listened to
    sortedSongIndecesArray = Array.from(Array(repetitionArray.length).keys())
      .sort((a, b) => repetitionArray[b] - repetitionArray[a]);

    sortedSingerIndecesArray = Array.from(Array(singerTimeArray.length).keys())
      .sort((a, b) => singerTimeArray[b] - singerTimeArray[a]);

    // Loop through sorted array and add top # to unordered list
    for (let i = 0; (i < 20) && (i < songArray.length); i++) {
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
    for (let i = 0; i < 10; i++) {
        if(i%2 == 0)hours.innerHTML += "<p>" + ("0"+i) + "</p>";
        else hours.innerHTML += "<p class='invisHour'>" + ("0"+i) + "</p>";
    }
    for (let i = 10; i < 24; i++) {
        if(i%2 == 0)hours.innerHTML += "<p>" + i + "</p>";
        else hours.innerHTML += "<p class='invisHour'>" + i + "</p>";
    }

    // Overview
    document.getElementById("topSong").innerHTML = songArray[sortedSongIndecesArray[0]] + "<br><span style='font-size:0.75em'>Played " + repetitionArray[sortedSongIndecesArray[0]] + " times</span>";

    getSpotifyCredentials(songArray[sortedSongIndecesArray[0]], singerArray[singerIndecesArray[sortedSongIndecesArray[0]]], singerArray, sortedSingerIndecesArray, singerTimeArray); // singerArray[sortedSingerIndecesArray[0]]

    getWikipediaInformation(singerArray, sortedSingerIndecesArray);


    document.getElementById("explanation1").style.display = "none";
    document.getElementById("explanation2").style.display = "none";
    document.getElementById("changeDateDiv").style.display = "revert";
    document.getElementById("fileResults").style.visibility = "visible";
    document.getElementById("fileResults").style.display = "";

    // Set up date distribution graph
    dateDistributionLabels.style.setProperty("--month-count", dateArray.length);
    dateDistributionChart.style.setProperty("--month-count", dateArray.length);
    for (let i = 0; i < dateArray.length; i++) if(dateArrayTimes[i] > mostSeconds) mostSeconds = dateArrayTimes[i];
    for (let i = 0; i < dateArray.length; i++) {
        if(dateArray[i].substring(0,2) == "01" || i == 0 || i == dateArray.length - 1)dateDistributionLabels.innerHTML += "<p>" + months[parseInt(dateArray[i].substring(0,2))] + "<br>" + dateArray[i].substring(3,7) + "</p>";
        else if(dateArray.length < 13) dateDistributionLabels.innerHTML += "<p>" + months[parseInt(dateArray[i].substring(0,2))] + "</p>";
        else dateDistributionLabels.innerHTML += "<p>" + months[parseInt(dateArray[i].substring(0,2))].substring(0,1) + "</p>";

        let pointHeight = (dateArrayTimes[i] * dateDistributionChart.clientHeight / mostSeconds) + 5;
        if (i < dateArray.length - 1) {
            let hyp = Math.sqrt(Math.pow(dateDistributionChart.clientWidth/dateArray.length, 2) + Math.pow((dateArrayTimes[i+1] - dateArrayTimes[i]) * dateDistributionChart.clientHeight / mostSeconds, 2));
            let deg = Math.asin(((dateArrayTimes[i] - dateArrayTimes[i+1]) * dateDistributionChart.clientHeight / mostSeconds) / hyp) * (180 / Math.PI);
            dateDistributionChart.innerHTML += "<div style='position:relative;'> <div class='point' style='margin-top: "+ (dateDistributionChart.clientHeight-pointHeight) +"px'></div> <div class='point-line' style='--hyp:" + hyp + ";--angle:" + deg + "'></div> </div>"
        } else {
            dateDistributionChart.innerHTML += "<div style='position:relative;'> <div class='point' style='margin-top: "+ (dateDistributionChart.clientHeight-pointHeight) +"px'></div>";
        }
    }

    loaded = true;
}

//Get Spotify credentials
async function getSpotifyCredentials(topSong, topSongArtist, allArtists, orderedArtists, singerTimeArray) {
    fetch("getS.php", {
        method: 'POST'
    }).then(response => {
            if (response.status !== 200) {
                console.warn('Response not OK. Status Code: ' + response.status);
                return;
            }
            response.text().then(async function(data) {
                //console.log(data);
                makeSearches(data, topSong, topSongArtist, allArtists, orderedArtists, singerTimeArray);
            }).catch(err => {
                console.warn('Credential parse Error: ', err);
            });
    }).catch(err => {
        console.warn('Error getting credential PHP with Fetch: ', err);
    });
}

// Search spotify images
async function makeSearches(t, topSong, topSongArtist, allArtists, orderedArtists, singerTimeArray) {
    let response = await fetch("https://api.spotify.com/v1/search?q=track%3A"+ encodeURIComponent(topSong) +"+artist%3A"+ encodeURIComponent(topSongArtist) +"&type=track&limit=1", {
        headers: {
            "Authorization": 'Bearer ' + t,
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        }
    });
    if(response.ok) {
        let json = await response.json();
        if(json.tracks.items[0] != null) document.getElementById("topSongImage").src = json.tracks.items[0].album.images[1].url;
        else document.getElementById("topSongImage").src = "images/def_song.png";
    } else {
        console.log("Error getting top song image: " + response.status);
    }

    let i = 0;
    while(true) {
        let response2 = await fetch("https://api.spotify.com/v1/search?q=artist%3A" + encodeURIComponent(allArtists[orderedArtists[i]]) + "&type=artist&limit=1", {
            headers: {
                "Authorization": 'Bearer ' + t,
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
            }
        });
        if(response2.ok) {
            let json = await response2.json();
            if(json.artists.items[0] != null) {
                document.getElementById("topArtistImage").src = json.artists.items[0].images[1].url;
                document.getElementById("topArtist").innerHTML = allArtists[orderedArtists[i]] + "<br><span style='font-size:0.75em'>Listened to for " + Math.round(singerTimeArray[orderedArtists[i]]/60) + " minutes</span>";
                break;
            }
            else document.getElementById("topArtistImage").src = "images/def_singer.png";
        } else {
            console.log("Error getting top artist image: " + response2.status);
            break;
        }
        i++;
    }
}

async function getWikipediaInformation(singerArray, sortedSingerIndecesArray) {
    try {
        const countryList = document.getElementById("artistOriginList");
        const ageDistributionChart = document.getElementById("ageDistribution");
        while(ageDistributionChart.firstChild) ageDistributionChart.removeChild(ageDistributionChart.firstChild);
        while(countryList.firstChild) countryList.removeChild(countryList.firstChild);

        document.getElementsByClassName("wikidataDiv")[0].style.visibility = "hidden";
        document.getElementsByClassName("wikidataDiv")[1].style.visibility = "hidden";
        document.getElementsByClassName("wikidataLoader")[0].style.visibility = "visible";
        document.getElementsByClassName("wikidataLoader")[1].style.visibility = "visible";

        const errorCorrectionBefore = ["Alan Walker", "Sia", "MARINA", "Halsey", "Bastille", "P!nk", "BANNERS", "Céline Dion", "Queen", "Rutger Zuydervelt", "Sub Urban", "NF", "RADWIMPS", "Loreen", "Zayn", "Khaled", "AURORA", "Sam Ryder", "Sigrid", "Drake", "MIKA", "Ado"];
        const errorCorrectionAfter = ["Alan Walker (music producer)", "Sia (musician)", "Marina Diamandis", "Halsey (singer)", "Bastille (band)", "Pink (singer)", "Banners (musician)", "Celine Dion", "Queen (band)", "Machinefabriek", "Sub Urban (musician)", "NF (rapper)", "Radwimps", "Loreen (singer)", "Zayn Malik", "Khaled (musician)", "Aurora (singer)", "Sam Ryder (singer)", "Sigrid (singer)", "Drake (musician)", "Mika (singer)", "Ado (singer)"];
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
        let response = await fetch("https://query.wikidata.org/sparql?query=" + queryString + "&format=json&origin=*");
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
            }catch(err){
                try{console.log("Missing birthplace for "+artistInfo[i].page.value);}catch(err){console.log("Missing birthplace for artist")}
            }
            try {
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
                try{console.log("Missing age for "+artistInfo[i].page.value);}catch(err){console.log("Missing age for artist")}
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
        console.warn("Error on Wikidata search: " + err);
    }
}

// Recalculate time distribution by date chart when window size changed
window.addEventListener('resize', function(event){
    if(loaded) {
        let dateDistributionChart = document.getElementById("dateDistribution");
        let children = dateDistributionChart.children;
        for (let i = 0; i < children.length - 1; i++) {
            let hyp = Math.sqrt(Math.pow(dateDistributionChart.clientWidth/dateArray.length, 2) + Math.pow((dateArrayTimes[i+1] - dateArrayTimes[i]) * dateDistributionChart.clientHeight / mostSeconds, 2));
            let deg = Math.asin(((dateArrayTimes[i] - dateArrayTimes[i+1]) * dateDistributionChart.clientHeight / mostSeconds) / hyp) * (180 / Math.PI);
            children[i].children[1].style.setProperty("--angle", deg);
            children[i].children[1].style.setProperty("--hyp", hyp);
        }
    }
});