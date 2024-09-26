import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
const sesClient = new SESClient({ region: 'us-east-1' });
const FROM_EMAIL = process.env.FROM_EMAIL;
const TO_EMAIL = process.env.TO_EMAIL;

export const handler = async (inquireData) => {
    if (!inquireData.name || !inquireData.email || !inquireData.message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields' }),
        };
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
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error sending email' }),
        };
    }
};
