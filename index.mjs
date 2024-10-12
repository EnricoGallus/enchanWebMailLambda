import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import axios from 'axios';
const sesClient = new SESClient({ region: 'us-east-1' });

const FROM_EMAIL = process.env.FROM_EMAIL;
const TO_EMAIL = process.env.TO_EMAIL;
const reCapUrl = 'https://www.google.com/recaptcha/api/siteverify';
const reCaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
const accessControlAllowOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
const reCaptchaThreshold = 0.7;

const response = (statusCode, message) => {
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Origin': accessControlAllowOrigin,
        },
        body: JSON.stringify({ message: message }),
    }
}

export const handler = async (event) => {
    let inquireData;
    try {
        inquireData = JSON.parse(event.body);
    } catch (error) {
        return response(400, 'Invalid request body');
    }

    if (!inquireData.name || !inquireData.email || !inquireData.message || !inquireData.token) {
        return response(400, 'Missing required fields');
    }

    let verifyResult = await axios({
        method: 'post',
        url: reCapUrl,
        params: {
            secret: reCaptchaSecret,
            response: inquireData.token
        }
    })

    if (!verifyResult.data.success || verifyResult.data.score < reCaptchaThreshold) {
        return response(400, 'Invalid CAPTCHA');
    }

    const params = {
        Source: FROM_EMAIL,
        Destination: {
            ToAddresses: [TO_EMAIL],
        },
        Message: {
            Subject: {
                Data: 'Website Inquire from: ' + inquireData.name,
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: 'name: ' + inquireData.name + '<br>nemail: ' + inquireData.email + '<br><br>message: ' + inquireData.message,
                    Charset: 'UTF-8'
                },
            },
        },
    };

    const sendEmailCommand = new SendEmailCommand(params);

    try {
        await sesClient.send(sendEmailCommand);
        return response(200, 'Email sent successfully');
    } catch (error) {
        return response(500, 'Error sending email');
    }
};
