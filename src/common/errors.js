export const ParameterErrorType = { NOT_ENOUGH: 1, INVALID_TYPE: 2, INVALID_VALUE: 3 };

export class ServerError extends Error {
    statusCode;
    message;
    errCode;

    constructor(statusCode, message, errCode) {
        super();
        this.statusCode = statusCode;
        this.body = { message, code: errCode };
    }
}

export class UnauthorizedError extends ServerError {
    constructor(message = 'Token is invalid', errCode = 9998) {
        super(401, message, errCode);
    }
}

export class BadRequestError extends ServerError {
    constructor(message, errCode) {
        super(400, message, errCode);
    }
}

export class ForbiddenError extends ServerError {
    constructor(message = 'Not access', errCode = 1009) {
        super(403, message, errCode);
    }
}

export class ParameterError extends ServerError {
    constructor(errorType) {
        switch (errorType) {
            case ParameterErrorType.NOT_ENOUGH:
                super(400, 'Parameter is not enough', 1002);
                break;
            case ParameterErrorType.INVALID_TYPE:
                super(400, 'Parameter type is invalid', 1003);
                break;
            case ParameterErrorType.INVALID_VALUE:
                super(400, 'Parameter value is invalid', 1004);
                break;
        }
    }
}