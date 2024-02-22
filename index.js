// Import the packages we need
const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();
const express = require('express');
const credentials = require('./suth-mamadoko-jtnw-3f968e753fb6.json');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const dialogflowRoute = require('./src/routes/dialogflowRoute');
const lineRoute = require('./src/routes/lineRoute');
const pgRoute = require('./src/routes/pgRoute');
const userRoute = require('./src/routes/userRoute');

// const app = express();
const PORT = 5000;
const webApp = express();
webApp.use(bodyParser.json());
webApp.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// Enable CORS for all routes
webApp.use(cors());
const { Pool } = require('pg');
const secret = 'SUTH_LINE_WEB_ADMIN'

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'SUTH_LINECHATBOT',
  password: '1234',
  port: 5432, // default PostgreSQL port
});

webApp.use('/dialogflow', dialogflowRoute);
webApp.use('/user', userRoute);
webApp.use('/line', lineRoute);
webApp.use('/pg', pgRoute);
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

webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});