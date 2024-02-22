const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'SUTH_LINECHATBOT',
  password: '1234',
  port: 5432, // default PostgreSQL port
});

const getHistorrGraph = async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(intent) as log,intent FROM dialogflow.history Group by intent');
        res.send(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const questionList = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM dialogflow.missingquestion");
        res.send(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
const insertHistory = async (req, res) => {
    const { word } = req.body;
    try {
        const result = await pool.query('INSERT INTO dialogflow."history" (word) VALUES ($1) RETURNING *', [word]);
        // res.json(result.rows[0]);
        res.send(result.rows[0]);
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const updateHistory = async (req, res) => {
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
}


const updateQuestion = async (req, res) => {
    const word = req.body.word;
    const id = req.body.id;
    console.log(word);
    try {
        const result = await pool.query('UPDATE dialogflow."missingquestion"  SET status = $1 WHERE question = $2 ', ['assign', word]);
        res.send(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteQuestion = async (req, res) => {
    const word = req.body.word
    console.log(word);
    try {
        const result = await pool.query('UPDATE dialogflow."missingquestion"  SET status = $1 WHERE question = $2 ', ['delete', word]);
        res.send(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const countRes = async (req, res) => {
    try {
        const result = await pool.query("SELECT COUNT(intent) as response,intent FROM dialogflow.history GROUP BY intent");
        res.send(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getHistorrGraph,
    questionList,
    insertHistory,
    updateHistory,
    deleteQuestion,
    updateQuestion,
    countRes,
}