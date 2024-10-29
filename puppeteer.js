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
        this.keywordRank = 0;
    }

    async parseWebsite(Weburl, keywords) {
        this.isBusy = true;
        let browser;
        
        try {
            browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(Weburl, { waitUntil: 'domcontentloaded' });

            // Get the page content
            const content = await page.content();
            let root = html_parser.parse(content);

            // Process the input using the Tokenizer
            let { description, keywordCount, links } = this.t.processInput(root.toString(), keywords);
            this.keywordRank = keywordCount;
            console.log(`The number of times '${keywords}' occurred in '${Weburl}' is ${keywordCount}\n`);
            console.log('Description:', description, '\n');
            
            // Store the extracted links in the database
            for (let i = 0; i < links.length; i++) {
                this.databaseconnection.updateRobot(links[i]);
            }

            // Store the description in the database
            this.databaseconnection.updateUrlDescription(Weburl, description);
        } catch (error) {
            console.error("Error fetching the website using Puppeteer:", error);
        } finally {
            if (browser) {
                await browser.close();
            }
            this.isBusy = false;
            return this.keywordRank;
        }
    }
}

module.exports = PuppeteerRobot;
