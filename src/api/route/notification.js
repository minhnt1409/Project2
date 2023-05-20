import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import wrapAsync from '../utils/wrapAsync.js';
import connection from '../../db/connect.js';
import responseError, { callRes } from '../response/response.js';

const router = express.Router();

// API 

export { router };
