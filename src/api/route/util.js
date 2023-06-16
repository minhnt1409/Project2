import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import validInput from '../utils/validInput.js';
import responseError, { callRes } from '../response/response.js';
import verifyToken from '../middleware/authMiddleware.js';
import wrapAsync from '../utils/wrapAsync.js';
import { ForbiddenError, UnauthorizedError } from '../../common/errors.js';


import connection from '../../db/connect.js';

const router = express.Router();
const JWT_SECRET = 'maBiMat';




// API báo cáo: report
/**
 * @swagger
 * /util/report:
 *   post:
 *     summary: Báo cáo bình luận, báo cáo phòng và báo cáo người chơi
 *     description: Báo cáo dựa trên đầu vào là ID Room, ID người chơi và nội dung bình luận
 *     tags:
 *       - Utils
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIzIiwidXNlcklkIjo2LCJ1dWlkIjoiMDItNTAtMkEtRTItOTUtNkEiLCJpYXQiOjE2ODQ2NzQ0ODB9.1QDsdFAi-JbKWfrddzXto3ycpVN48VpBuS2Fn4uIHUQ
 *               room_id:
 *                 type: string
 *                 example: 2
 *               user_id:
 *                 type: string
 *                 example: 1
 *               content:
 *                 type: string
 *                 example: WTF not good
 *             required: true
 *     responses:
 *       200:
 *         description: Report/Báo cáo thành công
 */
