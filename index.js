const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(bodyParser.json());

// Configuration
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || 'EAAZAVjgp450sBSyvoEVUAgfv1wOXDvF3KhjVuTNGn9EKay65ImDm6DjiNrFUV1ZBkL92UYFEXdGFc4U6xeZC0k6jUg4MxJxxHn9i611sFTxnrH6GVdUyybAXJoTbNh0DRwiHhuGZBgryZAb8anMfXo5J90kmYILsNPewOhOSsyIHaE6lVCoqMVmaNPAUJZAcuG0ZAjma8rSPwZDZD'; // Apnar Facebook Page Access Token ekhane din
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'my_secure_verify_token_123';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LfCKeMbMG56IObUA-_J2fgL1OftK0zvgDJw_juZJEZ3w'; // Apnar Gemini API Key ekhane din

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Webhook Verification
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Message Receive & Reply
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            if (entry.messaging && entry.messaging.length > 0) {
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;

                if (webhook_event.message && webhook_event.message.text) {
                    let received_message = webhook_event.message.text.trim();
                    handleMessage(sender_psid, received_message);
                }
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Message Logic Handler
async function handleMessage(sender_psid, received_message) {
    let responseText = "";

    // Jodi user /admin likhe, tahole developer Efty-er info dibe
    if (received_message.toLowerCase() === '/admin') {
        responseText = "Developer / Admin Details:\n\nName: Efty\nContact: Developer Efty-er sathe jogajog korte ba support pete ekhane message korun.";
        let response = { "text": responseText };
        callSendAPI(sender_psid, response);
        return;
    }

    // Onnanno question er jonno Gemini API call hobe
    try {
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `You are a helpful customer service assistant for an e-commerce clothing page named Premium Fashion Style (PFS). Answer the customer's query politely in Bengali: ${received_message}` }]
                }
            ]
        });

        responseText = geminiResponse.text || "Dukkhito, ei muhurte uttor dite parchi na.";
    } catch (error) {
        console.error('Gemini API Error:', error);
        responseText = "Dukkhito, technical somossar karone uttor dewa shombhob hocche na.";
    }

    let response = { "text": responseText };
    callSendAPI(sender_psid, response);
}

// Facebook Send API Call
function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": { "id": sender_psid },
        "message": response
    };

    axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, request_body)
        .then(res => console.log('Message sent successfully!'))
        .catch(err => console.error('Error sending message:', err.response ? err.response.data : err.message));
}

// Local server support
if (process.env.NODE_ENV !== 'production') {
    app.listen(1337, () => console.log('Webhook server is listening on port 1337'));
}

module.exports = app;
