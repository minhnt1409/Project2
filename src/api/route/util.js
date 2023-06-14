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
        const tasks = results.map(task => ({ task_id: task.task_id, task_name: task.task_name,begin:task.begin_at,end:task.end_at }));
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
                     const data = results.map(score=>({ room_id: score.room_id,score:score.last_score,createAt:score.created_at }));
                    
                     return callRes(res, responseError.OK, data);
                });
                })
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});
router.get('/get_survey' , wrapAsync(async(req, res) => {
  
    let {token} = req.body;
    console.log(token)
    if (!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
    const query=`
    SELECT  survey.id,survey.options_id as options, content, type, ops.answer as 'option'
    FROM survey 
    LEFT JOIN  (
        select options_id, JSON_ARRAYAGG(answer) as answer 
        from options group by options_id
        )  AS ops 
    ON survey.options_id=ops.options_id `
    connection.query(query, (err, results) => {
        console.log(err,results) 
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        const tasks = results.map(items => ({ id: items.id, options: items.options,content:items.content,type:items.type,option:items.option }));
        let data = { tasks: tasks };
        return callRes(res, responseError.OK, data);
    });
}));
router.post('/submit_survey' , wrapAsync(async(req, res) => {
  
    let {token,id,option} = req.body;
    console.log(token)
    if (!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
    const query=`
    INSERT INTO answer (option_choice)
    VALUES ('${option}')`
    connection.query(query, (err, results) => {
        console.log(err,results) 
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        return res.status(200).json({ code: 1000, message: 'OK' });
        
    });
}));
export { router };
