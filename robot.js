// robot.js
const axios = require('axios');
const html_parser = require('node-html-parser');
const Tokenizer = require('./tokenizer'); // Import the Tokenizer class

class Robot {
    constructor() {
        this.isBusy = false;
        this.t = new Tokenizer(); // Instantiate Tokenizer
    }

    async parseWebsite(Weburl) {
        this.isBusy = true;
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);
            this.t.processContent(root.toString()); // Process the content using Tokenizer
        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
        }
    }
}

module.exports = Robot;
