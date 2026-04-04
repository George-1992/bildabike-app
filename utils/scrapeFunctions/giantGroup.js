
// giantGroup
export const giantGroup = async () => {
    let resObj = {
        success: false,
        message: '',
        data: {},
    };

    const screenshots = [];
    const htmls = [];



    try {


        // Set the viewport to a desktop size, for example 1920x1080
        await page.setViewport({
            width: 1920,
            height: 1080,
        });

        // await page.goto("https://list.am");
        await page.goto(
            // "https://eac.giantcycling.com/login?client_id=16bqldundo33pebg822vq06det&redirect_uri=https%3A%2F%2Fgiant2org.my.site.com%2Fvforcesite%2Fservices%2Fauthcallback%2FopenIdConnect&response_type=code&scope=aws.cognito.signin.user.admin+email+openid+profile&state=CAAAAZtMkHjpMDAwMDAwMDAwMDAwMDAwAAABAm90zULWHf9htnYKTvHrWfVLTyPEAvf7PN-Jv8Ynil5VsperK6NbOuvi9gf1s4E6Q2L-fB8kgmu_-qzFACI2NEjFos6dhlEk_uzhkpx7NVAStFtL2hv7bK04t_Ms5IYH4yju2H7ZlSGAIy__MLL_gxDOjuVOaVX4DJ9sA5OOP7GHZgljJNQV9-6-UYqmJmwuF9QDQVZaXaWFQua-3m0z6-K9AA0-AhPEBEdcM404w3gvcBUChGZZ44Q5HonyBxxoug%3D%3D",
            'https://giant2org.my.site.com/login',
            { waitUntil: 'networkidle2', timeout: 240000 }
        );

        await page.waitForSelector("a[href='https://giant2org.my.site.com/vforcesite/services/auth/sso/openIdConnect']", { timeout: 5000 });
        await page.evaluate(() => {
            const lgButton = document.querySelector("a[href='https://giant2org.my.site.com/vforcesite/services/auth/sso/openIdConnect']");
            if (lgButton) {
                lgButton.click();
            }
        });
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 240000 });


        // wait input with name signInSubmitButton
        await page.waitForSelector("input[name='signInSubmitButton']");

        // fill input with name username with value - use page.evaluate to fill directly
        await page.evaluate((userName, password) => {
            const usernameInput = document.querySelector("input[name='username']");
            const passwordInput = document.querySelector("input[name='password']");

            if (usernameInput) {
                usernameInput.value = userName;
                usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
                usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            if (passwordInput) {
                passwordInput.value = password;
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, userName, password);
        // screenshots.push(await page.screenshot({ fullPage: true }));

        // click signInSubmitButton
        await Promise.all([
            page.evaluate(() => {
                const signInButton = document.querySelector("input[name='signInSubmitButton']");
                if (signInButton) {
                    signInButton.click();
                }
            }),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 240000 }),
        ]);


        // wait for navbar to be loaded
        await page.waitForSelector('webruntime-app', { timeout: 30000 });

        // =====================================
        // Start

        // Array to store captured API data
        const apexDataStore = [];

        // Set up response interception before navigation or before the API calls happen
        page.on('response', async (response) => {
            const url = response.url();
            const funcPush = (data) => {
                // push only if payload includes "getProducts"
                const isGp = data.request && data.request.payload && data.request.payload.includes('getProducts');
                if (isGp) {
                    apexDataStore.push(data);
                }
            };
            if (url.includes('/webruntime/api/apex/execute')) {
                try {
                    // Get the request object to access payload
                    const request = response.request();
                    const requestPayload = request.postData();

                    // Get the actual response data
                    const jsonData = await response.json();
                    funcPush({
                        url: url,
                        request: {
                            method: request.method(),
                            payload: requestPayload,
                            headers: request.headers()
                        },
                        response: {
                            data: jsonData,
                            status: response.status(),
                            headers: response.headers()
                        }
                    });
                } catch (error) {
                    console.error('Error parsing JSON from API response:', error);

                    // Try to get text response if JSON parsing fails
                    try {
                        const text = await response.text();
                        const request = response.request();
                        const requestPayload = request.postData();
                        console.log('Response text (non-JSON):', text.substring(0, 500));
                        funcPush({
                            url: url,
                            request: {
                                method: request.method(),
                                payload: requestPayload,
                                headers: request.headers()
                            },
                            response: {
                                data: text,
                                status: response.status(),
                                headers: response.headers()
                            }
                        });
                    } catch (e) {
                        console.error('Could not read response text:', e);
                    }
                }
            }
        });

        // go to to view all bikes https://giant2org.my.site.com/giant-category/a0CfJ00001B1k7HUAR/bikes
        await page.goto('https://giant2org.my.site.com/giant-category/a0CfJ00001B1k7HUAR/bikes', { waitUntil: 'networkidle2', timeout: 360000 });

        // Wait for page to fully load by checking for "Suspension Type" in HTML (max 5 minutes)
        let pageCheckAttempts = 0;
        const maxPageCheckAttempts = 300; // 5 minutes with 1 second intervals
        let pageFullyLoaded = false;

        while (pageCheckAttempts < maxPageCheckAttempts && !pageFullyLoaded) {
            const pageHTML = await page.content();
            if (pageHTML.includes('Suspension Type')) {
                pageFullyLoaded = true;
                console.log(`Page fully loaded after ${pageCheckAttempts} seconds`);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            pageCheckAttempts++;
            if (pageCheckAttempts % 10 === 0) {
                console.log(`Waiting for page to load... ${pageCheckAttempts}s elapsed`);
            }
        }

        if (!pageFullyLoaded) {
            console.warn('Page did not fully load after 5 minutes (Suspension Type not found)');
        }


        // screenshot after page loaded
        // screenshots.push(await page.screenshot({ fullPage: true }));

        resObj.success = true;
        resObj.screenshots
            ? resObj.screenshots.push(...screenshots)
            : resObj.screenshots = screenshots;
        resObj.htmls = htmls;
        resObj.data = apexDataStore;


        return resObj;
    } catch (error) {
        return {
            error: error.message,
            screenshots: screenshots
        };
    }
};
