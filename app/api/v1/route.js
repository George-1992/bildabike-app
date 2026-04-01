import startScrape from "@/actions/scrape";
import Prisma from "@/services/prisma";

const N8N_CALLBACK_URL = process.env.N8N_CALLBACK_URL || '';
const API_KEY = process.env.API_KEY || '';

export async function GET() {
    return Response.json({ message: 'Works' })
}
export async function POST(request) {
    let resObj = {
        success: false,
        message: '',
        data: null,
    }
    try {

        const requestBody = await request.json();
        const apiKey = request.headers.get('x-api-key') || '';
        const limit = requestBody.limit || 10;
        const profit_margin_percent = requestBody.profit_margin_percent || 40;

        const baseNegativeKeywords = ['Surround Rails'];
        const negativeKeywords = requestBody.negative_keywords || baseNegativeKeywords;
        // console.log("requestBody: ", requestBody);

        if (!apiKey) {
            resObj.message = 'API key is required';
            return Response.json(resObj, { status: 400 });
        }

        if (apiKey !== API_KEY) {
            resObj.message = 'Invalid API key';
            return Response.json(resObj, { status: 401 });
        }

        const workspace = await Prisma.workspaces.findFirst();
        if (!workspace) {
            resObj.message = 'No workspace found';
            return Response.json(resObj, { status: 404 })
        }

        const isOK = (sku, item) => {
            try {
                const keywords = Array.isArray(negativeKeywords)
                    ? negativeKeywords
                    : baseNegativeKeywords;

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
        }

        const wId = workspace.id;
        // initate scrapper 
        startScrape({
            workspaceId: wId,
            callback: async (result) => {
                try {
                    if (N8N_CALLBACK_URL) {
                        console.log("Sending data to n8n...");
                        const toSendData = [];
                        if (result && Array.isArray(result)) {
                            for (const item of result) {
                                if (item && item.connect && item.connect.skus && Array.isArray(item.connect.skus) && item.connect.skus.length > 0) {
                                    for (const sku of item.connect.skus) {
                                        if (isOK(sku, item)) {
                                            if (sku.dealer_price && parseFloat(sku.dealer_price) > 30) {
                                                toSendData.push({
                                                    ...sku,
                                                    product_image: item.product_image,
                                                    name: item.name,
                                                });
                                            }
                                        }
                                    }

                                }
                            }
                        };

                        // sort toSendData by profit_margin_percent desc
                        // and not more than limit items
                        toSendData.sort((a, b) => {
                            if (a.profit_margin_percent > b.profit_margin_percent) return -1;
                            if (a.profit_margin_percent < b.profit_margin_percent) return 1;
                            return 0;
                        });
                        const limitedData = toSendData.slice(0, limit);
                        console.log("Matching data to send: ", limitedData.length, ' from total: ', result.length);

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


                        fetch(N8N_CALLBACK_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(skusWithPrevMargin),
                        })

                    }
                } catch (error) {
                    console.error("Error in callback: ", error);
                }
            },
        });

        // console.log("workspace: ", workspace);
        resObj.success = true;
        resObj.data = workspace;
        return Response.json(resObj)

    } catch (error) {
        resObj.message = error.message || 'An error occurred';
        return Response.json(resObj, { status: 500 })
    }
}