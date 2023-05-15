import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import validInput from '../utils/validInput.js';
import responseError, { callRes } from '../response/response.js';

// Import database connection
import connection from '../../db/connect.js';

const router = express.Router();

const JWT_SECRET = 'maBiMat';

// API báo cáo: report
router.post('/report', async (req, res) => {
    let { token, room_id, user_id, content } = req.body;

    if(!token || !room_id || !user_id || !content) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

    try {
        // verify token
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        

        // get data from DB
        const query = `SELECT room_id, user_id, content FROM report 
                        WHERE room_id = ${room_id} AND user_id = ${user_id} AND content = ${content}`;
    
        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            callRes(res, responseError.OK);
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});

// API chặn người chơi(chỉ dành cho admin): set_block
router.post('/set_block', async (req, res) => {
    let { token, user_id } = req.body;

    if(!token || !user_id) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

    try {
        // verify token
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        

        // check admin role
        const query = `SELECT role FROM users 
                        WHERE id = ${user_id}`;
    
        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if(results[0].role != 'admin') return callRes(res, responseError.NOT_ACCESS, null);
        });

        // update user's state in DB
        const query2 = `UPDATE users SET is_block = 1 WHERE id = ${user_id}`;

        connection.query(query2, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            callRes(res, responseError.OK);
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});

export { router };
