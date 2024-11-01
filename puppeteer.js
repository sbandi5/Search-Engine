const puppeteer = require('puppeteer');
const html_parser = require('node-html-parser');
const Tokenizer = require('./tokenizer');
const Database = require('./Database');

class PuppeteerRobot {
    constructor() {
        this.isBusy = false;
        this.t = new Tokenizer(); // Instantiate Tokenizer
        this.databaseconnection = Database.getInstance();
        this.databaseconnection.connect();
        this.url = [];
        this.keywordInUrl = [];
        //this.keywordRank = 0;
    }

    async parseWebsite(Weburl, keywords) {
        this.isBusy = true;
        let browser;
	let keywordRank = 0;
        let extractedKeywords = '';
        try {
            browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	    });
            const page = await browser.newPage();
            await page.goto(Weburl, { waitUntil: 'domcontentloaded' });

            // Get the page content
            const content = await page.content();
            let root = html_parser.parse(content);

            // Process the input using the Tokenizer
            let { description, keywordCount, keywordsString } = await this.t.processInput(root.toString(), keywords,Weburl);
            keywordRank = keywordCount;
	    extractedKeywords = keywordsString;
            // Store the description in the database
            this.databaseconnection.updateUrlDescription(Weburl, description);
        } catch (error) {
            console.error("Error fetching the website using Puppeteer:", error);
        } finally {
            if (browser) {
                await browser.close();
            }
            this.isBusy = false;
            return {keywordRank, extractedKeywords};
        }
    }
}

module.exports = PuppeteerRobot;
