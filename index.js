// Import the packages we need
const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();
const express = require('express');
const credentials = require('./suth-mamadoko-jtnw-3f968e753fb6.json');
const cors = require('cors');

// const app = express();
// const port = 5000;
// 

// Enable CORS for all routes
// app.use(cors());
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'SUTH_LINECHATBOT',
  password: '1234',
  port: 5432, // default PostgreSQL port
});


// Your credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);


// Other way to read the credentials
// const fs = require('fs');
// const CREDENTIALS = JSON.parse(fs.readFileSync('File path'));

// Your google dialogflow project-id
const PROJECID = "suth-mamadoko-jtnw";
const sessionId = 'abc';
const intentsClient = new dialogflow.IntentsClient({ PROJECID, credentials });
// const intentsClient = new dialogflow.IntentsClient();
const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

// Configuration for the client
const CONFIGURATION = {
  credentials: {
    private_key: CREDENTIALS['private_key'],
    client_email: CREDENTIALS['client_email']
  }
}

// Create a new session
// const sessionClient = new dialogflow.SessionsClient();
const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);
const sessionPath = sessionClient.projectAgentSessionPath(PROJECID, sessionId);


async function listIntents() {
  const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

  const [intents] = await intentsClient.listIntents({
    parent: projectAgentPath,
  });


  // console.log('Intents:');
  // intents.forEach(intent => {
  //   console.log(`- Intent ID: ${intent.name}`);
  //   console.log(`  Display Name: ${intent.displayName}`);
  // });
  const intentsData = intents.map(intent => ({
    id: intent.name,
    displayName: intent.displayName,
  }));
  return {
    intentsData
  };
}

//   listIntents();
async function createIntent(displayName) {
  const projectAgentPath = intentsClient.projectAgentPath(PROJECID);

  const intent = {
    displayName: 'test12',
    // trainingPhrases: [
    //   { parts: [{ text: 'TestFromApi 1' }] },
    //   { parts: [{ text: 'TestFromApi 2' }] },
    // ],
    // messages: [
    //   { text: { text: ['TestFromApi 1'] } },
    //   // { text: { text: ['TestFromApi 2'] } },
    // ],
  };

  const request = {
    parent: projectAgentPath,
    intent,
  };

  try {
    const [response] = await intentsClient.createIntent(request);
    return `Intent created: ${response.name}`;
    //   console.log(`Intent created: ${response.name}`);

  } catch (error) {
    console.error('Error creating intent:', error);
  }
}

// Detect intent method
const detectIntent = async (languageCode, queryText, sessionId) => {

  let sessionPath = sessionClient.projectAgentSessionPath(PROJECID, sessionId);

  // The text query request.
  let request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: queryText,
        // The language used by the client (en-US)
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log(responses);
  const result = responses[0].queryResult;
  console.log(result);

  return {
    response: result.fulfillmentText
  };
}

const getIntent = async (intentName) => {
  console.log(intentName)
  const request = {
    name: intentName,
    intentView: 'INTENT_VIEW_FULL',
  };

  try {
    const [response] = await intentsClient.getIntent(request);
    console.log('Intent details:', response)

    return response;

  } catch (error) {
    console.error('Error getting intent:', error);
  }
};

const addTrainingPhrases = async (intentName, word) => {
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
    return 'Training phrases added to intent: ' + response.name;
  } catch (error) {
    console.error('Error updating intent:', error);
    return 'Error updating intent: ' + error.message;
  }
};

// async function createIntent(displayName) {
//   const agentPath = intentsClient.projectAgentPath(PROJECID);

//   // const trainingPhrases = trainingPhrasesParts.map(part => {
//   //   return {
//   //     parts: [{ text: part }],
//   //   };
//   // });

//   // const message = {
//   //   text: { text: messageTexts },
//   // };

//   const intent = {
//     displayName: displayName,
//     // trainingPhrases: trainingPhrases,
//     // messages: [message],
//   };

//   const request = {
//     parent: agentPath,
//     intent: intent,
//   };

