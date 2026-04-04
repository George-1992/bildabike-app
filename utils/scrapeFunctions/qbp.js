
// qbp
export const qbp = async () => {
    let resObj = {
        success: false,
        message: '',
        data: {},
        clcError: null,
    };

    const screenshots = [];
    const htmls = [];
    const apiDataStore = [];

    try {
        const loginUrl = 'https://login.qbp.com/login';

        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set the viewport to a desktop size
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('Navigating to login page...');
        await page.goto(loginUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Take initial screenshot
        // screenshots.push(await page.screenshot({ fullPage: true }));

        console.log('Waiting for login form...');
        // Wait for the form to be ready
        await page.waitForSelector("input[id='username']", { visible: true, timeout: 10000 });
        await page.waitForSelector("input[id='password']", { visible: true, timeout: 10000 });
        await page.waitForSelector("button[type='submit']", { visible: true, timeout: 10000 });

        console.log('Filling credentials...');
        // Clear and fill username
        await page.click("input[id='username']", { clickCount: 3 });
        await page.type("input[id='username']", userName, { delay: 100 });

        // Clear and fill password
        await page.click("input[id='password']", { clickCount: 3 });
        await page.type("input[id='password']", password, { delay: 100 });

        // Small delay before screenshot
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Take screenshot before clicking
        // screenshots.push(await page.screenshot({ fullPage: true }));


        // Try clicking with multiple strategies
        try {
            await Promise.all([
                page.waitForNavigation({
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                }),
                page.click("button[type='submit']")
            ]);
            resObj.clcError = null;
        } catch (navError) {
            resObj.clcError = `Navigation failed: ${navError.message}`;
            console.log('Navigation with click failed, trying evaluate click...');

            // Fallback: try clicking via evaluate
            await page.evaluate(() => {
                const btn = document.querySelector("button[type='submit']");
                if (btn) btn.click();
            });

            // Wait manually
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Waiting for page to settle...');
        // Wait for any redirects or page loads
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check current URL
        const currentUrl = page.url();

        // Take screenshot after login
        // screenshots.push(await page.screenshot({ fullPage: true }));

        await page.goto('https://www.qbp.com/qbponlinestorefront/', { waitUntil: 'networkidle2', timeout: 240000 });

        screenshots.push(await page.screenshot({ fullPage: true }));

        resObj.success = true;
        resObj.message = 'Login process completed';
        resObj.screenshots = screenshots;
        resObj.htmls = htmls;
        resObj.data = {
            ...apiDataStore,
            finalUrl: currentUrl
        };

        return resObj;

    } catch (error) {
        console.error('Error in qbp function:', error);
        console.error('Error stack:', error.stack);

        // Take error screenshot for debugging
        try {
            const errorUrl = page.url();
            console.log('Error occurred at URL:', errorUrl);

            screenshots.push(await page.screenshot({ fullPage: true }));
            htmls.push(await page.content());

            resObj.data = { errorUrl };
        } catch (e) {
            console.error('Failed to capture error details:', e);
        }

        resObj.success = false;
        resObj.message = error.message;
        resObj.clcError = resObj.clcError || error.message;
        resObj.screenshots = screenshots;
        resObj.htmls = htmls;

        return resObj;
    }
};