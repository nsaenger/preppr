export class IStatusCode {
  code: number;
  text: string;
}


interface IStausCodes {
  // Success
  OK: IStatusCode,
  CREATED: IStatusCode,

  // Redirect
  MOVED: IStatusCode,

  // Client Error
  BAD_REQUEST: IStatusCode,
  UNAUTHORIZED: IStatusCode,
  FORBIDDEN: IStatusCode,
  NOT_FOUND: IStatusCode,
  GONE: IStatusCode,

  // Server Error
  INTERNAL: IStatusCode,
}


export const STATUS_CODE: IStausCodes = {
  // Success
  OK: {
    code: 200,
    text: 'OK',
  },
  CREATED: {
    code: 200,
    text: 'CREATED',
  },

  // Redirect
  MOVED: {
    code: 301,
    text: 'MOVED',
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
  GONE: {
    code: 410,
    text: 'GONE',
  },

  // Server Error
  INTERNAL: {
    code: 500,
    text: 'INTERNAL',
  },

  // Logical Error
};
