import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.createIssueIntoDb(
      req.body,
      req?.user?.id as string,
    );
    sendResponse(res, {
      statusCode: 201,
      message: "Issue created successfully",
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

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;

    const result = await issueService.getAllIssues(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
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

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssue(id as string);

    if (!result?.id) {
      sendResponse(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: 200,
      // message: "User retrived successfully!",
      success: true,
      data: result,
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

const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.updateIssueIntoDb(id as string, req.body);

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
      message: "Issue updated successfully",
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

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await issueService.deleteIssuesIntoDb(id as string);

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
      message: "Issue deleted successfully",
      success: true,
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

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};
