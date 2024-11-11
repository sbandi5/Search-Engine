const { chromium } = require('playwright'); // Import Playwright
const html_parser = require('node-html-parser');
const Tokenizer = require('./tokenizer');
const Database = require('./Database');
const { solveCaptcha } = require('./captchaSolver'); // Optional: implement if CAPTCHA-solving is needed

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
        let browser;
        try {
            // Launch browser with optional proxy and headless settings
            browser = await chromium.launch({
                headless: true,
                proxy: { server: 'http://your-proxy-server.com' } // Replace with your proxy if needed
            });

            const context = await browser.newContext({
                javaScriptEnabled: true, // Ensure JavaScript is enabled
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();

            // Set additional headers for better mimicry of human behavior
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9'
            });

            // Attempt to navigate to the page with retries
            let retries = 3;
            while (retries > 0) {
                try {
                    await page.goto(Weburl, { waitUntil: 'domcontentloaded' });

                    // Wait for a specific element indicating the content is fully loaded
                    await page.waitForSelector('body'); // Replace 'body' with a specific selector for the main content
                    break;
                } catch (error) {
                    console.log(`Retrying (${3 - retries + 1}/3) for ${Weburl}`);
                    retries--;
                    await page.waitForTimeout(10000); // Wait 10 seconds before retrying
                }
            }

            // Evaluate JavaScript to trigger any scripts
            await page.evaluate(() => {
                // Example: Click a button or execute a script if needed
                // document.querySelector('button').click();
            });

            // Solve CAPTCHA if needed (requires an external CAPTCHA-solving module)
            if (await this.detectCaptcha(page)) {
                console.log('Captcha detected, attempting to solve...');
                const captchaSolved = await solveCaptcha(page); // Use solveCaptcha method here if implemented
                if (!captchaSolved) throw new Error('CAPTCHA could not be solved');
            }

            // Add random behavior to simulate human actions
            await this.randomizePageBehavior(page);

            // Get the page content and parse it
            const content = await page.content();
            const root = html_parser.parse(content);

            // Count keyword occurrences and update rank in the database
            const rank = this.t.countKeywordOccurrences(root.toString(), keywords);
            this.databaseconnection.updateRank(Weburl, rank);
        } catch (error) {
            console.error("Error fetching the website using Playwright:", error);
        } finally {
            if (browser) {
                await browser.close();
            }
            this.isBusy = false;
        }
    }

    async detectCaptcha(page) {
        // Implement CAPTCHA detection logic (e.g., checking for specific elements or text)
        const captchaText = await page.evaluate(() => {
            return document.body.textContent.includes("Please enable JavaScript") ||
                   document.body.textContent.includes("I'm not a robot");
        });
        return captchaText;
    }

    async randomizePageBehavior(page) {
        // Scroll page to simulate user behavior
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));

        // Randomly pause to mimic human reading
        await page.waitForTimeout(3000 + Math.random() * 2000); // 3 to 5 seconds

        // Scroll back up
        await page.evaluate(() => window.scrollBy(0, -window.innerHeight));
    }

    async parseWebsiteForKeyword(Weburl) {
        this.isBusy = true;
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                javaScriptEnabled: true,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            });
            const page = await context.newPage();
            
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9'
            });

            await page.goto(Weburl, { waitUntil: 'domcontentloaded' });

            // Additional parsing as in worker.js
            const content = await page.content();
            const root = html_parser.parse(content);
            const { description, keywordsString } = await this.t.processInput(root.toString(), Weburl);

            // Update the database with description and keywords
            this.databaseconnection.updateUrlDescription(Weburl, description);
            this.databaseconnection.updateUrlKeyword(Weburl, keywordsString, 0);
        } catch (error) {
            console.error("Error fetching the website using Playwright:", error);
        } finally {
            if (browser) {
                await browser.close();
            }
            this.isBusy = false;
        }
    }
}

module.exports = PlaywrightRobot;
