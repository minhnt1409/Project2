import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
// import { v4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import validInput from '../utils/validInput.js';
import responseError from '../response/response.js';
import { callRes } from '../response/response.js';
const MAX_WORD_COMMENT = 500;
const COUNT_DEFAULT  = 2;
const JWT_SECRET = process.env.JWT_SECRET;

// Import database connection
import connection from '../../db/connect.js';
import verifyToken from '../middleware/authMiddleware.js'

const router = express.Router();

function countWord(str) {
    return str.split(" ").length;
}

function dateFormat(date) {
    return `${new Date(date).getFullYear()}-${new Date(date).getMonth()}-${new Date(date).getDate()} ${new Date(date).getHours()}:${new Date(date).getMinutes()}:${new Date(date).getSeconds()}`
}

// API lấy các comment
router.post('/get_comments', async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
    var { user_id, index, count, room_id} = req.body;

    if(!user_id || (index !== 0 && !index) || (count !== 0 && !count) || (room_id !== 0 && !room_id)) {
        console.log("Khong du tham so truyen vao: user_id, index, count, room_id");
        return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH);
    }

    if(!validInput.checkNumber(index) || !validInput.checkNumber(count) || !validInput.checkNumber(room_id)) {
        console.log("chi chua cac ki tu so");
        return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    index = parseInt(index, 10);
    count = parseInt(count, 10);
    room_id = parseInt(room_id, 10);
    if(isNaN(index) || isNaN(count) || isNaN(room_id)) {
        console.log("PARAMETER_VALUE_IS_INVALID");
        return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
    } catch (err) {
        console.log(err);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }

    try {
        var comments = [];
        const query = `SELECT comment_id, content, author_id, author_name, author_avatar, created FROM comments WHERE room_id = ${room_id}`;

        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            comments = results;
        });

        if(!comments) {
            console.log('Room no have comments');
            return callRes(res, responseError.NO_DATA_OR_END_OF_LIST_DATA);
        }

        let sliceComments = comments.slice(index, index + count);

        if(sliceComments.length < 1) {
            console.log('sliceComments no have comments');
            return callRes(res, responseError.NO_DATA_OR_END_OF_LIST_DATA);
        }

        res.status(200).send({
            code: "1000",
            message: "OK",
            data: sliceComments.map(comment => {
                return {
                    comment_id: comment.comment_id,
                    content: comment.content ? comment.content : null,
                    author: {
                        id: comment.author_id,
                        name: comment.author_name ? comment.author_name : null,
                        avatar: comment.author_avatar ? comment.author_avatar : null
                    },
                    created: comment.created.toString(),
                };
            })
        });
    } catch (err) {
        console.log(err);
        return callRes(res, responseError.CAN_NOT_CONNECT_TO_DB);
    }
});

// API gửi bình luận
router.post('/set_comment', verifyToken, async (req, res) => {
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
    var { user_id, content, room_id, index, count} = req.body;
    var user = req.user;

    if(!user_id || !content || !room_id || (index !== 0 && !index) || (count !== 0 && !count)) {
        console.log("No have parameter user_id, content, room_id, index, count");
        return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH);
    }

    if(!validInput.checkNumber(index) || !validInput.checkNumber(count)) {
        console.log("Chi chua cac ki tu so");
        return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    index = parseInt(index, 10);
    count = parseInt(count, 10);
    if(isNaN(index) || isNaN(count)) {
        console.log("PARAMETER_VALUE_IS_INVALID");
        return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    if(content && countWord(content) > MAX_WORD_COMMENT) {
        console.log("MAX_WORD_COMMENT");
        return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    try {
        var comments = [];
        var query = `SELECT comment_id, content, author_id, author_name, author_avatar, created FROM comments WHERE room_id = ${room_id}`;

        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            comments = results;
            // console.log(comments);

            try {
                const decoded = jsonwebtoken.verify(token, JWT_SECRET);
                console.log(decoded);
                const userId = decoded.userId;
                if(!userId) {
                    user_id = userId;
                }
            } catch (error) {
                console.log(error);
                return callRes(res, responseError.TOKEN_IS_INVALID, null);
            }

            // Save comment
            let {comment_id, content, author_id, author_name, author_avatar, created} = req.body;
            author_id = parseInt(user_id);
            comment_id = comments.length + 1;
            query = `SELECT username, avatar FROM users WHERE id = ${user_id}`;
            connection.query(query, function (error, results, fields) {
                if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
                
                author_name = results[0].username;
                author_avatar = results[0].avatar;
                created = new Date();
                console.log(created.toString());
    
                // save into DB
                var commentData = {
                    comment_id: comment_id,
                    content: content,
                    author_id: author_id,
                    author_name: author_name,
                    author_avatar: author_avatar,
                    created: created
                };
                console.log("commentData");
                console.log(commentData);
                query = `INSERT INTO comments(comment_id, content, room_id, author_id, author_name, author_avatar, created) VALUES ('${comment_id}', '${content}', '${room_id}', '${author_id}', '${author_name}', '${author_avatar}', '${dateFormat(created)}')`;
                connection.query(query, function (error, results) {
                    console.log(error);
                    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
                    console.log(results);
                // });

                // push into comments[] to print out using sliceComments[]
                if(!comments) {
                    comments = [commentData];
                } else {
                    comments.push(commentData);
                }
                console.log("comments");
                console.log(comments);
            

                let sliceComments = comments.slice(index, index + count);

                if(sliceComments.length < 1) {
                    console.log('sliceComments no have comments');
                    return callRes(res, responseError.NO_DATA_OR_END_OF_LIST_DATA);
                }

                console.log("sliceComments");
                console.log(sliceComments);

                res.status(200).send({
                    code: "1000",
                    message: "OK",
                    data: sliceComments.map(comment => {
                        return {
                            comment_id: comment.comment_id,
                            content: comment.content ? comment.content : null,
                            author: {
                                id: comment.author_id,
                                name: comment.author_name ? comment.author_name : null,
                                avatar: comment.author_avatar ? comment.author_avatar : null
                            },
                            created: comment.created,
                        };
                    })
                });
            });
                
            });

        });
    } catch (err) {
        console.log(err);
        return callRes(res, responseError.CAN_NOT_CONNECT_TO_DB);
    }
});

export { router };
