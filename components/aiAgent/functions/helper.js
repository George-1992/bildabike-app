import {
    convertToModelMessages, generateText,
    streamText, tool, stepCountIs,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import Prisma from '@/services/prisma';

const aiModelName = 'gpt-4o-mini'; // Valid OpenAI model
// Define the tool with Zod schema directly
const logToConsoleTool = tool({
    description: 'Log a message to the console',
    inputSchema: z.object({
        message: z
            .string()
            .describe('The message to log to the console'),
    }),
    execute: async ({ message }) => {
        console.log('=======  TOOL ====== Console log from AI:', message);
    },
});
const dbRequestTool = tool({
    description: 'Query the products database',
    inputSchema: z.object({
        where: z.string("")
            .describe('parsable, JS/JSON object representing Prisma where object to find leads from the postgres database'),
        limit: z
            .number()
            .min(1)
            .max(100)
            .default(20)
            .describe('Maximum number of records to return'),
    }),
    execute: async ({ where, limit }) => {
        try {
            console.log('=======  TOOL START: dbRequestTool ======');
            console.log('args: ', { where, limit });


            let result = null;
            let whereObj = null;
            try {
                whereObj = where ? JSON.parse(where) : {};
            } catch (error) {
                console.error('DB Request Tool: Error parsing "where" parameter:', error?.message || error);
            }


            if (where && !whereObj) {
                console.error('DB Request Tool: "where" parameter is invalid JSON. Returning null.');
                return null;
            }

            // if (!whereObj || Object.keys(whereObj).length === 0) {
            //     console.log('DB Request Tool: "where" parameter is empty. Returning empty array.');
            //     return result;
            // }
            // console.log('whereObj: ', whereObj);

            let prismaObj = {};
            if (limit) {
                prismaObj.take = limit;
            }
            if (whereObj && Object.keys(whereObj).length > 0) {
                prismaObj.where = whereObj;
            }

            result = Prisma.leads.findMany(prismaObj);

            return result;

        } catch (error) {
            console.error('DB Request Tool Error:', error?.message || error);
            return error?.message || 'error getting data';
        }
    },
});


export default async function HandleAiRequest(req) {
    try {

        const { messages } = await req.json();
        const result = streamText({
            model: openai(aiModelName),
            system:
                `if user ask or you feel you need to get data on leads use the dbRequestTool to query the leads database.`
                + `if tools return no data, null or empty array use it to form your response.`
                + `if valid data is returned from the tool, use it to form your response.`
                + `if asked about pipline it means lead stages: lead, pendingApp, screening, preQualified, preApproval, active, pastClients, other.`

            ,
            messages: convertToModelMessages(messages),
            tools: {
                logToConsole: logToConsoleTool,
                dbRequestTool: dbRequestTool,
            },
            // maxSteps: 6,
            stopWhen: stepCountIs(10),//to allow multiple tool calls then response
        });

        // console.log('result steps:', await result?.steps);

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error('Error handling AI request:', error?.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });

    }
}