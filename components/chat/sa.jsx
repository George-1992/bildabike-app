'use server';

import { Twilio } from "twilio";

// Import the Twilio client

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export const sendSms = async ({ phoneNumber, message }) => {
    let resObj = {
        success: false,
        message: 'Unknown error',
        data: null,
    };

    try {
        // Initialize the Twilio client
        const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        // Send SMS using Twilio API directly
        const twilioMessage = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        console.log('Twilio Message :', twilioMessage);


        resObj.success = true;
        resObj.message = 'SMS sent successfully';
        resObj.data = { sid: twilioMessage.sid };

        return resObj;
    } catch (error) {
        console.error('Error in sendSms:', error);
        resObj.message = error.message || 'Error sending SMS';
        resObj.success = false;
        return resObj;
    }
}