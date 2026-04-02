import { getSkusForEmail } from "@/actions/other";
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
        const minPrice = requestBody.minPrice || 60;

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



        const wId = workspace.id;
        // initate scrapper 
        startScrape({
            workspaceId: wId,
            callback: async (result) => {
                try {
                    if (N8N_CALLBACK_URL) {
                        console.log("Sending data to n8n...");

                        const toSendData = await getSkusForEmail({
                            limit: limit,
                            minPrice: minPrice,
                            profit_margin_percent: profit_margin_percent,
                            negativeKeywords: negativeKeywords,
                            data: result,
                        });

                        fetch(N8N_CALLBACK_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(toSendData),
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