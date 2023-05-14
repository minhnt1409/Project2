import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import responseError from '../response/response.js';
import { callRes } from '../response/response.js';

// Import database connection
import connection from '../../db/connect.js';

const router = express.Router();

const JWT_SECRET = 'maBiMat';
//api 29 get_list_task
router.get('/get_list_task', (req, res) => {
  
    const token = req.body.token;
    //if (!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);

    // truy vấn cơ sở dữ liệu
    connection.query(`SELECT * FROM tasks`, (err, results) => {
        console.log(results)
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        const tasks = results.map(task => ({ task_id: task.task_id, task_name: task.task_name,begin:task.begin,end:task.end }));
        let data = { tasks: tasks };
        return callRes(res, responseError.OK, data);
    });
});
router.get('/get_score', async (req, res) => {
    let token = req.headers.authorization;
    token = token.replace('Bearer ', '');
    const {index, count, user_id} = req.body;
    

    // Kiểm tra xác thực token của admin
    try {
        console.log(111, token);
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        const sql = 'SELECT * FROM users WHERE id = ?';
        connection.query(sql, [userId], (err, results) => {
            if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if (results.length === 0) return callRes(res, responseError.USER_IS_NOT_VALIDATED, null);
            if (results[0].role === 'admin') {
                // Thêm phòng mới vào database
                const getScoreQueryString = `SELECT * FROM score `;
                }})
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});
export { router };
