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
//        this.keywordRank = 0;
    }

    async parseWebsite(Weburl, keywords) {
        this.isBusy = true;
    	let keywordRank = 0;
	let extractedKeywords = '';
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);
    
            // Validate root parsing and output data
            let { description, keywordCount, keywordsString } =  await this.t.processInput(root.toString(), keywords, Weburl);
            
            keywordRank = keywordCount || 0; // Handle undefined or null counts
            extractedKeywords = keywordsString;
            this.databaseconnection.updateUrlDescription(Weburl, description);
    
        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
            return {keywordRank,extractedKeywords};
        }
    }
    

}

module.exports = Robot;
