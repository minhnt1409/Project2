import mysql from 'mysql2';
import dotenv from 'dotenv';
import responseError from '../api/response/response.js';
import { callRes } from '../api/response/response.js';

dotenv.config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'api',
});

connection.connect((error,res) => {
    if (error) {
        console.log('Cannot connect to database:', error);
        return callRes(res, responseError.CAN_NOT_CONNECT_TO_DB, null);
    }
    console.log('Connected to database.');
});

export default connection;