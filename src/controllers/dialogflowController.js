const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();
const express = require('express');
const credentials = require('../../suth-mamadoko-jtnw-3f968e753fb6.json');
const cors = require('cors');
const jwt = require("jsonwebtoken");

const PROJECID = "suth-mamadoko-jtnw";
const sessionId = 'abc';
const intentsClient = new dialogflow.IntentsClient({ PROJECID, credentials });
// const intentsClient = new dialogflow.IntentsClient();
const projectAgentPath = intentsClient.projectAgentPath(PROJECID);


const { Pool } = require('pg');
const secret = 'SUTH_LINE_WEB_ADMIN'

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'SUTH_LINECHATBOT',
    password: '1234',
    port: 5432, // default PostgreSQL port
});




async function listIntentForGet() {
    const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

    const [intents] = await intentsClient.listIntents({
        parent: projectAgentPath,
    });

    const intentsData = intents.map(intent => ({
        id: intent.name,
        displayName: intent.displayName,
    }));
    return intentsData;
}

async function listIntent(req, res) {
    const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

    const [intents] = await intentsClient.listIntents({
        parent: projectAgentPath,
    });

    const intentsData = intents.map(intent => ({
        id: intent.name,
        displayName: intent.displayName,
    }));
    res.send(intentsData);
}


const addTrainingPhrases = async (req, res) => {
    const { intentName, word, } = req.body
    console.log(intentName, word)
    try {
        // Fetch the existing intent to get the current training phrases
        const [existingIntent] = await intentsClient.getIntent({
            name: intentName,
            intentView: 'INTENT_VIEW_FULL',
        });
        console.log(existingIntent);

        // Combine existing training phrases with the new one
        const updatedTrainingPhrases = [
            ...(existingIntent.trainingPhrases || []),
            { parts: [{ text: word }] },
        ];

        // Update the intent with the combined set of training phrases
        const request = {
            intent: {
                name: intentName,
                trainingPhrases: updatedTrainingPhrases,
            },
            updateMask: {
                paths: ['training_phrases'],
            },
        };

        const [response] = await intentsClient.updateIntent(request);

        console.log(`Training phrases added to intent: ${response.name}`);
        res.status(200).send('Training phrases added to intent: ' + response.name);
    } catch (error) {
        console.error('Error updating intent:', error);
        res.status(500).send('Error updating intent: ' + error.message)

    }
};



const createIntent = async () => {
    let { intentName, messages, trainingPhrases } = req.body
    console.log(intentName, messages, trainingPhrases)
    const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

    const trainingPhrase = trainingPhrases.map(phrase => {
        return {
            parts: [{ text: phrase }],
            type: 'EXAMPLE',
        };
    });
    const linePayloads = messages.map(payload => {
        if (payload.text != null) {
            return {
                platform: 'LINE',
                text: {
                    text: [payload.text] // Ensure customText is within an array
                },
            };
        } else {
            return {
                platform: 'LINE',
                image: {
                    imageUri: payload.img // Add URL of the image here
                }

            };
        }
    });
    const intent = {
        displayName: intentName,
        trainingPhrases: trainingPhrase,
        messages: linePayloads,
        webhookState: 'WEBHOOK_STATE_ENABLED'
    };

    const request = {
        parent: projectAgentPath,
        intent,
    };

    try {
        const [response] = await intentsClient.createIntent(request);
        // return `Intent created: ${response.name}`;
        console.log(`Intent created: ${response.name}`);
        console.log(...linePayloads);
        res.send(response);


    } catch (error) {
        console.error('Error creating intent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const editIntent = async (req, res) => {
    let { id, intentName, messages, trainingPhrases } = req.body
    let intentID = '';
    let responseData = await listIntentForGet();
    // console.log('intents',responseData)

    if (Array.isArray(responseData)) {
        const matchingIntent = responseData.find(intent => intent.displayName == id);

        if (matchingIntent) {
            intentID = matchingIntent.id;
        } else {
            console.error('Intent not found in responseData.intents');
        }
    } else {
        console.error('responseData.intents is not an array');
    }
    console.log(intentName, messages, trainingPhrases)
    const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

    const trainingPhrase = trainingPhrases.map(phrase => {
        return {
            parts: [{ text: phrase }],
            type: 'EXAMPLE',
        };
    });
    const linePayloads = messages.map(payload => {
        if (payload.text != null) {
            return {
                platform: 'LINE',
                text: {
                    text: [payload.text] // Ensure customText is within an array
                },
            };
        } else {
            return {
                platform: 'LINE',
                image: {
                    imageUri: payload.img // Add URL of the image here
                }

            };
        }
    });
    const intent = {
        name: intentID,
        displayName: intentName,
        trainingPhrases: trainingPhrase,
        messages: linePayloads,
        webhookState: 'WEBHOOK_STATE_ENABLED'
    };

    const request = {
        parent: projectAgentPath,
        intent,
    };

    try {
        const [response] = await intentsClient.updateIntent(request);
        // return `Intent created: ${response.name}`;
        console.log(`Intent created: ${response.name}`);
        console.log(...linePayloads);
        res.send(response);


    } catch (error) {
        console.error('Error creating intent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getIntent = async (req, res) => {
    const intentName = req.body.params.intentName;
    console.log(req.body.params.intentName);
    let intentID = '';
    let responseData = await listIntentForGet();
    console.log(responseData);

    if (Array.isArray(responseData)) {
        const matchingIntent = responseData.find(intent => intent.displayName == intentName);

        if (matchingIntent) {
            intentID = matchingIntent.id;
        } else {
            console.error('Intent not found in responseData.intents');
        }
    } else {
        console.error('responseData.intents is not an array');
    }
    const request = {
        name: intentID,
        intentView: 'INTENT_VIEW_FULL',
    };
    try {
        const [intent] = await intentsClient.getIntent(request);
        console.log('Intent details:', intent)


        const trainingPhrases = (intent.trainingPhrases || []).map((phrase) =>
            (phrase.parts || []).map((part) => part.text).join(' ')
        );


        const responses = (intent.messages || []).flatMap((message) => {
            if (message.text && message.text.text) {
                return message.text.text;
            } else if (message.image && message.image.imageUri) {
                return message.image.imageUri;
            }
            return [];
        });

        // Send the extracted data as a response
        console.log(trainingPhrases, responses)
        res.json({
            trainingPhraseText: trainingPhrases,
            responses: responses,
            // imageResponse :imageResponses,
        });

    } catch (error) {
        res.status(400).json({ error: error });
        console.error('Error getting intent:', error);
    }
}

module.exports = {
    listIntent,
    addTrainingPhrases,
    createIntent,
    editIntent,
    getIntent,
    
}