import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import wrapAsync from '../utils/wrapAsync.js';
import connection from '../../db/connect.js';
import responseError, { callRes } from '../response/response.js';

const router = express.Router();

// API xem danh sách thiết lập thông báo
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

export { router };
