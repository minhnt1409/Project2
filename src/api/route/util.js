import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import responseError from '../response/response.js';
import { callRes } from '../response/response.js';
import verifyToken from '../middleware/authMiddleware.js';
import wrapAsync from '../utils/wrapAsync.js';
// Import database connection
import connection from '../../db/connect.js';

const router = express.Router();
const JWT_SECRET = 'maBiMat';

//api 29 get_list_task
router.get('/get_list_task' , wrapAsync(async(req, res) => {
  
    let {token} = req.body;
    console.log(token)
    if (!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
    const query=`SELECT * FROM tasks`
    connection.query(query, (err, results) => {
        console.log(err,results)
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        const tasks = results.map(task => ({ task_id: task.task_id, task_name: task.task_name,begin:task.begin,end:task.end }));
        let data = { tasks: tasks };
        return callRes(res, responseError.OK, data);
    });
}));
router.get('/get_score', async (req, res) => {
    let {token, index,count,user_id } = req.body;
   
    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        const query = `SELECT role FROM users WHERE id = ${user_id}`;

        connection.query(query,function (err, results, fields)  {
          
            if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
            
            if(results[0].role != 'admin') return callRes(res, responseError.NOT_ACCESS, null);
            const query2=`SELECT * FROM score `
                connection.query(query2, (err, results) => {
                    if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
                   console.log(results)
                    // let data = { score: score_id };
                    return callRes(res, responseError.OK, results);
                });
                })
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});
export { router };
