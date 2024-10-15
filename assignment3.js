const https = require('https');
const express = require('express');
const app = express();
const Database = require('./Database.js');
const Robot = require('./robot.js');
const fs = require('fs');
const path = require('path');

// Instantiate three robots
const robot1 = new Robot();
const robot2 = new Robot();
const robot3 = new Robot();
const robots = [robot1, robot2, robot3];

const databaseConnection = Database.getInstance();
databaseConnection.connect();

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

// Function to find an available robot (wait until one is free)
async function assignToAvailableRobot(url, keyword) {
    let assigned = false;

    // Avoid indefinite loop; use setTimeout for retries instead of blocking
    while (!assigned) {
        for (let robot of robots) {
            if (!robot.isBusy) { // Check if the robot is not busy
                console.log(`Assigning URL: ${url} to a robot.`);
                await robot.parseWebsite(url, keyword); // Assign the URL to the robot
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
}

// Route for handling requests to fetch URLs
app.get('/', async function (req, res) {
    const keywords = req.query.keywords || ''; 
    const and = req.query.and || ''; 

    try {

        const weburl = ['https://www.saimanikiranbandi.com','https://emich.edu','https://umich.edu','https://www.mlive.com/ann-arbor/'];
        databaseConnection.updateRobot(weburl);
        // Fetch URLs from the database
        const urls = await databaseConnection.getRobot();

        if (urls.length === 0) {
            res.write('No URLs found in the database.<br>');
            res.end();
            return;
        }

        // Write response data
        res.write('The "and" parameter is: ' + and + '<br>');
        res.write('The keywords are: ' + keywords + '<br><br>');
        res.write('Fetched URLs from the database:<br>');

        // Assign URLs to available robots
        for (let url of urls) {
            await assignToAvailableRobot(url, keywords); // Assign each URL to an available robot
        }

        res.end();
    } catch (err) {
        console.error("Error during processing:", err);
        res.status(500).send('Error fetching URLs from the database: ' + err.message);
    }
});

// Create an HTTPS server and start listening on the port
https.createServer(certs, app).listen(12346, () => {
    console.log('Listening on port 12346');
});
