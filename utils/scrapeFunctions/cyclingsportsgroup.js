//cyclingsportsgroup
const cyclingSportsGroup_OLD = async () => {
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
        // collect data from api calls that include "sitecore" in the URL, and store in apiDataStore
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

        // find ddBikes id div and get all uniqe hrefs under it
        const bikeLinks = await page.evaluate(() => {
            const excludeStrings = [
                '#', 'javascript:void(0)',
                'db4d07de-2c14-4397-a08f-0f89fb550002',
                '1d5fb1a7-4e01-473e-8e5e-355b90bf5714',
            ];
            const container = document.querySelector('#ddBikes');
            if (!container) {
                return [];
            }
            const anchors = container.querySelectorAll('a');
            const hrefs = new Set();
            anchors.forEach(a => {
                const href = a.getAttribute('href');
                if (href && href.startsWith('/') && !excludeStrings.some(str => href.includes(str))) {
                    hrefs.add(`https://b2b.cyclingsportsgroup.com${href}`);
                }
            });
            return Array.from(hrefs);

        });
        const scrapLinks = bikeLinks.slice(0, 5); // limit to first 5 links for testing


        // // scrap data
        // const scrapLinks = [
        //     'https://b2b.cyclingsportsgroup.com/en/NA/ProductCategory.aspx?id=315c616e-5ea4-4f51-b4eb-acf780db1914&mode=list&hideSoldOut=false',
        // ];

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
        // resObj.bikeLinks = bikeLinks;

        return resObj;
    } catch (error) {
        console.error('Error in cyclingSportsGroup function:', error);
        resObj.success = false;
        resObj.message = error.message;
        return resObj;
    }
};
const cyclingSportsGroup_OLD_2 = async () => {
    let resObj = {
        success: false,
        message: '',
        data: {},
    };
    try {
        const screenshots = [];
        const htmls = [];
        const apiDataStore = [];
        const skus = ["C68554M10MD", "C68554M10LG", "C68554M20MD", "C68554M20LG"];



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

        // Make API request from inside the logged-in browser context
        let debugData = null;
        try {
            const sapPayload = {
                skus: skus,
                reqDate: new Date().toISOString().slice(0, 10),
            };

            debugData = await page.evaluate(async (payload) => {
                const url = 'https://b2b.cyclingsportsgroup.com/api/sitecore/B2BProducts/GetSKUsFromSAP';
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                };

                const response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers,
                    body: JSON.stringify(payload),
                });

                const rawText = await response.text();
                let parsedData = null;

                try {
                    parsedData = rawText ? JSON.parse(rawText) : null;
                } catch (parseError) {
                    parsedData = {
                        parseError: parseError.message,
                        rawText,
                    };
                }

                return {
                    url,
                    request: {
                        method: 'POST',
                        payload: JSON.stringify(payload),
                        headers,
                    },
                    response: {
                        status: response.status,
                        ok: response.ok,
                        headers: Object.fromEntries(response.headers.entries()),
                        data: parsedData,
                    }
                };
            }, sapPayload);


            if (!debugData?.response?.ok) {
                throw new Error(`CSG API request failed with status ${debugData?.response?.status || 'unknown'}`);
            }
        } catch (error) {
            console.error('Error making CSG API request:', error);
            debugData = {
                error: error.message,
            };
        }


        resObj.success = true;
        resObj.message = 'Scrape completed successfully';
        resObj.screenshots
            ? resObj.screenshots.push(...screenshots)
            : resObj.screenshots = screenshots;
        // resObj.htmls = htmls;
        resObj.data = [debugData];
        // resObj.debug = debugData;

        // resObj.apiDataStore = apiDataStore;
        // resObj.bikeLinks = bikeLinks;

        return resObj;
    } catch (error) {
        console.error('Error in cyclingSportsGroup function:', error);
        resObj.success = false;
        resObj.message = error.message;
        return resObj;
    }
};
export const cyclingSportsGroup = async () => {
    let resObj = {
        success: false,
        message: 'aaaaaaaaaa',
        data: {},
    };
    try {
        const screenshots = [];
        const htmls = [];



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


        // find ddBikes id div and get all uniqe hrefs under it
        const bikeLinks = await page.evaluate(() => {
            const excludeStrings = [
                '#', 'javascript:void(0)',
                'db4d07de-2c14-4397-a08f-0f89fb550002',
                '1d5fb1a7-4e01-473e-8e5e-355b90bf5714',
            ];
            const container = document.querySelector('#ddBikes');
            if (!container) {
                return [];
            }
            const anchors = container.querySelectorAll('a');
            const hrefs = new Set();
            anchors.forEach(a => {
                const href = a.getAttribute('href');
                if (href && href.startsWith('/') && !excludeStrings.some(str => href.includes(str))) {
                    hrefs.add(`https://b2b.cyclingsportsgroup.com${href}`);
                }
            });
            return Array.from(hrefs);

        });

        const _sIds = bikeLinks.map(link => {
            // extract 4f2567fc-7e03-47c0-833e-121c8c378beb from
            // https://b2b.cyclingsportsgroup.com/en/NA/ProductCategory.aspx?id=4f2567fc-7e03-47c0-833e-121c8c378beb&mode=list&hideSoldOut=false
            const match = link.match(/id=([^&]+)/);
            return match ? match[1] : null;
        });

        const toScrapeLinks = _sIds.map(id => {
            return `https://b2b.cyclingsportsgroup.com/api/sitecore/B2BProducts/SearchNavigationalProductApi?Id=${id}&pageSize=1000`;
        })

        // open all of the toScrapeLinks
        // and save the output json
        const items = [];
        for (const link of toScrapeLinks) {
            try {
                const response = await page.goto(link, { waitUntil: 'networkidle2', timeout: 240000 });
                const json = await response.json();
                if (json['Results']) {
                    items.push(...json['Results'])
                }
            }
            catch (error) {
                console.error(`Error fetching ${link}:`, error);
                items.push({
                    url: link,
                    error: error.message,
                });
            }
        }

        const allVariantIds = [];
        items.forEach(item => {
            if (item.Variants) {
                item.Variants.forEach(variant => {
                    if (variant.VariantId) {
                        allVariantIds.push(variant.VariantId);
                    }
                });
            }
        });

        // fetch by 200 batches from
        // https://b2b.cyclingsportsgroup.com/api/sitecore/B2BProducts/GetSKUsFromSAP
        const allVariantItems = [];
        for (let i = 0; i < allVariantIds.length; i += 200) {
            const batch = allVariantIds.slice(i, i + 200);
            try {
                const response = await page.evaluate(async (batch) => {
                    const url = 'https://b2b.cyclingsportsgroup.com/api/sitecore/B2BProducts/GetSKUsFromSAP';
                    const reqDate = new Date().toISOString().split('T')[0];

                    const fetchResponse = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json, text/plain, */*',
                        },
                        body: JSON.stringify({
                            skus: batch,
                            reqDate,
                        }),
                    });

                    if (!fetchResponse.ok) {
                        throw new Error(`GetSKUsFromSAP failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
                    }

                    return fetchResponse.json();
                }, batch);

                const rows = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                        ? response
                        : [];
                allVariantItems.push(...rows);
            } catch (error) {
                console.error(`Error fetching SKUs for batch ${i}-${i + 200}:`, error);
            }
        }

        resObj.success = true;
        resObj.message = 'Scrape completed successfully';
        resObj.screenshots
            ? resObj.screenshots.push(...screenshots)
            : resObj.screenshots = screenshots;
        // resObj.htmls = htmls;
        resObj.data = {
            items: items,
            variantItems: allVariantItems,
        };
        // resObj.bikeLinks = bikeLinks;
        // resObj._sIds = _sIds;
        // resObj.toScrapeLinks = toScrapeLinks;
        // resObj.items = items;
        // resObj.allVariantIds = allVariantIds;
        // resObj.allVariantItems = allVariantItems.length;

        return resObj;
    } catch (error) {
        console.error('Error in cyclingSportsGroup function:', error);
        resObj.success = false;
        resObj.message = error.message;
        return resObj;
    }
};