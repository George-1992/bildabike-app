'use server';
import fs from 'fs';
import Prisma from "@/services/prisma";
// import dummyData from "../result_pre_cyclingsportsgroup_1774635040215.json";

const IS_DEV = process.env.NODE_ENV !== 'production';

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
    callback = null,
}) {
    let resObj = {
        success: false,
        message: '',
        data: {},
    };

    // console.log('workspaceId: ', workspaceId);
    // return resObj;

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

        // saveDataToDB({ data: result.data, workspaceId });
        if (callback && typeof callback === 'function') {
            const cd = [];
            result.data.forEach(item => {
                if (item.result && item.result.data)
                    cd.push(...item.result.data);
            });
            callback(cd);
        };
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

        if (!data) {
            console.warn('formatData >>> Data is not an array, returning [] data');
            return [];
        }


        if (source === 'giantGroup') {
            if (!Array.isArray(data)) {
                console.warn('formatData >>> Data is not an array for giantGroup, returning [] data');
                return [];
            }
            for (const item of (data && Array.isArray(data)) ? data : []) {

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

            const sourceItems = data?.items || [];
            const items = [];
            const allVariantItems = data?.variantItems || [];

            // console.log('>>> formatData sourceItems: ', sourceItems?.length || 0);
            // console.log('>>> formatData allVariantItems: ', allVariantItems?.length || 0);
            // console.log('>>> formatData sourceItems[0]: ', sourceItems[0]);


            for (const item of sourceItems) {
                const bike = {}
                bike.id = item?.['Id'] || "";
                bike.name = item?.['DisplayName'] || "";
                bike.source = source || "";
                bike.in_stock = item?.['InStock'] || false;
                bike.product_image = item?.['ImageUrl'] || "";
                bike.skus = []

                // loop over item.Variants and find matching from
                //  allVariantItems by id, then merge the data
                if (item?.Variants && Array.isArray(item.Variants)) {
                    for (const sku of item.Variants) {
                        const matchedVariant = allVariantItems.find(variant => variant['Number'] === sku['VariantId']);
                        if (matchedVariant) {
                            let sd = {
                                id: matchedVariant.VariantId || matchedVariant.Number || "",
                                name: matchedVariant.Name || matchedVariant.DisplayName || matchedVariant.ItemDescription || "",
                                source: source || "",
                                in_stock: item?.['InStock'] || matchedVariant.InStock || false,
                                record_url: matchedVariant.RecordUrl || matchedVariant.recordUrl || "",
                                item_number: matchedVariant.Number || matchedVariant.ItemNumber || "",
                                brand: matchedVariant.Brand?.BrandName || "",
                                brand: "Cannondale",
                                product_type: matchedVariant.ProductType || "",
                                quantity: matchedVariant.AvailableQuantity || 0,
                                size: matchedVariant.Size || "",
                                wheel_size_front: matchedVariant.WheelSizeFront || "",
                                wheel_size_rear: matchedVariant.WheelSizeRear || "",
                                level: matchedVariant.Level || "",
                                model: matchedVariant.Model || "",
                                model_series_name: matchedVariant.ModelSeriesName || "",
                                model_year: matchedVariant.ModelYear || "",
                                item_group_name: matchedVariant.ItemGroupName || "",

                                normal_price: matchedVariant.DealerHiddenPrice || 0,
                                consumer_price: matchedVariant.MSRPSellingPrice || 0,
                                dealer_price: matchedVariant.DealerHiddenPrice || 0,
                                ...getProfitMargin({
                                    a: matchedVariant.MSRPSellingPrice || 0,
                                    b: matchedVariant.DealerHiddenPrice || 0,
                                }),
                            };

                            bike.skus.push(sd);
                        }
                    }
                }

                items.push(bike);
            }

            newData = items;

            // for (const item of data) {
            //     const url = item?.url || '';
            //     const isGet = item?.request?.method === 'GET';
            //     const allSkus = [];

            //     // first get bikes top level
            //     if (isGet && url.includes('SearchNavigationalProductApi')) {
            //         for (const subItem of item?.response?.data?.['Results'] || []) {
            //             let d = {
            //                 id: subItem.Id || "",
            //                 name: subItem.DisplayName || "",
            //                 source: source || "",
            //                 in_stock: subItem.inStock || false,
            //                 product_image: subItem.ImageUrl || "",
            //                 skus: (subItem?.['Variants'] || []).map(variant => ({
            //                     id: variant.VariantId || "",
            //                     name: subItem.DisplayName || "",
            //                     brand: subItem['Brand'] || "",
            //                     size: variant.Size || "",
            //                     model_year: subItem['ModelYear'] || "",
            //                 })) || []
            //             }
            //             newData.push(d);
            //         }
            //     }

            //     // console.log('GetSKUsFromSAP: ', {
            //     //     url: url.includes('GetSKUsFromSAP'),
            //     //     isGet,
            //     // });

            //     if (!isGet && url.includes('GetSKUsFromSAP')) {
            //         for (const subItem of item?.response?.data || []) {
            //             let sd = {
            //                 id: subItem.VariantId || subItem.Number || "",
            //                 name: subItem.Name || subItem.DisplayName || subItem.ItemDescription || "",
            //                 source: source || "",
            //                 in_stock: subItem.InStock || false,
            //                 record_url: subItem.RecordUrl || subItem.recordUrl || "",
            //                 item_number: subItem.Number || subItem.ItemNumber || "",
            //                 brand: subItem.Brand || "",
            //                 product_type: subItem.ProductType || "",
            //                 quantity: subItem.AvailableQuantity || 0,
            //                 size: subItem.Size || "",
            //                 wheel_size_front: subItem.WheelSizeFront || "",
            //                 wheel_size_rear: subItem.WheelSizeRear || "",
            //                 level: subItem.Level || "",
            //                 model: subItem.Model || "",
            //                 model_series_name: subItem.ModelSeriesName || "",
            //                 model_year: subItem.ModelYear || "",
            //                 item_group_name: subItem.ItemGroupName || "",

            //                 normal_price: subItem.DealerHiddenPrice || 0,
            //                 consumer_price: subItem.MSRPSellingPrice || 0,
            //                 dealer_price: subItem.DealerHiddenPrice || 0,
            //                 ...getProfitMargin({
            //                     a: subItem.MSRPSellingPrice || 0,
            //                     b: subItem.DealerHiddenPrice || 0,
            //                 }),
            //             }

            //             allSkus.push(sd);
            //         }
            //     }

            //     // console.log('allSkus: ', allSkus?.length || 0);

            //     // loop over all skus and match with the top level bikes' skus , by merging
            //     const unmatchedSkus = [];
            //     for (const sku of allSkus) {
            //         const matchedBike = newData.find(bike => bike.skus.some(s => s.id === sku.id));
            //         if (matchedBike) {
            //             matchedBike.skus = matchedBike.skus.map(s => {
            //                 if (s.id === sku.id) {
            //                     return {
            //                         ...s,
            //                         ...sku,
            //                     }
            //                 }
            //                 return s;
            //             });
            //         } else {
            //             unmatchedSkus.push(sku);
            //         }
            //     }

            //     if (unmatchedSkus.length > 0) {
            //         const fallbackGroups = new Map();

            //         for (const sku of unmatchedSkus) {
            //             const fallbackKey = sku.item_group_name || sku.model || sku.model_series_name || sku.name || sku.id;

            //             if (!fallbackGroups.has(fallbackKey)) {
            //                 fallbackGroups.set(fallbackKey, {
            //                     id: fallbackKey,
            //                     name: sku.item_group_name || sku.model || sku.model_series_name || sku.name || sku.id,
            //                     source: source || "",
            //                     in_stock: sku.in_stock || false,
            //                     product_image: "",
            //                     record_url: sku.record_url || "",
            //                     model_year: sku.model_year || "",
            //                     skus: [],
            //                 });
            //             }

            //             const bike = fallbackGroups.get(fallbackKey);
            //             bike.in_stock = bike.in_stock || sku.in_stock;
            //             bike.record_url = bike.record_url || sku.record_url || "";
            //             bike.model_year = bike.model_year || sku.model_year || "";
            //             bike.skus.push(sku);
            //         }

            //         newData.push(...Array.from(fallbackGroups.values()));
            //     }
            // }
        }
        return newData;

    } catch (error) {
        console.error('ERROR: formatting data:', error);
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
const cyclingSportsGroup = async () => {
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
        };

        const tasks = [
            {
                name: 'giantGroup',
                stealth: true,
                timeout: 360000,
                data: `export default async function ({ page }) { const userName = "${GG_USERNAME}"; const password = "${GG_PASSWORD}";\n${getFuncBody(giantGroup)}\n}`.trim(),
                isLocalSave: false,
                result: null,
                getResult: (obj) => {
                    const result = {
                        ...obj,
                        clcError: obj?.clcError || null,
                        data: formatData({
                            data: obj.data,
                            source: 'giantGroup'
                        })
                    };
                    return result;
                },
            },
            {
                name: 'cyclingsportsgroup',
                stealth: true,
                timeout: 360000,
                data: `export default async function ({ page }) { const userName = "${CCG_USERNAME}"; const password = "${CCG_PASSWORD}";\n${getFuncBody(cyclingSportsGroup)}\n}`.trim(),
                isLocalSave: false,
                result: null,
                isDbSave: true,
                workspaceId,
                // logger: (obj) => {
                //     console.log('cyclingsportsgroup logger: ', obj);
                // },
                getResult: (obj) => {
                    // console.log('getResult obj', obj);
                    const formattedData = formatData({
                        data: obj?.data,
                        source: 'cyclingsportsgroup'
                    })
                    // console.log('formattedData', formattedData);

                    const result = {
                        ...obj,
                        data: formattedData
                    };

                    return result;
                }
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
        ];

        const processTask = async ({ task }) => {

            // // =============test code start===========
            // return task.getResult(dummyData)
            // // =============test code end===========
            console.log(`Processing task: ${task.name}...`);


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
            console.log(`scrap >>> processTask >>>Done, Fetch time: ${(end - start) / 1000} seconds, task:`, task.name, 'success: ', fetchRes.ok);

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


            const result = task.getResult
                ? task.getResult(resultPre)
                : resultPre;

            // if screenshots exist save in screenshots folder
            if (IS_DEV) {
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
            }

            if (task.logger) {
                task.logger(result);
            }

            console.log(`scrap >>> processTask >>> Processed result for task: ${task.name}, message: ${result.message}`);
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

        };

        console.log('Starting tasks... total tasks: ', tasks.length);

        for (const task of tasks) {
            console.log('=======================');
            console.log(`Starting task: ${task.name}`);


            const thisResult = await processTask({ task });
            // console.log(`thisResult >>> `, task.name, 'thisResult: ', thisResult.message)
            task.result = thisResult;

            // if (task.isLocalSave) {
            //     const localFilePath = `./result/local_result_${Date.now()}.json`;
            //     fs.writeFileSync(localFilePath, JSON.stringify(thisResult, null, 2));
            //     console.log('Saved local result:', localFilePath);
            // }
            if (task.isDbSave) {
                console.log('scrap >>> Saving to DB for task: ', task.name);
                await saveDataToDB({
                    data: [{ name: task.name, result: thisResult }],
                    workspaceId: task.workspaceId,
                });
                console.log('Saved to DB: ', task.name);
            }

            console.log(`Completed task: ${task.name}, message: ${thisResult.message}`);
            console.log('');
        }

        resObj.success = true;
        resObj.message = 'Scrape completed successfully';
        resObj.data = tasks.map(t => ({ name: t.name, result: t.result }));
        return resObj;

    } catch (error) {
        console.error('scrap >>> Error in scrap function:', error);
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
                    delete sd.skus;
                }
                dtoSaveData.push(sd);
            }

            // console.log(' dtoSaveData[0]: ', dtoSaveData[0]);
            // return;

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

            const skuIds = dtoSaveData.flatMap(sd =>
                sd.connect?.skus?.map(sku => sku.id).filter(Boolean) || []
            );

            const existingSkus = skuIds.length
                ? await Prisma.skus.findMany({
                    where: {
                        id: { in: skuIds }
                    },
                    select: {
                        id: true,
                        profit_margin: true,
                    }
                })
                : [];

            const existingSkuProfitMarginMap = new Map(
                existingSkus.map(existingSku => [existingSku.id, existingSku.profit_margin])
            );

            // Then, upsert all SKUs (now that bikes exist)
            for (const sd of dtoSaveData) {
                if (sd.connect?.skus?.length) {
                    for (const sku of sd.connect.skus) {
                        const prevProfitMargin = existingSkuProfitMarginMap.get(sku.id) ?? 0;

                        await Prisma.skus.upsert({
                            where: { id: sku.id },
                            update: {
                                ...sku,
                                prev_profit_margin: prevProfitMargin,
                                bike: { connect: { id: sd.id } },
                                workspace: { connect: { id: workspaceId } }
                            },
                            create: {
                                ...sku,
                                prev_profit_margin: prevProfitMargin,
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
