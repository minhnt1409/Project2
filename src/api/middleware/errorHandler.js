import { ServerError } from "../../common/errors.js";

const errorHandler = (err, res) => {
    console.log('err', err);
    if (err instanceof ServerError) {
        const { statusCode, body } = err;
        return res.status(statusCode).json(body);
    }

    return res.status(500).json({ message: 'Internal Server Error' });
};

export default errorHandler;