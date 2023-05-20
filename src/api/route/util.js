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

// API 

export { router };
