'use server';
import fs from 'fs';
import Prisma from "@/services/prisma";
import startScrape from '@/actions/scrape';
import { processBrowserless } from '@/utils/browserless';

const IS_DEV = process.env.NODE_ENV !== 'production';
const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

const FAREHARBOUR_USERNAME = process.env.FAREHARBOUR_USERNAME;
const FAREHARBOUR_PASSWORD = process.env.FAREHARBOUR_PASSWORD;

const getFuncBody = (func) => {
    const funcStr = func.toString();
    const match = funcStr.match(/^async\s*\([^)]*\)\s*=>\s*\{([\s\S]*)\}\s*$/);
    return match ? match[1].trim() : funcStr;
};
export const fairharbor = async () => {
    try {
        console.log('Fairharbor function called!');

        const innerFunc = async ({ page }) => {
            let resObj = {
                success: true,
                message: 'Fairharbor function executed successfully!',
                data: null,
                screenshots: [],
            };
            try {

                // Set the viewport to a desktop size, for example 1920x1080
                await page.setViewport({
                    width: 1920,
                    height: 1080,
                });

                // got to https://fareharbor.com/bildabike/login/ and locate
                // username input and password input and fill them with FAREHARBOUR_USERNAME and FAREHARBOUR_PASSWORD
                // then click the login button and wait for the page to load
                await page.goto(
                    'https://fareharbor.com/bildabike/login/',
                    { waitUntil: 'networkidle2', timeout: 240000 }
                );


                // find and fill username and password inputs
                await page.type('input[name="username"]', userName || '', { delay: 100 });
                await page.type('input[name="password"]', password || '', { delay: 100 });

                // click the login button and wait for the page to load
                await page.click('button[type="submit"]');
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 240000 });



                // await to for data-test-id="manifest-header-nav" to be loaded
                await page.waitForSelector('[data-test-id="manifest-header-nav"]', { timeout: 240000 });

                // //make a screenshot and save in
                // const screenshot1 = await page.screenshot({ fullPage: true });
                // resObj.screenshots.push({
                //     name: 'login_page.png',
                //     data: screenshot1,
                // });


                return resObj;

            } catch (error) {
                console.error('Error in Fairharbor function: ', error);
                resObj = {
                    success: false,
                    message: 'Error executing Fairharbor function: ' + error.message,
                    data: null,
                    screenshots: [],
                };

                return resObj;
            }
        };
        // =======================================================================================



        const str = `export default async function ({ page }) { const userName = ${JSON.stringify(FAREHARBOUR_USERNAME || '')}; const password = ${JSON.stringify(FAREHARBOUR_PASSWORD || '')};\n${getFuncBody(innerFunc)}\n}`.trim();

        let start = Date.now();
        let url = `${BROWSERLESS_URL}/function?token=${BROWSERLESS_TOKEN}&timeout=360000&stealth=true`;
        const fetchRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-cache'
            },
            body: str,
        });


        const data = await processBrowserless(fetchRes);
        console.log('Fairharbor function executed! Time taken: ', Date.now() - start, 'ms');
        console.log('Fairharbor result: ', data);

    } catch (error) {
        console.error(error);
    }
};

export const getSkusForEmail = async ({
    limit = 10,
    minPrice = 71,
    profit_margin_percent = 40,
    negativeKeywords = ['Surround Rails'],
    data = [],

}) => {

    const isOK = (sku, item) => {
        try {
            const keywords = Array.isArray(negativeKeywords)
                ? negativeKeywords
                : ['Surround Rails'];

            const itemName = String(item?.name || '').toLowerCase();
            const marginPercent = Number(sku?.profit_margin_percent || 0);
            const threshold = Number(profit_margin_percent || 0);

            const hasNegativeKeyword = keywords.some((kw) =>
                itemName.includes(String(kw || '').toLowerCase())
            );

            const p = sku.dealer_price || sku.normal_price || 0;

            return marginPercent >= threshold && !hasNegativeKeyword && p >= minPrice;
        } catch (error) {
            console.error("Error in isOK function: ", error);
            return false;
        }
    };

    try {

        const allSkus = [];
        for (const item of data) {
            const skuItems = item?.skus
                ? item.skus
                : item?.connect?.skus || [];

            for (const sku of skuItems) {
                allSkus.push({
                    ...sku,
                    product_image: item.product_image,
                    name: item.name,
                });
            }
        };

        // sort toSendData by profit_margin_percent desc
        // and not more than limit items
        allSkus.sort((a, b) => {
            if (a.profit_margin_percent > b.profit_margin_percent) return -1;
            if (a.profit_margin_percent < b.profit_margin_percent) return 1;
            return 0;
        });

        // save toSendData to file
        if (IS_DEV) {
            const filePath = `./data/skus_for_email_all.json`;
            fs.writeFileSync(filePath, JSON.stringify(allSkus, null, 2));
            console.log(`SKUs for email saved to ${filePath}`);
        };

        // slice all not meeting minPrice / margin / negative keywords
        const filteredSkus = allSkus.filter(sku => isOK(sku, sku));
        console.log(`SKUs after filtering by minPrice (${minPrice}): `, filteredSkus.length);

        const limitedData = filteredSkus.slice(0, limit);
        console.log("Matching data to send: ", limitedData.length, ' from total: ', data.length);

        // Fetch all matching SKUs in one query and merge prev margin into the payload.
        const skuIds = limitedData.map(item => item.id).filter(Boolean);
        const dbSkus = skuIds.length
            ? await Prisma.skus.findMany({
                where: {
                    id: { in: skuIds },
                },
                select: {
                    id: true,
                    prev_profit_margin: true,
                    profit_margin: true,
                },
            })
            : [];

        const dbSkuMap = new Map(dbSkus.map((sku) => [sku.id, sku]));
        const skusWithPrevMargin = limitedData.map((item) => {
            const dbRecord = dbSkuMap.get(item.id);
            return {
                ...item,
                prev_profit_margin: dbRecord?.prev_profit_margin ?? dbRecord?.profit_margin ?? 0,
            };
        });



        return skusWithPrevMargin;
    } catch (error) {
        console.error("Error in getSkusForEmail: ", error);
        return [];
    }
};


export const testButtonFunction = ({ workspace }) => {
    fairharbor();
    return;
    startScrape({
        workspaceId: workspace.id,
        callback: async (result) => {
            console.log('callback >>> Scrape result: ');
            getSkusForEmail({
                limit: 5000,
                profit_margin_percent: 40,
                negativeKeywords: ['Surround Rails'],
                data: result,
            })
        }
    });
};