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

        const wId = workspace.id;
        // initate scrapper 
        startScrape({
            workspaceId: wId,
            callback: (result) => {
                try {
                    if (N8N_CALLBACK_URL) {
                        console.log("Sending data to n8n...");
                        const toSendData = [];
                        if (result && Array.isArray(result)) {
                            for (const item of result) {
                                if (item && item.connect && item.connect.skus && Array.isArray(item.connect.skus) && item.connect.skus.length > 0) {
                                    for (const sku of item.connect.skus) {
                                        if (sku.profit_margin_percent >= profit_margin_percent) {
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

                        fetch(N8N_CALLBACK_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(limitedData),
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