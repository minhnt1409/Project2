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
    let { room_id, user_id, content } = req.body;
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

export { router };
