import { ForbiddenError, UnauthorizedError } from '../../common/errors.js';
import jwt from 'jsonwebtoken';
const JWT_SECRET = 'maBiMat';
const verifyToken = (req, res, next) => {
    // Lấy token
    const authHeader = req.header("Authorization");
    let token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        token = req.body.token;
        if (!token) throw new UnauthorizedError();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        throw new ForbiddenError();
    }
}

export default verifyToken;