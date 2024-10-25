
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

    async parseWebsite(Weburl,keywords) {
        this.isBusy = true;
        let keywordCount = 0;
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);
            let {tokens , keywordCount} = this.t.processInput(root.toString(), keywords);
            console.log(tokens + '\n');
            console.log('The no of times '+ keywords+ ' occured in the '+Weburl+' is '+ keywordCount);
            

        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
            return keywordCount;
        }
    }

}

module.exports = Robot;