//   const [response] = await intentsClient.createIntent(request);
//   console.log(`Intent created: ${response.name}`);
// }


// detectIntent('en', 'hello', 'abcd1234');
// listIntents()

// Start the webapp
const webApp = express();

webApp.use(cors());

// Webapp settings
webApp.use(express.urlencoded({
  extended: true
}));
webApp.use(express.json());

// Server Port
const PORT = process.env.PORT || 5000;

// Home route
webApp.get('/', (req, res) => {
  res.send(`Hello World.!`);
});

webApp.get('/test', (req, res) => {
  res.send(`TEST`);
});

// Dialogflow route
webApp.post('/dialogflow', async (req, res) => {

  let languageCode = req.body.languageCode;
  let queryText = req.body.queryText;
  let sessionId = req.body.sessionId;

  let responseData = await detectIntent(languageCode, queryText, sessionId);

  res.send(responseData.response);
});

webApp.post('/listintent', async (req, res) => {
  let responseData = await listIntents();
  // res.send(responseData.response);
  res.json(responseData);
  // listIntents()
  //     .then(intentsData => {
  // console.log('Intents Data:', responseData.response);
  // res.send('Intents Data:', responseData.response);
  //         // Use intentsData as needed in your application
  //     })
  //     .catch(error => {
  //         console.error('Error:', error);
  //     });

});
webApp.post('/createintent', async (req, res) => {
  let displayName = req.body.displayName
  let responseData = await createIntent(displayName);
  res.send(responseData);
});

webApp.post('/getintent', async (req, res) => {
  let intentName = req.body.intentName;

  let responseData = await getIntent(intentName);
  res.send(responseData);
});

// webApp.post('/createtIntent',(req,res) =>{
// let displayName = req.displayName;
// let response = createIntent(displayName);

// res.send(response);

// });


webApp.post('/addTrainingPhrases', async (req, res) => {
  let intentName = req.body.intentName;
  let word = req.body.word;
  let responseData = await addTrainingPhrases(intentName, word);
  res.send(responseData);
});

webApp.post('/webhook', async (req, res) => {

  res.send(req.body);
  response = req.body;

  const fulfillmentText = response.queryResult.fulfillmentText;
  const intentName = response.queryResult.intent.name;
  const intentDisplayName = response.queryResult.intent.displayName;
  const queryText = response.queryResult.queryText;

  console.log('Intent Name: ', intentName);
  console.log('Intent Display Name: ', intentDisplayName);
  console.log('Fulfillment Text: ', fulfillmentText);
  // console.log(req.body);
  console.log('queryText: ',queryText);
 
    try {
      const result = await pool.query('INSERT INTO dialogflow."history" (word,intent) VALUES ($1,$2) RETURNING *', [queryText,intentDisplayName]);
      // res.json(result.rows[0]);
      // res.send(result.rows[0]);
      success = result.rows[0];
      console.log(success);
    } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  
  

});


webApp.get('/pg', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dialogflow."missingword" ORDER BY ID ASC');
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

webApp.post('/insert', async (req, res) => {
  const {word} = req.body;
  try {
    const result = await pool.query('INSERT INTO dialogflow."missingword" (word) VALUES ($1) RETURNING *', [word]);
    // res.json(result.rows[0]);
    res.send(result.rows[0]);
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
});


webApp.post('/pg/post/user', async (req, res) => {
  const {email,firstName,lastName,gender,idCard,lasorCode,namePrefix,phoneNumber,address,dateOfBirth,line_uid} = req.body;
  try {
    const result = await pool.query('INSERT INTO lineliff."users" (email,name_prefix,firstname,lastname,gender,phone_number,address,bod,id_card,lasor_code,line_uid) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *'
    , [email,namePrefix,firstName,lastName,gender,phoneNumber,address,"2023-12-26",idCard,lasorCode,line_uid]);
    // res.json(result.rows[0]);
    // res.send(result.rows[0]);
    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
});

// app.use((err, req, res, next) => {
//   res.status(500).json({ error: 'Internal Server Error' });
// });
// Start the server
webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});