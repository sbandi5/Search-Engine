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
    }

    async parseWebsite(Weburl, keywords) {
        this.isBusy = true;
        let browser;
        try {
            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.goto(Weburl, { waitUntil: 'domcontentloaded' });

            // Get the page content and parse it
            const content = await page.content();
            const root = html_parser.parse(content);
            
            // Count keyword occurrences and update rank in the database
            const rank = this.t.countKeywordOccurrences(root.toString(), keywords);
            this.databaseconnection.updateRank(Weburl, rank);
        } catch (error) {
            console.error("Error fetching the website using Puppeteer:", error);
        } finally {
            if (browser) {
                await browser.close();
            }
            this.isBusy = false;
        }
    }

    async parseWebsiteForKeyword(Weburl) {
        this.isBusy = true;
        let browser;
        try {
            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.goto(Weburl, { waitUntil: 'domcontentloaded' });

            // Get the page content and parse it
            const content = await page.content();
            const root = html_parser.parse(content);

            // Process content with Tokenizer to extract description and keywords
            const { description, keywordsString } = await this.t.processInput(root.toString(), Weburl);
            
            // Update the database with description and keywords
            this.databaseconnection.updateUrlDescription(Weburl, description);
            this.databaseconnection.updateUrlKeyword(Weburl, keywordsString, 0);
        } catch (error) {
            console.error("Error fetching the website using Puppeteer:", error);
        } finally {
            if (browser) {
                await browser.close();
            }
            this.isBusy = false;
        }
    }
}

module.exports = PuppeteerRobot;
