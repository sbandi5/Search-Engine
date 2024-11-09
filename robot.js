const axios = require('axios');
const html_parser = require('node-html-parser');
const Tokenizer = require('./tokenizer'); 
const Database = require('./Database');
class Robot {
    constructor() {
        this.isBusy = false;
        this.t = new Tokenizer(); // Instantiate Tokenizer
        this.databaseconnection = Database.getInstance();
        this.databaseconnection.connect();
        this.url = [];
        this.keywordInUrl = [];
    }

    async parseWebsite(Weburl, keywords) {
        this.isBusy = true;
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);
    
	        let rank = this.t.countKeywordOccurrences(root.toString(), keywords);
    	    this.databaseconnection.updateRank(Weburl, rank);
        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
        }
    }
    
    async parseWebsiteForKeyword(Weburl) {
        this.isBusy = true;
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);

            // Validate root parsing and output data
            let { description, keywordsString }   =  await this.t.processInput(root.toString(), Weburl);
	    this.databaseconnection.updateUrlDescription(Weburl, description);
            this.databaseconnection.updateUrlKeyword(Weburl, keywordsString,0);

        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
        }
    }
}

module.exports = Robot;
