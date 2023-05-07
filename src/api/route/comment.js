import express, { response } from 'express';
import jsonwebtoken from 'jsonwebtoken';

// const router = express.Router();
const router = require('express').Router();
// const Comment = require('../models/Comment');
// const Post = require('../models/Post');
// const User = require('../models/User');
// const verify = require('../utils/verifyToken');
// const {getUserIDFromToken} = require('../utils/getUserIDFromToken');
var {responseError, setAndSendResponse} = require('../response/response.js');
const validInput = require('../utils/validInput');
const MAX_WORD_COMMENT = 500;
const COUNT_DEFAULT  = 2;
const JWT_SECRET = 'maBiMat';

function countWord(str) {
    return str.split(" ").length;
}

// API lấy các comment
router.post('/get_comments', async (req, res) => {
    var {token, user_id, index, count, room_id} = req.body;

    if(!user_id || (index !== 0 && !index) || (count !== 0 && !count) || (room_id !== 0 && !room_id)) {
        console.log("Khong du tham so truyen vao: user_id, index, count, room_id");
        return setAndSendResponse(res, responseError.PARAMETER_IS_NOT_ENOUGH);
    }

    if(!validInput.checkNumber(index) || !validInput.checkNumber(count) || !validInput.checkNumber(room_id)) {
        console.log("chi chua cac ki tu so");
        return setAndSendResponse(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    index = parseInt(index, 10);
    count = parseInt(count, 10);
    room_id = parseInt(room_id, 10);
    if(isNaN(index) || isNaN(count) || isNaN(room_id)) {
        console.log("PARAMETER_VALUE_IS_INVALID");
        return setAndSendResponse(res, responseError.PARAMETER_VALUE_IS_INVALID);
    }

    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
    } catch (err) {
        console.log(err);
        return setAndSendResponse(res, responseError.TOKEN_IS_INVALID, null);
    }

    try {
        const comments = [];
        const query = `SELECT * FROM comments WHERE room_id = ${room_id}`;

        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            comments = results;
        });

        if(!comments) {
            console.log('Room no have comments');
            return setAndSendResponse(res, responseError.NO_DATA_OR_END_OF_LIST_DATA);
        }

        let sliceComments = comments.slice(index, index + count);

        if(sliceComments.length < 1) {
            console.log('sliceComments no have comments');
            return setAndSendResponse(res, responseError.NO_DATA_OR_END_OF_LIST_DATA);
        }

        res.status(200).send({
            code: "1000",
            message: "OK",
            data: sliceComments.map(comment => {
                return {
                    comment_id: comment.id,
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
        return setAndSendResponse(res, responseError.CAN_NOT_CONNECT_TO_DB);
    }
});

export { router };
