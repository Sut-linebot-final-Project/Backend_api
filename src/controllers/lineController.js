
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'SUTH_LINECHATBOT',
    password: '1234',
    port: 5432, // default PostgreSQL port
});

const createUserLine = async (req, res) => {
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
}

const getUserLine = async (req, res) => {
    console.log(req.body)
    const { line_uid } = req.body;
    try {
        const result = await pool.query('select * from lineliff."users" where line_uid = $1'
            ,[line_uid]);
        // res.json(result.rows[0]);
        if (!result.rows[0]) {
          return res.status(400).json({ error: 'User not found' })
        }
        // res.send(result.rows[0]);
        return res.status(200).json({ message: 'User found' });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    createUserLine,
    getUserLine,
}