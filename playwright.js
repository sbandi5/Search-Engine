const { chromium } = require('playwright-extra'); // Import Playwright with stealth support
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const html_parser = require('node-html-parser');
const Tokenizer = require('./tokenizer');
const Database = require('./Database');

// Use the stealth plugin for bypassing detection
chromium.use(StealthPlugin());

// Configure the reCAPTCHA plugin with your 2Captcha API key
chromium.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWOCAPTCHA_TOKEN || 'YOUR_API_KEY' // Replace with your actual API key
    }
  })
);
class PlaywrightRobot {
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
	    let browser; // Declare browser variable once here
	    try {
	            const browser = await chromium.launch({ headless: true });
		    const page = await browser.newPage();

		    // Set custom headers
		    await page.setExtraHTTPHeaders({
		      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
		      'Accept-Language': 'en-US,en;q=0.9'
		    });

		    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Wait for page load

		    // Add another random delay of 1 to 5 seconds
		    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 4000 + 1000)));

		    // Scroll the page to load additional content
		    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

		    // Add another random delay of 1 to 5 seconds
		    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 4000 + 1000)));
    
		    const root = await page.content(); // Get HTML content of the page
		    await browser.close();
		    // Process and update rank in the database
		    const rank = this.t.countKeywordOccurrences(content.toString(), keywords);
		    this.databaseconnection.updateRank(Weburl, rank);
	    } catch (error) {
        	console.error("Error fetching the website using Playwright:", error);
    	    } finally {
        	// Ensure browser is closed if it was initialized
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
	    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set custom headers
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Wait for page load

    // Add another random delay of 1 to 5 seconds
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 4000 + 1000)));

    // Scroll the page to load additional content
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    // Add another random delay of 1 to 5 seconds
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 4000 + 1000)));
    
    const html = await page.content(); // Get HTML content of the page
    await browser.close();

        // Process content with Tokenizer to extract description and keywords
        const { description, keywordsString } = await this.t.processInput(content.toString(), Weburl);

        // Update the database with description and keywords
        this.databaseconnection.updateUrlDescription(Weburl, description);
        this.databaseconnection.updateUrlKeyword(Weburl, keywordsString, 0);
    } catch (error) {
        console.error("Error fetching the website using Playwright:", error);
    } finally {
        // Ensure browser is closed if it was initialized
        if (browser) {
            await browser.close();
        }
        this.isBusy = false;
    }
}
}

module.exports = PlaywrightRobot;

