// Import the packages we need
const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();
const express = require('express');
const credentials = require('./suth-mamadoko-jtnw-3f968e753fb6.json');
const cors = require('cors');
const jwt = require("jsonwebtoken");

// const app = express();
// const port = 5000;
// 

// Enable CORS for all routes
// app.use(cors());
const { Pool } = require('pg');
const secret = 'SUTH_LINE_WEB_ADMIN'

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
    displayName: displayName,
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

};

const addTrainingPhrases = async (intentName, word) => {
  console.log(intentName,word)
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

webApp.get('/listintent', async (req, res) => {
  let responseData = await listIntents();
  res.json(responseData);

});
webApp.post('/createintent', async (req, res) => {

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
});
webApp.post('/edit-intent', async (req, res) => {
  let { id, intentName, messages, trainingPhrases } = req.body
  let intentID = '';
  let responseData = await listIntents();

  if (Array.isArray(responseData.intentsData)) {
    const matchingIntent = responseData.intentsData.find(intent => intent.displayName == id);

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
});
webApp.post('/getintent', async (req, res) => {
  const intentName = req.body.params.intentName;
  console.log(req.body.params.intentName);
  let intentID = '';
  let responseData = await listIntents();
  // console.log(responseData);

  if (Array.isArray(responseData.intentsData)) {
    const matchingIntent = responseData.intentsData.find(intent => intent.displayName == intentName);

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
});



webApp.post('/addTrainingPhrases', async (req, res) => {
  let { intentName, word } = req.body;
  // let word = req.body.word;
  let responseData = await addTrainingPhrases(intentName, word);
  res.send(responseData);
});
webApp.post('/deleteIntent', async (req, res) => {
  try {
      const {intentId} = req.body;

      
      // Call Dialogflow API to delete intent
      await intentsClient.deleteIntent({name: intentId});

      console.log(`Intent ${intentId} deleted`);
      res.status(200).json({ message: 'Intent deleted successfully' });
  } catch (error) {
      console.error('Error deleting intent:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
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
  console.log('queryText: ', queryText);

  try {
    const result = await pool.query('INSERT INTO dialogflow."history" (word,intent,status) VALUES ($1,$2,$3) RETURNING *', [queryText, intentDisplayName, 'not assign']);
    // res.json(result.rows[0]);
    // res.send(result.rows[0]);
    success = result.rows[0];
    console.log(success);
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }



});



webApp.get('/pg/historyGraph', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(intent) as log,intent FROM dialogflow.history Group by intent');
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

webApp.get('/pg/questionlist', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM dialogflow.history where intent = 'Default Fallback Intent'");
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

webApp.post('/pg/insertHistory', async (req, res) => {
  const { word } = req.body;
  try {
    const result = await pool.query('INSERT INTO dialogflow."history" (word) VALUES ($1) RETURNING *', [word]);
    // res.json(result.rows[0]);
    res.send(result.rows[0]);
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

webApp.post('/pg/updateHistory', async (req, res) => {
  const word = req.body.word;
  const id = req.body.id;
  console.log(word);
  try {
    const result = await pool.query('UPDATE dialogflow."history"  SET status = $1 WHERE id = $2 ', ['assign', id]);
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

webApp.post('/pg/deleteHistory', async (req, res) => {
  const word = req.body.word
  console.log(word);
  try {
    const result = await pool.query('UPDATE dialogflow."history"  SET status = $1 WHERE word = $2 ', ['delete', word]);
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


webApp.post('/pg/post/user', async (req, res) => {
  const { email, firstName, lastName, gender, idCard, lasorCode, namePrefix, phoneNumber, address, dateOfBirth, line_uid } = req.body;
  try {
    const result = await pool.query('INSERT INTO lineliff."users" (email,name_prefix,firstname,lastname,gender,phone_number,address,bod,id_card,lasor_code,line_uid) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *'
      , [email, namePrefix, firstName, lastName, gender, phoneNumber, address, "2023-12-26", idCard, lasorCode, line_uid]);
    // res.json(result.rows[0]);
    // res.send(result.rows[0]);
    res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

});

webApp.post('/pg/login', async (req, res) => {
  console.log(req.body)
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM dialogflow.user WHERE email = $1 and password = $2'
      , [email, password]);
    // res.json(result.rows[0]);
    // res.send(result.rows[0]);

    const userData = result.rows[0];
    if (userData) {
      const token = jwt.sign({ email, role: userData.level }, secret, { expiresIn: "1h" });
      res.json({ message: 'Login Success', token, userData });
    } else {
      res.status(401).json({ error: 'Login failed: Invalid email or password' });
    }
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Login fail', error });
  }

});

webApp.get('/pg/getuser', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM dialogflow.user");
    res.send(result.rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
webApp.post('/pg/getuserByID', async (req, res) => {
  const { userid } = req.body
  console.log(userid)
  try {
    const result = await pool.query("SELECT * FROM dialogflow.user where id = $1", [userid]);
    console.log(result.rows[0])
    res.send(result.rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
webApp.post('/pg/createuser', async (req, res) => {
  const { email,level,password } = req.body;
  try {
    const result = await pool.query('INSERT INTO dialogflow."user" (email,level,password) VALUES ($1,$2,$3) RETURNING *'
      , [email,level,password]);
    // res.json(result.rows[0]);
    // res.send(result.rows[0]);
    res.status(200).json({ message: 'User Create successfully' });
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