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
        const rooms = results.map(room => ({ room_id: room.room_id, room_name: room.room_name, players: room.players }));
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

    if (!token || !room_name) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);

    // Kiểm tra xác thực token của admin
    const adminQueryString = `SELECT * FROM admins WHERE token = '${token}'`;

    connection.query(adminQueryString, (err, adminRows, fields) => {
        if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
        if (adminRows.length > 0) {
            // Thêm phòng mới vào database
            const createRoomQueryString = `INSERT INTO rooms (room_name, max) VALUES ('${room_name}', '${max}')`;

            connection.query(createRoomQueryString, (err, roomRows, fields) => {
                if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);

                // Trả về thông tin phòng mới được tạo
                const room_id = roomRows.insertId;
                const getRoomQueryString = `SELECT * FROM rooms WHERE room_id = '${room_id}'`;

                connection.query(getRoomQueryString, (err, rows, fields) => {
                    if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);

                    if (rows.length > 0) return callRes(res, responseError.OK, rows[0]);
                    else return callRes(res, responseError.UNKNOWN_ERROR, null);
                });
            });
        } else return callRes(res, responseError.TOKEN_IS_INVALID, null);
    });
});
// Api sửa phòng chỉ dành cho admin
router.put('/edit_room', async (req, res) => {
    const { room_id,token, room_name, max } = req.body;

    // Kiểm tra xem value có hợp lệ hay không
    if(!token || !room_id) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);
    if(!room_name && !max) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);

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
});

export { router };
