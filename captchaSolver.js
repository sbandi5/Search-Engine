const axios = require('axios');

async function solveCaptcha(page) {
    const captchaSiteKey = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="recaptcha"]');
        if (iframe) {
            const src = iframe.getAttribute('src');
            const siteKeyMatch = src.match(/k=([^&]+)/);
            return siteKeyMatch ? siteKeyMatch[1] : null;
        }
        return null;
    });

    if (!captchaSiteKey) {
        console.log("No CAPTCHA detected.");
        return false;
    }

    console.log(`Detected CAPTCHA with site key: ${captchaSiteKey}`);

    try {
        // Step 1: Send CAPTCHA request to 2Captcha
        const response = await axios.get(`http://2captcha.com/in.php?key=YOUR_2CAPTCHA_API_KEY&method=userrecaptcha&googlekey=${captchaSiteKey}&pageurl=${page.url()}&json=1`);
        const captchaId = response.data.request;

        // Step 2: Wait for the solution
        console.log("Waiting for CAPTCHA solution...");
        let captchaSolution;
        for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const result = await axios.get(`http://2captcha.com/res.php?key=YOUR_2CAPTCHA_API_KEY&action=get&id=${captchaId}&json=1`);
            if (result.data.status === 1) {
                captchaSolution = result.data.request;
                break;
            }
        }

        if (!captchaSolution) {
            console.error("Failed to solve CAPTCHA.");
            return false;
        }

        console.log("CAPTCHA solved, injecting solution...");

        // Step 3: Inject the CAPTCHA solution token into the page
        await page.evaluate(token => {
            document.querySelector('textarea[name="g-recaptcha-response"]').value = token;
            const submitButton = document.querySelector('button[type="submit"]'); // Update as needed
            if (submitButton) submitButton.click();
        }, captchaSolution);

        return true;
    } catch (error) {
        console.error("Error solving CAPTCHA:", error);
        return false;
    }
}

module.exports = { solveCaptcha };
