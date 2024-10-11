const http = require('http');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const robot = require('./robot.js');
// const robot1 = new Robot(); // Create an instance of the Robot class

const databaseDetails = mysql.createConnection({
    host: 'localhost',
    user: 'COSC631',
    password: 'COSC631',
    database: 'SearchEngine'
});

// Connect to the database
databaseDetails.connect(err => {
    if (err) {
        throw err;
    } else {
        console.log('Database connected');
    }
});

// Route for handling requests to fetch URLs
app.get('/', function (req, res) {
    let keywords = req.query.web_url;
    let and = req.query.and;

    // Query to fetch data from the robotUrl table
    databaseDetails.query("SELECT * FROM robotUrl", (err, results) => {
        if (err) {
            return res.status(500).send("Database error: " + err.message);
        }

        if (results.length === 0) {
            return res.send('No data found in robotUrl table.');
        }

        // Process and send the data from the robotUrl table
        res.write('The "and" parameter is: ' + and + '<br>');
        res.write('The keywords are: ' + keywords + '<br><br>');
        res.write('Fetched URLs from the database:<br>');

        // Iterate through results and write each URL to the response
        results.forEach(row => {
            res.write(row.url + '<br>'); // Assuming 'url' is a column in robotUrl table
        });

        // Call Robot class to parse website (Optional)
        // You can pass keywords to robot1.parseWebsite() if needed
        // Example: robot1.parseWebsite(keywords);

        res.end();
    });
});

// Create an HTTP server and start listening on the port
const httpsServer = http.createServer(app);
let port = 12348;
httpsServer.listen(port, function () {
    console.log('Listening on port ' + port);
});