router.post('/report', verifyToken, wrapAsync(async (req, res) => {
    // const authHeader = req.header("Authorization");
    // let token = authHeader && authHeader.split(" ")[1];
    let { room_id, user_id, content } = req.body;

    if(!room_id || !user_id || !content) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

    try {
        // verify token
        // const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        // console.log(decoded);
        

        // get data from DB
        const query = `SELECT room_id, user_id, content FROM report 
                        WHERE room_id = ${room_id} AND user_id = ${user_id} AND content = '${content}'`;
    
        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            callRes(res, responseError.OK);
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
}));

// API chặn người chơi(chỉ dành cho admin): set_block
/**
 * @swagger
 * /util/set_block:
 *   post:
 *     summary: Chặn người chơi (chỉ dành cho admin)
 *     description: Bloc dựa trên đầu vào là ID người chơi mà admin muốn block
 *     tags:
 *       - Utils
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXI0IiwidXNlcklkIjo3LCJ1dWlkIjoiMDItNTAtMkEtRTItOTUtNkEiLCJpYXQiOjE2ODU4ODA3MTF9.lzgoKlAAsQ0DBrznfYk8xdZQ4IljoDGjRwYx1nqpvhA
 *               user_id:
 *                 type: string
 *                 example: 2
 *             required: true
 *     responses:
 *       200:
 *         description: Block thành công
 */
router.post('/set_block', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
    let user_id = req.body.user_id;
    
    if (!token) {
        token = req.body.token;
        if (!token) throw new UnauthorizedError();
    }

    try {
        // verify token
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        console.log(decoded.userId);
        

        // check admin role
        const query = `SELECT role FROM users 
                        WHERE id = ${decoded.userId}`;
    
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

// API xem danh sách bị chặn (chỉ dành cho admin): get_list_block
/**
 * @swagger
 * /util/get_list_block:
 *   get:
 *     summary: Xem danh sách bị chặn (chỉ dành cho admin)
 *     description: Xác nhận role Admin của người dùng rồi trả về danh sách
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *     responses:
 *       200:
 *         description: Thông tin roommate mới, phòng mới và tin mới(news)
 */
router.get('/get_list_block', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        token = req.body.token;
        if (!token) throw new UnauthorizedError();
    }

    try {
        // verify token
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        console.log(decoded.userId);
        

        // check admin role
        const query = `SELECT role FROM users 
                        WHERE id = ${decoded.userId}`;
    
        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if (results[0].role != 'admin') return callRes(res, responseError.NOT_ACCESS, null);
            // console.log(results[0].role);
        });

        // get data from DB
        const query2 = `SELECT id, username, avatar FROM users WHERE is_block = 1`;

        connection.query(query2, function (error, results, fields) {
            console.log(error);
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            const data = results.map(result => {
                const { id, username, avatar } = result;
                return { 
                    user_id: id,
                    username: username,
                    avatar: avatar
                };
            });
            callRes(res, responseError.OK, data);
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});

// API search
/**
 * @swagger
 * /util/search:
 *   post:
 *     summary: Tìm kiếm - search
 *     description: Tìm kiếm bình luận, tìm kiếm phòng và tìm kiếm người chơi
 *     tags:
 *       - Utils
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXI0IiwidXNlcklkIjo3LCJ1dWlkIjoiMDItNTAtMkEtRTItOTUtNkEiLCJpYXQiOjE2ODU4ODA3MTF9.lzgoKlAAsQ0DBrznfYk8xdZQ4IljoDGjRwYx1nqpvhA
 *               keyword:
 *                 type: string
 *                 example: room
 *               index:
 *                 type: string
 *                 example: 6
 *               count:
 *                 type: string
 *                 example: 8
 *             required: true
 *     responses:
 *       200:
 *         description: Tìm kiếm thành công
 */
router.post('/search', verifyToken, wrapAsync(async (req, res) => {
    // const authHeader = req.header("Authorization");
    // let token = authHeader && authHeader.split(" ")[1];
    let { keyword, index, count } = req.body;

    if((keyword !== 0 && !keyword) || (index !== 0 && !index) || (count !== 0 && !count))
        return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, null);

    if(!validInput.checkNumber(index) || !validInput.checkNumber(count)) {
        console.log("chi chua cac ki tu so");
        return setAndSendResponse(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    index = parseInt(index, 10);
    count = parseInt(count, 10);
    if(isNaN(index) || isNaN(count)) {
        console.log("PARAMETER_VALUE_IS_INVALID");
        return setAndSendResponse(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    var founds1 = [];
    var founds2 = [];
    var founds3 = [];

    try {
        // verify token
        // const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        // console.log(decoded);

        // keyword = keyword.trim().toLowerCase();

        // 1. search comment data from DB
        const query = `SELECT comment_id, content, author_name, author_id, author_avatar, created FROM comments WHERE content LIKE '%${keyword}%'`;

        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            const data = results.map(result => {
                const { comment_id, content, author_name, author_id, author_avatar, created } = result;
                return {
                    // comments: {
                        comment_id: comment_id,
                        content: content,
                        author: {
                            username: author_name,
                            id: author_id,
                            avatar: author_avatar
                        },
                        created: created
                    // }
                };
            });
            // console.log('data');
            // console.log(data);
            founds1.push(data);
            // console.log('founds');
            // console.log(founds1.length);
            // console.log(JSON.stringify(founds));
        });

        // 2. search room data from DB
        const query2 = `SELECT room_id, room_name, current, max, speed, author_id, created, modified FROM rooms WHERE room_name LIKE '%${keyword}%'`;

        connection.query(query2, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            const data = results.map(result => {
                const { room_id, room_name, current, max, speed, author_id, author_name = 'Naaa', created, modified } = result;
                return {
                    // rooms: {
                        room_id: room_id,
                        room_name: room_name,
                        current: current,
                        max: max,
                        speed: speed,
                        author: {
                            username: author_name,
                            id: author_id,
                        },
                        created: created,
                        modified: modified
                    // }
                };
            });
            // console.log(data);
            founds2.push(data);
            // console.log(founds);
        });

        // 3. search user data from DB
        const query3 = `SELECT id, username, email, avatar FROM users WHERE username LIKE '%${keyword}%'`;

        connection.query(query3, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            const data = results.map(result => {
                const { id, username, email, avatar } = result;
                return {
                    // users: {
                        user_id: id,
                        username: username,
                        email: email,
                        avatar: avatar
                    // }
                };
            });
            // console.log(data);
            founds3.push(data);
            // console.log(founds3);

            // Return all result
            var founds = {
                comments: founds1[0],
                rooms: founds2[0],
                users: founds3[0]
            };

            // return callResNoConvert(res, responseError.OK, founds);
            res.status(200).send({
                code: "1000",
                message: "OK",
                data: {
                    result: founds
                }
            });
        });

    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
}));

// API lấy danh sách task
/**
 * @swagger
 * /util/get_list_task:
 *   get:
 *     summary: Lấy danh sách nhiệm vụ
 *     description: Lấy danh sách nhiệm vụ dựa trên token người chơi
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *    parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *     responses:
 *       200:
 *         description: Lấy danh sách task thành công
 */
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

// API lấy điểm
/**
 * @swagger
 * /util/get_score:
 *    get: 
 *     summary: Lấy điểm người chơi
 *     description: Lấy điểm người chơi với quyền admin
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *      - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: ID người dùng (mặc định là ID của người dùng đang xác thực)
 *      - in: query
 *         name: index
 *         schema:
 *           type: integer
 *         description: Vị trí bắt đầu của danh sách phòng (mặc định là 0)
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *         description: Số lượng phòng cần lấy (mặc định là 20)
 *     responses:
 *       200:
 *         description: Lấy điểm thành công
 */
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
// API lấy form khảo sát
/**
 * @swagger
 * /util/get_survey:
 *   get:
 *     summary: Lấy form khảo sát
 *     description: Lấy form khảo sát dựa theo token người chơi
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *     responses:
 *       200:
 *         description: Lấy điểm thành công
 */
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
// API nộp form khảo sát
/**
 * @swagger
 * /util/submit_survey:
 *   post:
 *     summary: Nộp form khảo sát
 *     description: Nộp form khảo sát sau khi điền form xong
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *      - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: id của form khảo sát
 *      - in: query
 *         name: option
 *         schema:
 *           type: string
 *         description: option mà user đã chọn nếu type là 0
 *     responses:
 *       200:
 *         description: Lấy điểm thành công
 */
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
// Gửi thông tin tọa độ
/**
 * @swagger
 * /util/update_position:
 *   post:
 *     summary: Lấy form khảo sát
 *     description: Lấy form khảo sát dựa theo token người chơi
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *      - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Tọa độ của người chơi
 *     responses:
 *       200:
 *         description: Lấy điểm thành công
 */
router.post('/update_position' , wrapAsync(async(req, res) => {
    let {token,position} = req.body;
    console.log(token)
    if (!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
    const query=`
    INSERT INTO position (x,y,z)
    VALUES ('${position.x}','${position.y}','${position.z}')`
    connection.query(query, (err, results) => {
        console.log(err,results) 
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        return res.status(200).json({ code: 1000, message: 'OK' });
        
    });
}));
export { router };
