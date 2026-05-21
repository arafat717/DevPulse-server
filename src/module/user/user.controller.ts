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

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await userService.getAllUserFromDb();

    const newResult = result.rows.map((rls: any) => {
      const { password, ...rest } = rls;
      return rest;
    });

    sendResponse(res, {
      statusCode: 200,
      message: "Users retrived successfully!",
      success: true,
      data: newResult,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err,
    });
  }
};

const getSingleUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await userService.getSingleUserFromDb(id as string);

    if (result.rows.length === 0) {
      sendResponse(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null,
      });
    }
    delete result.rows[0].password;
    sendResponse(res, {
      statusCode: 200,
      message: "User retrived successfully!",
      success: true,
      data: result?.rows[0],
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err,
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await userService.updateUserIntoDb(id as string, req.body);

    if (result.rows.length === 0) {
      sendResponse(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null,
      });
    }

    delete result.rows[0].password;

    sendResponse(res, {
      statusCode: 200,
      message: "User updated successfully!",
      success: true,
      data: result?.rows,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUserIntoDb(id as string);

    if (result.rowCount === 0) {
      sendResponse(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: 200,
      message: "User deleted successfully!",
      success: true,
      data: null,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err,
    });
  }
};

export const userController = {
  createUser,
  loginUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};
