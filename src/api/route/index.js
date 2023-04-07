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

// Import database connection
import connection from '../../db/connect.js';

function route(app) {
    const JWT_SECRET = 'maBiMat';
    // API đăng ký
    app.post('/signup', async (req, res) => {
        const { password } = req.body;
        let username = req.body.username;

        if (username === undefined || password === undefined) {
            return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, null);
        }
        if (typeof username != 'string' || typeof password != 'string') {
            return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, null);
        }
        if (!validInput.checkUserName(username)) {
            return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
        }
        try {
            let data = null;
            connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
                if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
                if (results.length > 0) return callRes(res, responseError.USER_EXISTED, null);
                bcryptjs.hash(password, 10).then(hashedPassword => {
                    connection.query('INSERT INTO users SET ?', { username, password: hashedPassword }, (error) => {
                        if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
                        return callRes(res, responseError.OK, data);
                    });
                });
            });
        } catch (error) {
            return callRes(res, responseError.UNKNOWN_ERROR, error.message);
        }
    });
    //API đăng nhập
    app.post('/login', (req, res) => {
        const { username, password, uuid } = req.body;

        const sql = 'SELECT * FROM users WHERE username = ?';
        connection.query(sql, [username], (err, results) => {
            if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if (results.length === 0) return callRes(res, responseError.USER_IS_NOT_VALIDATED, null);

            bcryptjs.compare(password, results[0].password, (err, result) => {
                if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
                if (result) {
                    const token = jsonwebtoken.sign(
                        {
                            username: results[0].username,
                            userId: results[0].id
                        },
                        JWT_SECRET,
                        {
                            expiresIn: '1h'
                        }
                    );
                    // const newUuid = uuid.v4();
                    const updateSql = 'UPDATE users SET uuid = ? WHERE id = ?';
                    connection.query(updateSql, [uuid, results[0].id], (err, updateResult) => {
                        if (err) {
                            return callRes(res, responseError.UNKNOWN_ERROR, null);
                        }
                        let data = {
                            token,
                            id: results[0].id,
                            username: results[0].username,
                            avatar: results[0].avatar,
                            is_block: results[0].is_block,
                        }
                        return callRes(res, responseError.OK, data);
                    });
                }
            });
        });
    });
    // API đăng xuất
    app.post('/logout', (req, res) => {
        const token = req.body.token;

        // Kiểm tra token có tồn tại hay không
        if (!token) return callRes(res, responseError.TOKEN_IS_INVALID, null);

        // Xác thực và giải mã token
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;

            // Xóa token trong cơ sở dữ liệu
            connection.query('DELETE FROM tokens WHERE user_id = ?', userId, (error, result) => {
                if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
                // Trả về thông báo thành công
                return callRes(res, responseError.OK, null);
            });
        } catch (error) {
            return callRes(res, responseError.TOKEN_IS_INVALID, null);
        }
    });


    // Set up multer for file upload
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images');
        },
        filename: function (req, file, cb) {
            const fileName = `${uuid.v4()}${path.extname(file.originalname)}`;
            cb(null, fileName);
        },
    });

    const upload = multer({
        storage: storage,
    });

    // API to update user info after signup
    app.put('/change_info_after_signup/us', upload.single('avatar'), async (req, res) => {
        try {
            const { username, email } = req.body;
            let avatar;
            if (req.file) {
                avatar = `/images/${req.file.filename}`;
            } else return callRes(res, responseError.UPLOAD_FILE_FAILED, null);

            const userId = req.user.id;

            // Check if the new username is already taken
            const usernameExists = await connection.promise().query(`SELECT * FROM users WHERE username = '${username}' AND id <> ${userId}`);
            if (!usernameExists[0].length) {
                return callRes(res, responseError.USER_EXISTED, null);
            }

            // Update user info
            await connection.promise().query(`UPDATE users SET username = '${username}', email = '${email}', avatar = '${avatar}' WHERE id = ${userId}`);

            // Get updated user info
            const [rows] = await connection.promise().query(`SELECT * FROM users WHERE id = ${userId}`);
            const user = rows[0];
            delete user.password;

            let data = { avatar: user.avatar }
            callRes(res, responseError.OK, data);
        } catch (err) {
            console.log(err);
            callRes(res, responseError.UNKNOWN_ERROR, null);
        }
    });
    // Api lấy danh sách phòng
    app.get('/get_list_rooms', (req, res) => {
        const token = req.body.token;
        const index = parseInt(req.body.index || 0);
        const count = parseInt(req.body.count || 20);

        // kiểm tra token
        if (!token) return callRes(res, responseError.TOKEN_IS_INVALID, null);

        // truy vấn cơ sở dữ liệu
        connection.query(`SELECT * FROM rooms LIMIT ${index}, ${count}`, (err, results) => {
            if (err) return callRes(res, responseError.UNKNOWN_ERROR, null);
            const rooms = results.map(room => ({ room_id: room.room_id, room_name: room.room_name, players: room.players }));
            let data = { rooms: rooms };
            return callRes(res, responseError.OK, data);
        });
    });
    // Api lấy thông tin phòng
    app.get('/get_room/:room_id', (req, res) => {
        const room_id = req.params.room_id;
        const query = `SELECT * FROM rooms WHERE room_id = ${room_id}`;

        connection.query(query, function (error, results, fields) {
            if(error) return callRes(res, responseError.UNKNOWN_ERROR,null);
            callRes(res, responseError.OK, results[0]);
        });
    });
}

export { route };
