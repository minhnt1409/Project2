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
router.post('/report', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
    let { room_id, user_id, content } = req.body;

    if(!room_id || !user_id || !content) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

    try {
        // verify token
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        

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
});

// API chặn người chơi(chỉ dành cho admin): set_block
router.post('/set_block', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
    let { user_id } = req.body;

    if(!user_id) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

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

// API xem danh sách bị chặn (chỉ dành cho admin): get_list_block
router.get('/get_list_block', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];

    // if(!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

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

        // get data from DB
        const query2 = `SELECT id, username, avatar FROM users WHERE is_block = 1`;

        connection.query(query2, function (error, results, fields) {
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
router.post('/search', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
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
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);

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
});

export { router };
