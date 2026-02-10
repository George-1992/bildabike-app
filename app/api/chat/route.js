import HandleAiRequest from "@/components/aiAgent/functions/helper";


export async function POST(req) {
    return HandleAiRequest(req);
}


export async function GET(req) {
    return HandleAiRequest(req);
}