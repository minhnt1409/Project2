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

// API đăng ký
router.post('/signup', async (req, res) => {
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
        connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            if (results.length > 0) return callRes(res, responseError.USER_EXISTED, null);
            bcryptjs.hash(password, 10).then(hashedPassword => {
                connection.query('INSERT INTO users (username, password) VALUE (?, ?)', [ username,hashedPassword ], (error) => {
                    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
                    return callRes(res, responseError.OK, null);
                });
            });
        });
    } catch (error) {
        return callRes(res, responseError.UNKNOWN_ERROR, error.message);
    }
});

//API đăng nhập
router.post('/login', async (req, res) => {
    const { username, password, uuid } = req.body;
    
    if(!username  || !password || !uuid) return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, null);
    if(typeof username != 'string' || typeof password != 'string' || typeof uuid != 'string'){
        return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID,null);
    }
    
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
                        userId: results[0].id,
                        uuid: uuid // uuid: 50-81-40-85-D1-9C
                    },
                    JWT_SECRET
                );
                const updateSql = 'UPDATE users SET token = ? WHERE id = ?';
                connection.query(updateSql, [token, results[0].id], (err, updateResult) => {
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
            }else return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID,null);
        });
    });
});

// API đăng xuất
router.post('/logout', async (req, res) => {
    const token = req.body.token;

    // Kiểm tra token có tồn tại hay không
    if (!token) return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, null);

    // Xác thực và giải mã token
    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        const userId = decoded.userId;
        console.log(userId);

        // Xóa token trong cơ sở dữ liệu
        connection.query('UPDATE users SET token = NULL WHERE id = ?', userId, (error, result) => {
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
        cb(null, './src/public/img');
    },
    filename: function (req, file, cb) {
        const fileName = 'avatar-' + `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, fileName);
    },
});

const upload = multer({
    storage: storage,
});

// API cập nhật thông tin người dùng đã đăng nhập
router.put('/change_info_after_signup', upload.single('avatar'), async (req, res) => {
    try {
        const { token, username, email } = req.body;
        let avatar;
        if (req.file) {
            if (!validInput.checkImageFile(req.file)) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
            avatar = req.file.filename;
        }
        if(username) {
            if (!validInput.checkUserName(username)) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
            if(typeof username != 'string') return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, null);
        } 
        if(email) {
            if (!validInput.checkEmail(email)) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
            if(typeof email != 'string') return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, null);
        }

        // Xác thực và giải mã token
        try {
            const decoded = jsonwebtoken.verify(token, JWT_SECRET);
            console.log(decoded);
            const userId = decoded.userId;
            console.log(username);

            // Check if the new username is already taken
            const usernameExists = await connection.promise().query(`SELECT * FROM users WHERE username = '${username}'`);
            if (usernameExists[0].length) {
                return callRes(res, responseError.USER_EXISTED, null);
            }
    
            // Update user info
            if(username) await connection.promise().query(`UPDATE users SET username = '${username}' WHERE id = ${userId}`);
            if(email) await connection.promise().query(`UPDATE users SET email = '${email}' WHERE id = ${userId}`);
            if(avatar) await connection.promise().query(`UPDATE users SET avatar = '${avatar}' WHERE id = ${userId}`);
    
            // Get updated user info
            const [rows] = await connection.promise().query(`SELECT * FROM users WHERE id = ${userId}`);
            const user = rows[0];
            delete user.password;
    
            let data = { avatar: user.avatar }
            callRes(res, responseError.OK, data);
        } catch (error) {
            console.log(error);
            return callRes(res, responseError.TOKEN_IS_INVALID, null);
        }
    } catch (err) {
        console.log(err);
        callRes(res, responseError.UNKNOWN_ERROR, null);
    }
});

export { router };
