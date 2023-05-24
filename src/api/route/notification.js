import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import wrapAsync from '../utils/wrapAsync.js';
import connection from '../../db/connect.js';
import responseError, { callRes } from '../response/response.js';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = express.Router();

const JWT_SECRET = 'maBiMat';


// Thiết lập đã đọc được thông báo
router.post("/set-read-message", wrapAsync(async (req, res) => {
  const { message_id } = req.body;
  if (!message_id) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof message_id !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);
console.log(message_id)
  const query = `
    UPDATE Messages
    SET unread = true
    WHERE id = ${message_id};
  `
  connection.query(query, (error, result) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    return res.status(200).json({ code: 1000, message: 'OK' });
  })
}));

export { router };