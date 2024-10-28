
const https = require('https');
const express = require('express');
const app = express();
const Database = require('./Database.js');
const Robot = require('./robot.js');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
app.set('view engine', 'ejs');

app.set('views', path.join('/var/www/html/assignment3/', 'views'));

// Instantiate three robots
const robot1 = new Robot();
const robot2 = new Robot();
const robot3 = new Robot();
const robots = [robot1, robot2, robot3];

const databaseConnection = Database.getInstance();
databaseConnection.connect();
databaseConnection.emptyRobot();
databaseConnection.emptyUrlDescription();
databaseConnection.emptyUrlKeyword();
const startingurls = [
    'https://www.emich.edu/index.php', 
    'https://umich.edu/', 
    'https://www.mlive.com/'
];

for (let url of startingurls) {
    databaseConnection.updateRobot(url);
}
// Load certificate files with error handling
let certs;
try {
    certs = {
        key: fs.readFileSync(path.join('/etc/ssl/', 'www.saimanikiranbandi.com_key.txt')),
        cert: fs.readFileSync(path.join('/etc/ssl/', 'www.saimanikiranbandi.com.crt'))
    };
} catch (err) {
    console.error('Error reading certificate files:', err.message);
    process.exit(1); // Exit process if the certificates are not available
}

let urlarr = [];
let keywordOccuranceInUrl = [];
let currentKeyWord = [];

// Function to find an available robot (wait until one is free)
async function assignToAvailableRobot(url, keyword) {
    let assigned = false;

    // Avoid indefinite loop; use setTimeout for retries instead of blocking
    while (!assigned) {
        for (let robot of robots) {
            if (!robot.isBusy) { // Check if the robot is not busy
                console.log(`Assigning URL: ${url} to a robot.`);
                let keyOccurances = await robot.parseWebsite(url, keyword); // Assign the URL to the robot
                urlarr.push(url);
                keywordOccuranceInUrl.push(keyOccurances);
                currentKeyWord.push(keyword);
                sortAccordingTORank(); // Sort after adding new occurrences
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
}

// Sort URLs according to the number of keyword occurrences in descending order
function sortAccordingTORank() {
    for (let i = 0; i < keywordOccuranceInUrl.length - 1; i++) {
        for (let j = i + 1; j < keywordOccuranceInUrl.length; j++) {
            if (keywordOccuranceInUrl[i] < keywordOccuranceInUrl[j]) {
                // Sorting according to the keyword occurrences
                let temp = keywordOccuranceInUrl[i];
                keywordOccuranceInUrl[i] = keywordOccuranceInUrl[j];
                keywordOccuranceInUrl[j] = temp;

                // Sorting the URL as well
                temp = urlarr[i];
                urlarr[i] = urlarr[j];
                urlarr[j] = temp;

                temp = currentKeyWord[i];
                currentKeyWord[i] = currentKeyWord[j];
                currentKeyWord[j] = temp;
            }
        }
    }
}

app.get('/', async function (req, res) {
    const keywords = req.query.keywords;
    const searchType = req.query.searchType;

    // Clear old results on each new request
    urlarr = [];
    keywordOccuranceInUrl = [];
    currentKeyWord = [];

    try {
        // Fetch URLs from the database
        let pos = 1;
        let url = await databaseConnection.getRobot(pos); // Fetch the first URL

        while (url != null && pos <= 20) {
            if (searchType === 'and') {
                await assignToAvailableRobot(url, keywords);
            } else {
                let keywordsArr = keywords.split(' ');
                for (let keyword of keywordsArr) {
                    await assignToAvailableRobot(url, keyword);
                }
            }
            pos++;
            url = await databaseConnection.getRobot(pos); // Fetch the next URL
        }

        // Update keyword occurrences in the database
        for (let i = 0; i < urlarr.length; i++) {
            databaseConnection.updateUrlKeyword(urlarr[i], currentKeyWord[i], keywordOccuranceInUrl[i]);
        }
        
        // Fetch and render search results
        const searchResults = await databaseConnection.SearchResultsQuery();
        res.render('SearchEngine', { results: searchResults });

    } catch (err) {
        console.error("Error during processing:", err);
        res.status(500).send('Error fetching URLs from the database: ' + err.message);
    }
});

// Create an HTTPS server and start listening on the port
https.createServer(certs, app).listen(12346, () => {
    console.log('Listening on port 12346');
});


