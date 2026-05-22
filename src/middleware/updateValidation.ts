import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utils/sendResponse";
import { pool } from "../db";
import type { JwtPayload } from "jsonwebtoken";

const canUpdateIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const issueId = req.params.id;

    const issueResult = await pool.query(`SELECT * FROM issues WHERE id=$1`, [
      issueId,
    ]);

    const issue = issueResult.rows[0];
    console.log("issue here ==>", issue);
    if (!issue) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
    }

    const user = req.user as JwtPayload;

    // maintainer can update any issue
    if (user.role === "maintainer") {
      return next();
    }

    // contributor rules
    if (user.role === "contributor") {
      const isOwner = issue.reporter_id === user.id;
      const isOpen = issue.status === "open";

      if (isOwner && isOpen) {
        return next();
      }
    }

    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden access",
    });
  } catch (err) {
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Something went wrong",
    });
  }
};

export default canUpdateIssue;
