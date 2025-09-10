import { UserPayload } from './user-payload'; // define what you store in `req.user`

declare module 'express' {
  export interface Request {
    user?: UserPayload;
  }
}
