import express from 'express';
import bcryptjs from 'bcryptjs';
import validInput from '../utils/validInput.js';
import responseError from '../response/error.js';
import {callRes} from '../response/error.js';
import connection from '../../db/connect.js';

function route(app){
    app.post('/signup', async (req, res) => {
        const { password } = req.body;
        let username = req.body.username;
        console.log(username + ' ' + password);
        
        if (username === undefined || password === undefined) {
            return callRes(res, responseError.PARAMETER_IS_NOT_ENOUGH, 'username, password');
        }
        if (typeof username != 'string' || typeof password != 'string') {
            return callRes(res, responseError.PARAMETER_TYPE_IS_INVALID, 'username, password');
        }
        try {
            let data = null;
            connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
                bcryptjs.hash(password, 10).then(hashedPassword => {
                    connection.query('INSERT INTO users SET ?', { username, password: hashedPassword }, (error) => {
                        return callRes(res, responseError.OK, data);
                    });
                });
            });
        } catch (error) {
            return callRes(res, responseError.UNKNOWN_ERROR, error.message);
        }
    });
    
}

export { route };
