import type { Request, Response } from "express";
import { userService } from "./user.service";
import sendResponse from "../../utils/sendResponse";

const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUserIntoDb(req.body);
    delete result.rows[0].password;
    sendResponse(res, {
      statusCode: 201,
      message: "User registered successfully",
      success: true,
      data: result?.rows[0],
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: 400,
      message: err.message,
      success: false,
      error: err,
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.loginIntoDb(req.body);

    sendResponse(res, {
      statusCode: 200,
      message: "Login successful",
      success: true,
      data: result,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: 400,
      message: err.message,
      success: false,
      error: err,
    });
  }
};



export const userController = {
  createUser,
  loginUser
};
