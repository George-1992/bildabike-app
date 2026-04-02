'use server';
import fs from 'fs';
import Prisma from "@/services/prisma";
import startScrape from '@/actions/scrape';

const IS_DEV = process.env.NODE_ENV !== 'production';
const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;


export const fairharbor = () => {
    try {

    } catch (error) {
        console.error(error);
    }
};

export const getSkusForEmail = async ({
    limit = 10,
    minPrice = 60,
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

            return marginPercent >= threshold && !hasNegativeKeyword;
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

        // slice all not meeting minPrice
        const filteredSkus = allSkus.filter(sku => {
            const p = sku.dealer_price || sku.normal_price || 0;
            return p >= minPrice;
        });
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
}



export const testButtonFunction = ({ workspace }) => {
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