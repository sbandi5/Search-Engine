
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
        this.keywordRank = 0;
    }

    async parseWebsite(Weburl,keywords) {
        this.isBusy = true;
        
        try {
            let response = await axios.get(Weburl);
            let root = html_parser.parse(response.data);
            let {description, keywordCount, links} = this.t.processInput(root.toString(), keywords);
            this.keywordRank = keywordCount;
            console.log('The no of times '+ keywords+ ' occured in the '+Weburl+' is '+ keywordCount +'\n');
            console.log('Description is:'+ description + '\n');
            for(let i =0; i< links.length; i++){
                this.databaseconnection.updateRobot(links[i]);
            }
            this.databaseconnection.updateUrlDescription(Weburl, description);

        } catch (error) {
            console.error("Error fetching the website:", error);
        } finally {
            this.isBusy = false;
            return this.keywordRank;
        }
    }

}

module.exports = Robot;
