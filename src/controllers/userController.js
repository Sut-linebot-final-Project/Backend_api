const secret = 'SUTH_LINE_WEB_ADMIN'
const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const bcrypt = require("bcrypt");
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'SUTH_LINECHATBOT',
    password: '1234',
    port: 5432, // default PostgreSQL port
});


const login = async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM dialogflow.user WHERE email = $1'
            , [email]);
        // res.json(result.rows[0]);
        // res.send(result.rows[0]);

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).send({ message: "Invalid email or password" });
        }
        const token = jwt.sign({ email, role: user.level }, secret, { expiresIn: "1h" });
        res.json({ message: 'Login Success', token, user });

    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Login fail', error });
    }

}
const getUSer = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM dialogflow.user");
        res.send(result.rows);
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getuserByID = async (req, res) => {
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
}

const createUser = async (req, res) => {
    const { email, level, password, name } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query('INSERT INTO dialogflow."user" (email,level,password,name) VALUES ($1,$2,$3,$4) RETURNING *'
            , [email, level, hash, name]);
        // res.json(result.rows[0]);
        // res.send(result.rows[0]);

        res.status(200).json({ message: 'User Create successfully' });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
const updateUser = async (req, res) => {
    console.log(req.body);
    const { name, password, id, email, level } = req.body;
    const hash = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query('UPDATE dialogflow."user"  SET email = $1, password = $2, name = $3, level = $4  WHERE id = $5 ', [email, hash,name,level,id]);
        res.status(200).json({ message: 'User Update successfully' });
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



module.exports = {
    login,
    getUSer,
    getuserByID,
    createUser,
    updateUser
}