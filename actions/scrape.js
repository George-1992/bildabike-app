'use server';
import fs from 'fs';
import Prisma from "@/services/prisma";

const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

const GG_USERNAME = process.env.GG_USERNAME || '';
const GG_PASSWORD = process.env.GG_PASSWORD || '';

const CCG_USERNAME = process.env.CCG_USERNAME || '';
const CCG_PASSWORD = process.env.CCG_PASSWORD || '';

const QBP_USERNAME = process.env.QBP_USERNAME || '';
const QBP_PASSWORD = process.env.QBP_PASSWORD || '';

export default async function startScrape({
    data = null,
    workspaceId = null,
}) {
    let resObj = {
        success: false,
        message: '',
        data: {},
    };

    try {

        const nowDate = new Date();
        console.log(`startScrape >>> Scrape started at ${nowDate.toISOString()}`);

        if (!BROWSERLESS_URL || !BROWSERLESS_TOKEN) {
            const missingVars = [];
            if (!BROWSERLESS_URL) missingVars.push('BROWSERLESS_URL');
            if (!BROWSERLESS_TOKEN) missingVars.push('BROWSERLESS_TOKEN');
            const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
            console.error(errorMessage);
            resObj.message = errorMessage;
            return resObj;
        }

        if (!workspaceId) {
            resObj.success = false;
            resObj.message = 'No workspaceId provided for scraping';
            return resObj;
        }

        // if (!data) {
        //     resObj.success = false;
        //     resObj.message = 'No data provided for scraping';
        //     return resObj;
        // }

        const result = await scrap({ workspaceId });
        console.log('startScrape >>> startScrape END : ', result.success, result.message);

        const scrapId = data && data?.id ? data.id : null;
        if (scrapId) {
            await Prisma.scraps.update({
                where: { id: scrapId },
                data: {
                    result: result,
                    status: 'completed',
                }
            });
        }

        saveDataToDB({ data: result.data, workspaceId });
        resObj = result;


        return resObj;

    } catch (error) {
        console.error('Error in startScrape function:', error);
        resObj.success = false;
        resObj.message = error.message;
        return resObj;
    }
}


