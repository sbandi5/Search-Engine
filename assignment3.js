const https = require('https');
const express = require('express');
const app = express();
const Database = require('./Database.js');
const Robot = require('./robot.js');
const playWright = require('./playwright.js');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const Tokenizer = require('./tokenizer.js');
const tokenizer = new Tokenizer();
app.set('view engine', 'ejs');

app.set('views', path.join('/var/www/html/assignment3/', 'views'));

const playWrightRobot = new playWright();
const robot1 = new Robot();
const robot2 = new Robot();
const robot3 = new Robot();

const robots = [robot1, robot2, robot3];
const databaseConnection = Database.getInstance();

// Load certificate files with error handling
let certs;
try {
    certs = {
        key: fs.readFileSync(path.join('/etc/ssl/', 'www.hiranmaimuddam.com_key.txt')),
        cert: fs.readFileSync(path.join('/etc/ssl/', 'www.hiranmaimuddam.com.crt'))
    };
} catch (err) {
    console.error('Error reading certificate files:', err.message);
    process.exit(1); // Exit process if the certificates are not available
}


// Function to find an available robot (wait until one is free)
async function assignToAvailableRobot(url, keyword) {
    let assigned = false;

    if (url.includes('emich.edu')) {
	console.log(`Assigning URL: ${url} to Puppeteer.`);
        await playWrightRobot.parseWebsite(url, keyword);
        return;
    }
    // Avoid indefinite loop; use setTimeout for retries instead of blocking
    while (!assigned) {
        for (let robot of robots) {
            if (!robot.isBusy) { // Check if the robot is not busy
                await robot.parseWebsite(url, keyword); // Assign the URL to the robot
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            await delay(10);
        }
    }
}


async function assignToAvailableRobotForKeyword(url) {
    let assigned = false;

    if (url.includes('emich.edu')) {
        console.log(`Assigning URL: ${url} to Puppeteer.`);
        await playWrightRobot.parseWebsiteForKeyword(url);
        return;
    }
    while (!assigned) {
        for (let robot of robots) {
            if (!robot.isBusy) { // Check if the robot is not busy
                await robot.parseWebsiteForKeyword(url); // Assign the URL to the robot
                assigned = true;
                break;
            }
        }
    }
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/', async function (req, res) {
    databaseConnection.connect();
    let keywords = req.query.keywords;
    const searchType = req.query.searchType;


    try {
	/*
        // Clear database tables before processing new requests
        await databaseConnection.emptyRobot();
        await databaseConnection.emptyUrlDescription();
        await databaseConnection.emptyUrlKeyword();

        // Update with initial URLs after clearing tables
        const startingurls = [
            'https://www.whitehouse.gov',
            'http://www.wayne.edu',
            'http://www.cnn.com/'
        ];
        for (let url of startingurls) {
            await databaseConnection.updateRobot(url);
        }
	await delay(1000);
        // Proceed with original processing logic
        let pos = 1;
        let url = await databaseConnection.getRobot(pos); // Fetch the first URL
        while(url != null && pos <= tokenizer.n){
		await assignToAvailableRobotForKeyword(url);
		pos++;
                url = await databaseConnection.getRobot(pos);
	}
	console.log('succesfully executed till this point without any error');
	*/
	await databaseConnection.makeRankZero();
	pos = 1;
	let url = await databaseConnection.getRobot(pos);
	let afterUrlGotKeywords = await databaseConnection.getUrlKeywordContents();
	let keywordsArr = keywords.split(' ');

	for (const result of afterUrlGotKeywords) {
    // Remove surrounding double quotes if present
    	    if (keywords[0] === '"' && keywords[keywords.length - 1] === '"') {
        	keywords = keywords.replaceAll('"', '');
        	await assignToAvailableRobot(url, keywords);
    	    } else if (searchType === 'and') {
 		   // `AND` operation: ensure all keywords are present
    		   if (keywordsArr.every(substring => result.keyword.includes(substring))) {
        		await assignToAvailableRobot(url, keywordsArr.join(", "));
    		   }
	    }else {
        // Check individual keywords when `searchType` is not 'and'
        	for (let keyword of keywordsArr) {
            	    if (result.keyword.includes(keyword)) {
                	await assignToAvailableRobot(url, keyword);
            	    }
        	}
    	    }
    	    pos++;
    	    url = await databaseConnection.getRobot(pos);
	}


        // Fetch and render search results
        const searchResults = await databaseConnection.SearchResultsQuery();
        res.render('SearchEngine', { results: searchResults });
	
    } catch (err) {
        console.error("Error during processing:", err);
        res.status(500).send('Error fetching URLs from the database: ' + err.message);
    }finally{
	databaseConnection.disconnect();
    }
});


// Create an HTTPS server and start listening on the port
https.createServer(certs, app).listen(12346, () => {
    console.log('Listening on port 12346');
});
