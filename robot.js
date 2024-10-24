// robot.js
const axios = require('axios');
const html_parser = require('node-html-parser');
const Tokenizer = require('./tokenizer'); // Import the Tokenizer class

class Robot {
    constructor() {
        this.isBusy = false;
        this.t = new Tokenizer(); // Instantiate Tokenizer
    }

    async parseWebsite(Weburl,keywords) {
        this.isBusy = true;
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);
//          this.t.processContent(root.toString(),keywords,10); // Process the content using Tokenizer
//          this.t.printExtractedData();
            let {tokens , keywordCount} = this.t.processInput(root.toString(), keywords);
            console.log(tokens + '\n');
            console.log('The no of times '+ keywords+ ' occured in the '+Weburl+' is '+ keywordCount)

        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
        }
    }
}

module.exports = Robot;