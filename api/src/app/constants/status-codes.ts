export class IStatusCode {
    code: number;
    text: string;
}

export interface IStatusCodes {
    // Success
    OK: IStatusCode,
    CREATED: IStatusCode,
    NO_CONTENT: IStatusCode,

    // Redirect
    MOVED: IStatusCode,
    NOT_MODIFIED: IStatusCode,

    // Client Error
    BAD_REQUEST: IStatusCode,
    UNAUTHORIZED: IStatusCode,
    FORBIDDEN: IStatusCode,
    NOT_FOUND: IStatusCode,
    CONFLICT: IStatusCode,
    GONE: IStatusCode,
    TEAPOT: IStatusCode,

    // Server Error
    INTERNAL: IStatusCode,
}


export const STATUS_CODE: IStatusCodes = {
    // Success
    OK: {
        code: 200,
        text: 'OK',
    },
    CREATED: {
        code: 201,
        text: 'CREATED',
    },
    NO_CONTENT: {
        code: 204,
        text: "NO_CONTENT",
    },

    // Redirect
    MOVED: {
        code: 301,
        text: 'MOVED',
    },
    NOT_MODIFIED: {
        code: 204,
        text: "NOT_MODIFIED",
    },

    // Client Error
    BAD_REQUEST: {
        code: 400,
        text: 'BAD_REQUEST',
    },
    UNAUTHORIZED: {
        code: 401,
        text: 'UNAUTHORIZED',
    },
    FORBIDDEN: {
        code: 403,
        text: 'FORBIDDEN',
    },
    NOT_FOUND: {
        code: 404,
        text: 'NOT_FOUND',
    },
    CONFLICT: {
        code: 409,
        text: 'CONFLICT',
    },
    GONE: {
        code: 410,
        text: 'GONE',
    },
    TEAPOT: {
        code: 418,
        text: "I'm a teapot",
    },

    // Server Error
    INTERNAL: {
        code: 500,
        text: 'INTERNAL',
    },

    // Logical Error
};
