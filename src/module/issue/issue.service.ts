import { pool } from "../../db";
import type { TIssue } from "./issue.interface";

const createIssueIntoDb = async (payload: TIssue, id: string) => {
  console.log("payload==>", payload);
  const { title, description, type } = payload;

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id) VALUES($1,$2,$3,$4) RETURNING *
    `,
    [title, description, type, id],
  );

  return result;
};

const getAllIssues = async () => {
  const result = await pool.query(
    `
    SELECT * FROM issues
    `,
  );

  const formatedResult = await Promise.all(
    result.rows.map(async(rslt: any) => {
      const userResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [rslt.reporter_id],
      );

      const reporter = userResult.rows[0];

      return {
        id: rslt.id,
        title: rslt.title,
        description: rslt.description,
        type: rslt.type,
        status: rslt.status,
        reporter: {
          id: reporter.id,
          name: reporter.name,
          role: reporter.role,
        },
        created_at: rslt.created_at,
        updated_at: rslt.updated_at,
      };
    }),
  );

  return formatedResult;
};

export const issueService = {
  createIssueIntoDb,
  getAllIssues,
};
