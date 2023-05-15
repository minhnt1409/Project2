import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import wrapAsync from '../utils/wrapAsync.js';
import responseError, { callRes } from '../response/response.js';
import connection from '../../db/connect';

const router = express.Router();

// Thiết lập thông báo
router.post('/set-push-setting', verifyToken, wrapAsync(async (req, res) => {
  const { new_roommate, new_room, news } = req.body;
  if (!new_roommate && !new_room && !news) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof new_roommate !== 'string' && typeof new_room !== 'string' && typeof news !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const query = `
  INSERT INTO push (new_roommate, new_room, news) 
  VALUES (${new_roommate}, ${new_room}, ${news});
  `;
  connection.query(query, (error, result) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    return res.status(200).json({ code: 1000, message: 'OK' });
  });
}))

export { router };