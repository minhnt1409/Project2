import express from 'express';
import wrapAsync from '../utils/wrapAsync.js';
import verifyToken from '../middleware/authMiddleware.js';
import { ParameterError, ParameterErrorType } from '../../common/errors.js';
import connection from '../../db/connect.js';
import responseError, { callRes } from '../response/response.js';
import execDeleteQuery from '../utils/execDeleteQuery.js';

const router = express.Router();

// Xem danh sách các mail từ một người chơi khác
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
  connection.query(query, (error, results) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    const data = results.map(result => {
      const { id: message_id, content, created, unread, sender_id: partner_id, username, avatar } = result;
      return { message_id, content, created: String(created), unread: String(unread), partner_id, username, avatar };
    });
    return res.status(200).json({ code: 1000, message: 'OK', data });
  });
}));

// Xem danh sách các mail mới nhất từ người chơi còn lại
router.get('/get-conversation-detail', verifyToken, wrapAsync(async (req, res) => {
  const { partner_id, index, count, conversation_id } = req.body;
  if (!index || !count || (!partner_id && !conversation_id)) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof index !== 'string' || typeof count !== 'string' || (typeof partner_id !== 'string' && typeof conversation_id !== 'string')) throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const userId = req.userId;
  let andQuery = '';
  if (partner_id) {
    andQuery = `AND m.sender_id = ${partner_id}`;
    if (conversation_id) andQuery += ` AND c.id = ${conversation_id}`;
  }
  else if (conversation_id) andQuery = `AND c.id = ${conversation_id} AND m.sender_id != ${userId}`;
  const query = `
    SELECT m.content, m.id, m.created, m.unread, m.sender_id, u.username as username, u.avatar as avatar
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN users u ON m.sender_id = u.id
    WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
    ${andQuery}
    LIMIT ${Number(count)} OFFSET ${Number(index)};
  `;
  connection.query(query, (error, results) => {
    if (error) return callRes(res, responseError.UNKNOWN_ERROR, null);
    const data = results.map(result => {
      const { id: message_id, content, created, unread, sender_id: partner_id, username, avatar } = result;
      return { message_id, content, created: String(created), unread: String(unread), partner_id, username, avatar };
    });
    return res.status(200).json({ code: 1000, message: 'OK', data });
  });
}));

// Xoá danh sách các mail từ một người chơi khác
router.post('/delete-conversation', verifyToken, wrapAsync(async (req, res) => {
  const { partner_id, conversation_id } = req.body;
  if (!partner_id && !conversation_id) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof partner_id !== 'string' && typeof conversation_id !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const userId = req.userId;
  let deleteMessageQuery = '';
  let deleteConversationQuery = '';
  if (conversation_id) {
    deleteMessageQuery = `DELETE FROM messages WHERE conversation_id = ${conversation_id};`;
    deleteConversationQuery = `DELETE FROM conversations WHERE id = ${conversation_id};`
  }
  else if (partner_id) {
    deleteMessageQuery = `
      DELETE m
      FROM messages m
      LEFT JOIN conversations c ON c.id = m.conversation_id
      WHERE (
        (user1_id = ${userId} AND user2_id = ${partner_id})
        OR (user1_id = ${partner_id} AND user2_id = ${userId})
      );
    `
    deleteConversationQuery = `
      DELETE FROM conversations
      WHERE (
        (user1_id = ${userId} AND user2_id = ${partner_id})
        OR (user1_id = ${partner_id} AND user2_id = ${userId})
      );
    `;
  }
  if (execDeleteQuery(deleteMessageQuery, res) || execDeleteQuery(deleteConversationQuery, res))
    return callRes(res, responseError.UNKNOWN_ERROR, null);
  return res.status(200).json({ code: 1000, message: 'OK' });
}));

router.post('/delete-message', verifyToken, wrapAsync(async (req, res) => {
  const { conversation_id, message_id } = req.body;
  if (!conversation_id || !message_id) throw new ParameterError(ParameterErrorType.NOT_ENOUGH);
  if (typeof conversation_id !== 'string' && typeof message_id !== 'string') throw new ParameterError(ParameterErrorType.INVALID_TYPE);

  const userId = req.userId;
  const query = `
    DELETE FROM messages
    WHERE id = ${message_id}
      AND conversation_id = ${conversation_id}
      AND EXISTS (
        SELECT 1
        FROM conversations
        WHERE (
          (user1_id = ${userId} AND user2_id = conversations.user2_id)
          OR (user2_id = ${userId} AND user1_id = conversations.user1_id)
        )
        AND conversation_id = ${conversation_id}
      );
  `
  if (execDeleteQuery(query, res))
    return callRes(res, responseError.UNKNOWN_ERROR, null);
  return res.status(200).json({ code: 1000, message: 'OK' });
}))

export { router };