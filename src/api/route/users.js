import express, { response } from 'express';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import validInput from '../utils/validInput.js';
import responseError from '../response/response.js';
import { callRes } from '../response/response.js';
import dotenv from 'dotenv';

// Import database connection
import connection from '../../db/connect.js';
import wrapAsync from '../utils/wrapAsync.js';
import { ParameterError, ParameterErrorType } from '../../common/errors.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
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

    if (!username || !password || !uuid) return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, null);
    if (typeof username != 'string' || typeof password != 'string' || typeof uuid != 'string') {
        return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, null);
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
            } else return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
        });
    });
});


// API đổi mật khẩu
router.post('/change-password', verifyToken, wrapAsync(async (req, res) => {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
    if (typeof old_password !== 'string' || typeof new_password !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);
    if (old_password === new_password) throw new ParameterError(ParameterErrorType.INVALID_VALUE);

    const userId = req.userId;
    connection.query(`SELECT * FROM users WHERE id = ${userId}`, (error, result) => {
        if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
        const user = result[0];
        bcryptjs.compare(old_password, user.password).then(validPassword => {
            console.log(validPassword, old_password, user);
            if (!validPassword) return callRes(res, responseError.PARAMETER_VALUE_IS_INVALID, null);
            bcryptjs.hash(new_password, 10).then(hashedPassword => {
                connection.query(`UPDATE users SET password='${hashedPassword}' WHERE id = ${userId}`);
                return res.status(200).json({ code: 1000, message: 'OK' });
            }).catch(() => callRes(res, responseError.UNKNOWN_ERROR, null));
        }).catch(() => callRes(res, responseError.UNKNOWN_ERROR, null));
    });

}))

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

// Api lấy thông tin người chơi
router.get('/get_user_info', async (req, res) => {
    let { token, user_id } = req.body;
    try {
        const decoded = jsonwebtoken.verify(token, JWT_SECRET);
        console.log(decoded);
        const userId = decoded.userId;

        if(!user_id){
            user_id = userId;
        }
        
        const query = `SELECT id, username, avatar, email FROM users WHERE id = ${user_id}`;
    
        connection.query(query, function (error, results, fields) {
            if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
            callRes(res, responseError.OK, results[0]);
        });
    } catch (error) {
        console.log(error);
        return callRes(res, responseError.TOKEN_IS_INVALID, null);
    }

});


// Api lấy thông tin người chơi
router.get('/get_user_info', (req, res) => {
    let { token, user_id } = req.body;
    let tokenUser;
    if (token) {
        const tokenUserQuery = `SELECT id FROM users WHERE token = ${token}`;

        connection.query(tokenUserQuery, function (error, results, fields) {
            if (error) return callRes(res, responseError.TOKEN_IS_INVALID, null);
            tokenUser = results[0];
        });
    }
    if (!user_id && tokenUser ) {
        user_id = tokenUser.id;
    }

    const query = `SELECT id, username, avatar, email FROM users WHERE id = ${user_id}`;

    connection.query(query, function (error, results, fields) {
        if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
        callRes(res, responseError.OK, results[0]);
    });
});
export { router };
