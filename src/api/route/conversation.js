import express from 'express';
import wrapAsync from '../utils/wrapAsync.js';
import verifyToken from '../middleware/authMiddleware.js';
import { ParameterError, ParameterErrorType } from '../../common/errors.js';
import connection from '../../db/connect.js';

const router = express.Router();

// Xem danh sách các mail từ một người chơi khác (lấy số conversations)
router.get('/get-list-conversations', verifyToken, wrapAsync(async (req, res) => {
  const { index, count } = req.body;
  if (!index || !count) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof index !== 'string' && typeof count !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const userId = req.userId;
  const query = `
    SELECT m.content, m.id, m.created, m.unread, m.sender_id, u.username as username, u.avatar as avatar
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN users u ON m.sender_id = u.id
    WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
    AND m.sender_id != ${userId}
    LIMIT ${Number(count)} OFFSET ${Number(index)};
  `;
  console.log(query);
  connection.query(query, (error, results) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    const data = results.map(result => {
      const { id: message_id, content, created, unread, sender_id: partner_id, username, avatar } = result;
      return { message_id, content, created: String(created), unread: String(unread), partner_id, username, avatar };
    });
    return res.status(200).json({ code: 1000, message: 'OK', data });
  })
}))

export { router };