const getProfitMargin = (item) => {
    try {
        // Handle both object with a/b properties and legacy properties
        let a = item.a || item.consumer_price || item.consumerPrice || 0;
        let b = item.b || item.dealer_price || item.dealerPrice || 0;

        if (!b) {
            b = item.normal_price || item.normalPrice || 0;
        }

        if (a === 0 || b === 0) {
            return {
                profit_margin: 0,
                profit_margin_percent: 0
            };
        }

        const margin = a - b;
        const percent = b > 0 ? parseFloat(((margin / a) * 100).toFixed(2)) : 0;

        return {
            profit_margin: margin,
            profit_margin_percent: percent
        };
    } catch (error) {
        console.error('Error calculating profit margin for item:', item, error);
        return {
            profit_margin: 0,
            profit_margin_percent: 0
        };
    }
}
const formatData = ({ data, source }) => {
    try {
        let newData = [];

        if (!data || !Array.isArray(data)) {
            console.warn('Data is not an array, returning original data');
            return [];
        }

        // console.log('formatData data: ', source);

        if (source === 'giantGroup') {
            for (const item of data) {

                const rdata = item?.response?.data?.returnValue;

                // console.log('rdata >>>>>>>: ', {
                //     url: item.url,
                //     payload: item.request
                //         ? item.request.payload
                //         : 'No request payload',
                //     rdata: rdata ? (Array.isArray(rdata) ? `Array of length ${rdata.length}` : 'Not an array') : 'No returnValue',
                // });


                if (rdata && Array.isArray(rdata)) {


                    for (const returnValue of rdata) {
                        const skus = returnValue?.skus;
                        if (!skus || !Array.isArray(skus)) {
                            console.warn('SKUs is not an array for item, skipping item:');
                            continue;
                        }

                        let obj = {
                            id: returnValue.id || "",
                            name: returnValue.name || "",
                            source: source || "",
                            in_stock: returnValue.inStock || false,
                            product_image: returnValue.productImageUrl || "",
                            record_url: returnValue.recordUrl || "",
                            skus: []
                        }


                        // add skus
                        if (returnValue.skus && Array.isArray(returnValue.skus)) {
                            for (const sku of returnValue.skus) {

                                // console.log('profit_margin: ', getProfitMargin(sku));

                                obj.skus.push({
                                    id: sku.id || "",
                                    name: sku.name || "",
                                    source: source || "",
                                    brand: sku.brand || "",
                                    product_type: sku.productType || "",
                                    quantity: sku.quantity || 0,
                                    size: sku.size || "",
                                    wheel_size_front: sku.wheelSizeFront || "",
                                    wheel_size_rear: sku.wheelSizeRear || "",

                                    normal_price: sku.normalPrice || 0,
                                    consumer_price: sku.consumerPrice || 0,
                                    dealer_price: sku.dealerPrice || 0,
                                    ...getProfitMargin(sku),
                                    record_url: sku.recordUrl || "",

                                    in_stock: sku.inStock || false,
                                    item_group_name: sku.itemGroupName || "",
                                    item_number: sku.itemNumber || "",
                                    level: sku.level || "",
                                    model: sku.model || "",
                                    model_series_name: sku.modelSeriesName || "",
                                    model_year: sku.modelYear || "",
                                });
                            }
                        }

                        newData.push(obj);
                    }
                }
            }

        }

        if (source === 'cyclingsportsgroup') {
            for (const item of data) {
                const url = item?.url || '';
                const isGet = item?.request?.method === 'GET';
                const allSkus = [];

                // first get bikes top level
                if (isGet && url.includes('SearchNavigationalProductApi')) {
                    for (const subItem of item?.response?.data?.['Results'] || []) {
                        let d = {
                            id: subItem.Id || "",
                            name: subItem.DisplayName || "",
                            source: source || "",
                            in_stock: subItem.inStock || false,
                            product_image: subItem.ImageUrl || "",
                            skus: (subItem?.['Variants'] || []).map(variant => ({
                                id: variant.VariantId || "",
                                name: subItem.DisplayName || "",
                                brand: subItem['Brand'] || "",
                                size: variant.Size || "",
                                model_year: subItem['ModelYear'] || "",
                            })) || []
                        }
                        newData.push(d);
                    }
                }

                // console.log('GetSKUsFromSAP: ', {
                //     url: url.includes('GetSKUsFromSAP'),
                //     isGet,
                // });

                if (!isGet && url.includes('GetSKUsFromSAP')) {
                    // console.log('item?.response?.data?.Results: ', item?.response?.data);

                    for (const subItem of item?.response?.data || []) {
                        let sd = {
                            id: subItem.Number || "",
                            // name: subItem.Name || "",
                            source: source || "",
                            in_stock: subItem.InStock || false,
                            // product_image: subItem.ImageUrl || "",
                            record_url: subItem.recordUrl || "",
                            item_number: subItem.Number || "",
                            // brand: subItem.Brand || "",
                            product_type: subItem.ProductType || "",
                            quantity: subItem.AvailableQuantity || 0,
                            // size: subItem.Size || "",
                            // wheel_size_front: subItem.WheelSizeFront || "",
                            // wheel_size_rear: subItem.WheelSizeRear || "",

                            normal_price: subItem.DealerHiddenPrice || 0,
                            consumer_price: subItem.MSRPSellingPrice || 0,
                            dealer_price: subItem.DealerHiddenPrice || 0,
                            ...getProfitMargin({
                                a: subItem.MSRPSellingPrice || 0,
                                b: subItem.DealerHiddenPrice || 0,
                            }),
                            // record_url: subItem.recordUrl || "",
                            // item_group_name: subItem.itemGroupName || "",
                            // item_number: subItem.ItemNumber || "",

                            // level: subItem.level || "",
                            // model: subItem.model || "",
                            // model_series_name: subItem.modelSeriesName || "",
                            // model_year: subItem.modelYear || "",
                        }

                        allSkus.push(sd);
                    }
                }

                // console.log('allSkus: ', allSkus?.length || 0);

                // loop over all skus and match with the top level bikes' skus , by merging
                for (const sku of allSkus) {
                    const matchedBike = newData.find(bike => bike.skus.some(s => s.id === sku.id));
                    if (matchedBike) {
                        matchedBike.skus = matchedBike.skus.map(s => {
                            if (s.id === sku.id) {
                                return {
                                    ...s,
                                    ...sku,
                                }
                            }
                            return s;
                        });
                    }
                }
            }
        }
        return newData;

    } catch (error) {
        console.error('Error formatting data:', error);
        return [];
    }
};
// giantGroup
const giantGroup = async () => {
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
//cyclingsportsgroup
const cyclingSportsGroup = async () => {
    let resObj = {
        success: false,
        message: 'aaaaaaaaaa',
        data: {},
    };
    try {
        const screenshots = [];
        const htmls = [];
        const apiDataStore = [];




        // Set the viewport to a desktop size, for example 1920x1080
        await page.setViewport({
            width: 1920,
            height: 1080,
        });

        // got to https://b2b.cyclingsportsgroup.com/Login
        await page.goto('https://b2b.cyclingsportsgroup.com/Login', { waitUntil: 'networkidle2', timeout: 240000 });

        // fill username and password and click login button
        await page.evaluate((userName, password) => {
            const container = document.querySelector('#LoginPage');
            if (!container) {
                throw new Error('Login container not found');
            }
            const usernameInput = container.querySelector("input[name='UserId']");
            const passwordInput = container.querySelector("input[name='Password']");
            const loginButton = container.querySelector("input[type='submit']");

            if (!loginButton) {
                throw new Error('Login button not found');
            }

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

        // Click login and wait for navigation
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 240000 }),
            page.evaluate(() => {
                const loginButton = document.querySelector('#LoginPage input[type="submit"]');
                if (loginButton) {
                    loginButton.click();
                }
            })
        ]);

        // Set up response interception BEFORE any navigation
        page.on('response', async (response) => {
            const url = response.url();
            const funcPush = (data) => {
                apiDataStore.push(data);
            };
            if (url.includes('/api/sitecore')) {
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

        // scrap data
        const scrapLinks = [
            'https://b2b.cyclingsportsgroup.com/en/NA/ProductCategory.aspx?id=315c616e-5ea4-4f51-b4eb-acf780db1914&mode=list&hideSoldOut=false',
        ]

        // visit each link and wait for the network to be idle
        for (const link of scrapLinks) {
            await page.goto(link, { waitUntil: 'networkidle0', timeout: 240000 });

            // Additional wait to ensure all async operations complete
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        // screenshots.push(await page.screenshot({ fullPage: true }));

        resObj.success = true;
        resObj.message = 'Scrape completed successfully';
        resObj.screenshots
            ? resObj.screenshots.push(...screenshots)
            : resObj.screenshots = screenshots;
        resObj.htmls = htmls;
        resObj.data = apiDataStore;
        resObj.apiDataStore = apiDataStore;

        return resObj;
    } catch (error) {
        console.error('Error in cyclingSportsGroup function:', error);
        resObj.success = false;
        resObj.message = error.message;
        return resObj;
    }
};

// qbp
const qbp = async () => {
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

// ======================================================
// execute the function and return the result
const scrap = async ({ workspaceId } = {}) => {
    let resObj = {
        success: false,
        message: '',
        data: {},
    };
    try {
        const funcStr = giantGroup.toString();
        // Match the function body between the first { and last }
        const getFuncBody = (func) => {
            const funcStr = func.toString();
            const match = funcStr.match(/^async\s*\(\)\s*=>\s*\{([\s\S]*)\}\s*$/);
            return match ? match[1].trim() : funcStr;
        }

        const tasks = [
            {
                name: 'giantGroup',
                stealth: true,
                timeout: 240000,
                data: `export default async function ({ page }) { const userName = "${GG_USERNAME}"; const password = "${GG_PASSWORD}";\n${getFuncBody(giantGroup)}\n}`.trim(),
                isLocalSave: false,
                result: null,
            },
            {
                name: 'cyclingsportsgroup',
                stealth: true,
                timeout: 240000,
                data: `export default async function ({ page }) { const userName = "${CCG_USERNAME}"; const password = "${CCG_PASSWORD}";\n${getFuncBody(cyclingSportsGroup)}\n}`.trim(),
                isLocalSave: false,
                result: null,
                isDbSave: true,
                workspaceId,
            },
            // {
            //     name: 'qbp',
            //     stealth: true,
            //     timeout: 240000,
            //     data: `export default async function ({ page }) { const userName = "${QBP_USERNAME}"; const password = "${QBP_PASSWORD}";\n${getFuncBody(qbp)}\n}`.trim(),
            //     isLocalSave: false,
            //     result: null,
            //     isDbSave: false,
            //     workspaceId,
            // }
        ]

        // console.log('tasks >>> ', tasks.map(t => ({ name: t.name, dataLength: t.data.length, stealth: t.stealth, timeout: t.timeout })));

        const processTask = async ({ task }) => {
            let url = `${BROWSERLESS_URL}/function?token=${BROWSERLESS_TOKEN}`;
            if (task.timeout) {
                url += `&timeout=${task.timeout}`;
            }
            if (task.stealth) {
                url += `&stealth=true`;
            }

            // console.log('url: ', url);
            // console.log('Sending function code (first 200 chars):', task.data.substring(0, 200));

            let start = Date.now();
            const fetchRes = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/javascript',
                    'Cache-Control': 'no-cache'
                },
                body: task.data,
            });
            let end = Date.now();
            console.log(`Fetch time: ${(end - start) / 1000} seconds`);

            console.log('Response status:', fetchRes.status);
            const responseText = await fetchRes.text();

            if (!fetchRes.ok) {
                console.error('Error response:', responseText);
                throw new Error(`HTTP ${fetchRes.status}: ${responseText}`);
            }

            if (!responseText || responseText.trim() === '') {
                throw new Error('Empty response from browserless');
            }

            const resultPre = JSON.parse(responseText);
            // return resultPre;

            const result = {
                ...resultPre,
                clcError: resultPre?.clcError || null,
                data: formatData({
                    data: resultPre.data,
                    source: task.name
                })
            };


            // if screenshots exist save in screenshots folder
            if (result.screenshots && result.screenshots.length > 0) {
                if (!fs.existsSync('screenshots')) {
                    fs.mkdirSync('screenshots');
                }
                result.screenshots.forEach((screenshot, index) => {
                    const buffer = Buffer.from(screenshot, 'base64');
                    const filePath = `screenshots/screenshot_${Date.now()}_${index}.png`;
                    fs.writeFileSync(filePath, buffer);
                    console.log('Saved screenshot:', filePath);
                });
            }

            return result;

            // save htmls in htmls folder
            if (result.htmls && result.htmls.length > 0) {
                if (!fs.existsSync('htmls')) {
                    fs.mkdirSync('htmls');
                }
                result.htmls.forEach((html, index) => {
                    const filePath = `htmls/page_${Date.now()}_${index}.html`;
                    fs.writeFileSync(filePath, html);
                    console.log('Saved html:', filePath);
                });
            }


            console.log('result: ', {
                ...result,
                screenshots: result.screenshots ? result.screenshots.length : undefined,
                htmls: result.htmls ? result.htmls.length : undefined,
            });

            // save result in result.json
            const resultFilePath = `result_${Date.now()}.json`;
            fs.writeFileSync(resultFilePath, JSON.stringify({
                ...result,
                screenshots: result.screenshots ? result.screenshots.length : undefined,
                htmls: result.htmls ? result.htmls.length : undefined,
            }, null, 2));
            console.log('Saved result:', resultFilePath);

        }


        for (const task of tasks) {
            const thisResult = await processTask({ task });
            // console.log(`thisResult >>> `, thisResult);
            task.result = thisResult;

            // if (task.isLocalSave) {
            //     const localFilePath = `./result/local_result_${Date.now()}.json`;
            //     fs.writeFileSync(localFilePath, JSON.stringify(thisResult, null, 2));
            //     console.log('Saved local result:', localFilePath);
            // }
            if (task.isDbSave) {
                await saveDataToDB({
                    data: [{ name: task.name, result: thisResult }],
                    workspaceId: task.workspaceId,
                });
            }
        }

        resObj.success = true;
        resObj.message = 'Scrape completed successfully';
        resObj.data = tasks.map(t => ({ name: t.name, result: t.result }));
        return resObj;

    } catch (error) {
        console.error('Error in scrap function:', error);
        resObj.success = false;
        resObj.message = error.message;

        return resObj;
    }
};


// db saver
const saveDataToDB = async ({ data, workspaceId }) => {
    try {

        for (const item of data) {
            if (!item.name || !item.result) {
                console.warn('Data item missing name or result, skipping:', item);
                continue;
            }

            const dtoSaveData = [];
            const thisData = item.result.data;
            for (const dataItem of thisData) {
                let sd = dataItem;
                if (dataItem.skus) {
                    sd.connect = {
                        skus: dataItem.skus
                    }
                }
                dtoSaveData.push(sd);
            }

            // First, upsert all bikes
            for (const sd of dtoSaveData) {
                await Prisma.bikes.upsert({
                    where: { id: sd.id },
                    update: {
                        name: sd.name,
                        source: sd.source,
                        in_stock: sd.in_stock,
                        product_image: sd.product_image,
                        record_url: sd.record_url,
                        workspace: {
                            connect: { id: workspaceId }
                        }
                    },
                    create: {
                        id: sd.id,
                        name: sd.name,
                        source: sd.source,
                        in_stock: sd.in_stock,
                        product_image: sd.product_image,
                        record_url: sd.record_url,
                        workspace: {
                            connect: { id: workspaceId }
                        }
                    }
                });
            }

            // Then, upsert all SKUs (now that bikes exist)
            for (const sd of dtoSaveData) {
                if (sd.connect?.skus?.length) {
                    for (const sku of sd.connect.skus) {
                        await Prisma.skus.upsert({
                            where: { id: sku.id },
                            update: {
                                ...sku,
                                bike: { connect: { id: sd.id } },
                                workspace: { connect: { id: workspaceId } }
                            },
                            create: {
                                ...sku,
                                bike: { connect: { id: sd.id } },
                                workspace: { connect: { id: workspaceId } }
                            }
                        });
                    }
                }
            }
        }

        console.log('saveDataToDB >>> Data saved to DB successfully');
    } catch (error) {
        console.error('saveDataToDB >>> Error saving data to DB:', error);
    }
}