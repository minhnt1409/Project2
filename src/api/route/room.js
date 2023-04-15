import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
// import { v4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import validInput from '../utils/validInput.js';
import responseError, { callRes } from '../response/response.js';

// Import database connection
import connection from '../../db/connect.js';

const router = express.Router();

const JWT_SECRET = 'maBiMat';

// Api lấy danh sách phòng
router.get('/get_list_rooms', async (req, res) => {
    const token = req.body.token;
    const index = parseInt(req.body.index || 0);
    const count = parseInt(req.body.count || 20);

    // kiểm tra token
    if (!token) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);

    // truy vấn cơ sở dữ liệu
    connection.query(`SELECT * FROM rooms LIMIT ${index}, ${count}`, (err, results) => {
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        const rooms = results.map(room => ({ room_id: room.room_id, room_name: room.room_name, players: room.current }));
        let data = { rooms: rooms };
        return callRes(res, responseError.OK, data);
    });
});
// Api lấy thông tin phòng
router.get('/get_room', async (req, res) => {
    const room_id = req.body.room_id;
    const query = `SELECT * FROM rooms WHERE room_id = ${room_id}`;

    connection.query(query, function (error, results, fields) {
        if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
        callRes(res, responseError.OK, results[0]);
    });
});
// Api thêm phòng chỉ dành cho quản trị viên
router.post('/add_room', async (req, res) => {
    const { token, room_name, max } = req.body;

    if (!token || !room_name) return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, null);

    // Kiểm tra xác thực token của admin
    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        const userId = decoded.userId;
        const sql = 'SELECT * FROM users WHERE id = ?';
        connection.query(sql, [userId], (err, results) => {
            if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if (results.length === 0) return callRes(res, responseError.USER_IS_NOT_VALIDATED, null);
            if (results[0].role === 'admin') {
                // Thêm phòng mới vào database
                const createRoomQueryString = `INSERT INTO rooms (room_name,current, max, speed, author_id) VALUE (?, ?, ?, ?, ?)`;
                
                connection.query(createRoomQueryString, [room_name, 1, max, 1, decoded.userId], (err, Room, fields) => {
                    console.log(err);
                    if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
    
                    // Trả về thông tin phòng mới được tạo
                    const room_id = Room.insertId;
                    const getRoomQueryString = `SELECT * FROM rooms WHERE room_id = '${room_id}'`;
    
                    connection.query(getRoomQueryString, (err, rows, fields) => {
                        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
    
                        if (rows.length > 0) {
                            let data = {
                                room_id : rows[0].room_id,
                                room_name : rows[0].room_name,
                                current : rows[0].current,
                                max : rows[0].max,
                                speed : rows[0].speed,
                                author : {
                                    username : decoded.username,
                                    id : decoded.userId
                                },
                                created : rows[0].created
                            }
                            return callRes(res, responseError.OK, data);
                        }
                        else return callRes(res, responseError.UNKNOWN_ERROR, null);
                    });
                });
            }else return callRes(res, responseError.NOT_ACCESS,null);
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});

// Api sửa phòng chỉ dành cho admin
router.put('/edit_room', async (req, res) => {
    const { token, room_id, room_name, max } = req.body;

    // Kiểm tra xem value có hợp lệ hay không
    if(!token || !room_id) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);
    if(!room_name && !max) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

    // Kiểm tra xác thực token của admin
    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        const userId = decoded.userId;
        const sql = 'SELECT * FROM users WHERE id = ?';
        connection.query(sql, [userId], (err, results) => {
            if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if (results.length === 0) return callRes(res, responseError.USER_IS_NOT_VALIDATED, null);
            if (results[0].role === 'admin') {
                // Thực hiện cập nhật thông tin phòng trong cơ sở dữ liệu
                let sql = 'UPDATE rooms SET ';
                let params = [];
            
                if (room_name) {
                    sql += 'room_name = ?, ';
                    params.push(room_name);
                }
            
                if (max) {
                    sql += 'max = ?, ';
                    params.push(max);
                }
            
                sql = sql.slice(0, -2);
                sql += ' WHERE room_id = ?';
                params.push(room_id);
            
                connection.query(sql, params, (err, result) => {
                    if (err) return callRes(res, responseError.UNKNOWN_ERROR,null);
            
                    if (result.affectedRows == 0) return callRes(res, responseError.NO_DATA_OR_END_OF_LIST_DATA,null);
                    let data = {
                        room_name : room_name,
                        max : max,
                        room_id : room_id
                    }
                    return callRes(res, responseError.OK, data);
                });
            }
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }
});

export { router };
