import mysql from 'mysql2';
import dotenv from 'dotenv';
import responseError from '../api/response/response.js';
import { callRes } from '../api/response/response.js';

dotenv.config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: 'api',
});

connection.connect(error => {
    if (error) {
        console.log('Cannot connect to database:', error);
        return callRes(res, responseError.CAN_NOT_CONNECT_TO_DB, null);
    }
    console.log('Connected to database.');
});

export default connection;