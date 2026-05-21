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
    const result = await issueService.getAllIssues();

    // const newResult = result.rows.map((rls: any) => {
    //   const { password, ...rest } = rls;
    //   return rest;
    // });

    sendResponse(res, {
      statusCode: 200,
      // message: "Users retrived successfully!",
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

export const issueController = {
  createIssue,
  getAllIssues,
};
