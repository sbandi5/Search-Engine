const https = require('https');
const express = require('express');
const app = express();
const Database = require('./Database.js');
const Robot = require('./robot.js');
const puppeteer = require('./puppeteer.js');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const Tokenizer = require('./tokenizer.js');
const tokenizer = new Tokenizer();
app.set('view engine', 'ejs');

app.set('views', path.join('/var/www/html/assignment3/', 'views'));

const puppeteerRobot = new puppeteer();
const robot1 = new Robot();
const robot2 = new Robot();
const robot3 = new Robot();

const robots = [robot1, robot2, robot3];
const databaseConnection = Database.getInstance();

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

    if (url.includes('emich.edu')) {
	console.log(`Assigning URL: ${url} to Puppeteer.`);
        let {keywordRank,extractedKeywords} = await puppeteerRobot.parseWebsite(url, keyword);
        urlarr.push(url);
        keywordOccuranceInUrl.push(keywordRank);
        currentKeyWord.push(extractedKeywords);
        sortAccordingTORank(); // Sort after adding new occurrences
        return;
    }
    // Avoid indefinite loop; use setTimeout for retries instead of blocking
    while (!assigned) {
        for (let robot of robots) {
            if (!robot.isBusy) { // Check if the robot is not busy
                console.log(`Assigning URL: ${url} to a robot.`);
                let {keywordRank,extractedKeywords} = await robot.parseWebsite(url, keyword); // Assign the URL to the robot
                urlarr.push(url);
                keywordOccuranceInUrl.push(keywordRank);
                currentKeyWord.push(extractedKeywords);
                sortAccordingTORank(); // Sort after adding new occurrences
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            await delay(50);
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/', async function (req, res) {
    const keywords = req.query.keywords;
    const searchType = req.query.searchType;

    // Clear old results on each new request
    urlarr = [];
    keywordOccuranceInUrl = [];
    currentKeyWord = [];

    try {
        // Clear database tables before processing new requests
        await databaseConnection.emptyRobot();
        await databaseConnection.emptyUrlDescription();
        await databaseConnection.emptyUrlKeyword();

        // Update with initial URLs after clearing tables
        const startingurls = [
            'https://www.emich.edu/',
            'https://umich.edu/',
            'https://www.mlive.com/'
        ];
        for (let url of startingurls) {
            await databaseConnection.updateRobot(url);
        }
	await delay(500);
        // Proceed with original processing logic
        let pos = 1;
        let url = await databaseConnection.getRobot(pos); // Fetch the first URL
        while (url != null && await databaseConnection.checkpos() <= tokenizer.n) {
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
            await databaseConnection.updateUrlKeyword(urlarr[i], currentKeyWord[i], keywordOccuranceInUrl[i]);
        }

        // Fetch and render search results
        const searchResults = await databaseConnection.SearchResultsQuery();
	for(let result =0; result< searchResults.length;result++){
		console.log('the search results are: '+searchResults[result].url+' , '+ searchResults[result].description +' , '+ searchResults[result].rank+ ' \n')
	}
        res.render('SearchEngine', { results: searchResults });

    } catch (err) {
        console.error("Error during processing:", err);
        res.status(500).send('Error fetching URLs from the database: ' + err.message);
    }
});


// Create an HTTPS server and start listening on the port
https.createServer(certs, app).listen(12345, () => {
    console.log('Listening on port 12345');
});

