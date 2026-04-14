import { emailScrape } from "@/actions/scrape";

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

      
        // console.log("requestBody: ", requestBody);

        if (!apiKey) {
            resObj.message = 'API key is required';
            return Response.json(resObj, { status: 400 });
        }

        if (apiKey !== API_KEY) {
            resObj.message = 'Invalid API key';
            return Response.json(resObj, { status: 401 });
        }


        emailScrape({
            requestBody,
        });

        // console.log("workspace: ", workspace);
        resObj.success = true;
        resObj.data = workspace;
        return Response.json(resObj)

    } catch (error) {
        resObj.message = error.message || 'An error occurred';
        return Response.json(resObj, { status: 500 })
    }
};