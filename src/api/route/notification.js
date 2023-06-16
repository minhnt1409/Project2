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

// Lấy được thông báo từ hệ thống
router.get("/get-notification", verifyToken, wrapAsync(async (req, res) => {
  const { index, count } = req.body;
  if (!index || !count) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof index !== 'string' || typeof count !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const query = `
      SELECT id AS notification_id, type, content, unread, url, object_id
      FROM Notifications
      LIMIT ${Number(count)} OFFSET ${Number(index)};
    `;
  connection.query(query, (error, results) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    const data = results.map(result => {
      const { id, ...rest } = result;
      return { notification_id: id, ...rest };
    });
    return res.status(200).json({ code: 1000, message: 'OK', data });
  });
}));

// Thiết lập đã đọc được thông báo
router.post("/set-read-notification", verifyToken, wrapAsync(async (req, res) => {
  const { notification_id } = req.body;
  if (!notification_id) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof notification_id !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const query = `
    UPDATE Notifications
    SET unread = true
    WHERE id = ${notification_id};
  `
  connection.query(query, (error, result) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    return res.status(200).json({ code: 1000, message: 'OK' });
  })
}));

// API xem danh sách thiết lập thông báo
/**
 * @swagger
 * /notification/get_push_settings:
 *   get:
 *     summary: Xem danh sách thiết lập thông báo
 *     description: Lấy thông tin người dùng dựa trên ID
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *     responses:
 *       200:
 *         description: Thông tin roommate mới, phòng mới và tin mới(news)
 */
router.get("/get_push_settings", verifyToken, wrapAsync(async (req, res) => {

    const query = `
        SELECT new_roommate, new_room, news
        FROM push;
      `;
    connection.query(query, (error, results) => {
      if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
      const data = results.map(result => {
        const { new_roommate, new_room, news } = result;
        return { 
            new_roommate: new_roommate,
            new_room: new_room,
            news: news
        };
      });
      return res.status(200).json({ code: 1000, message: 'OK', data });
    });
  }));
const JWT_SECRET = 'maBiMat';

// API thiết lập đã đọc được thông báo
/**
 * @swagger
 * /notification/set-read-message:
 *   get:
 *     summary:  thiết lập đã đọc được thông báo
 *     description:  thiết lập người chơi đã đọc được thông báo
 *     tags:
 *       - Utils
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         description: Token người dùng hiện tại
 *       - in: query
 *         name: message_id
 *         schema:
 *           type: string
 *         description: id của thông báo
 *     responses:
 *       200:
 *         description: Lấy điểm thành công
 */
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