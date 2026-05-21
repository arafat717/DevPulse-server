import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utils/sendResponse";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";

type Roles = "contributor" | "maintainer";

const auth = (...roles: Roles[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        sendResponse(res, {
          statusCode: 401,
          message: "Unauthorize access",
          success: false,
        });
      }
      const decodedToken = jwt.verify(
        token as string,
        "accessToken",
      ) as JwtPayload;

      const userExist = await pool.query(
        `
              SELECT * FROM users WHERE id=$1
              `,
        [decodedToken.id],
      );

      const user = userExist.rows[0];

      if (!user) {
        sendResponse(res, {
          statusCode: 404,
          message: "User not found!",
          success: false,
        });
      }

      if (roles && !roles.includes(user.role)) {
        sendResponse(res, {
          statusCode: 403,
          message: "Forbidden access!",
          success: false,
        });
      }
      req.user = decodedToken;
      next();
    } catch (err: any) {
      console.log(err);
    }
  };
};

export default auth;
