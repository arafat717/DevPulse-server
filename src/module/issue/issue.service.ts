import { pool } from "../../db";
import type { TIssue } from "./issue.interface";

type TIssueQueryParams = {
  sort?: "newest" | "oldest";
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
};

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

const getAllIssues = async ({sort="newest",type,status}: TIssueQueryParams = {}) => {
  const allowedTypes = ["bug", "feature_request"] as const;
  const allowedStatus = ["open", "in_progress", "resolved"] as const;
  // const { sort = "newest", type, status } = options;

  const conditions: string[] = [];
  const values: any[] = [];

  if (type && allowedTypes.includes(type)) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  if (status && allowedStatus.includes(status)) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderDirection = sort === "oldest" ? "ASC" : "DESC";

  const result = await pool.query(
    `
    SELECT id, title, description, type, status, reporter_id, created_at, updated_at
    FROM issues
    ${whereClause}
    ORDER BY created_at ${orderDirection}
    `,
    values,
  );

  const formattedResult = await Promise.all(
    result.rows.map(async (rslt: any) => {
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

  return formattedResult;
};

const getSingleIssue = async (id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error("Issue not found!");
  }

  const reporterId = result?.rows[0].reporter_id;
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [reporterId],
  );

  return {
    id: result?.rows[0].id,
    title: result?.rows[0].title,
    description: result?.rows[0].description,
    type: result?.rows[0].type,
    status: result?.rows[0].status,
    reporter: {
      id: userResult.rows[0].id,
      name: userResult.rows[0].name,
      role: userResult.rows[0].role,
    },
    created_at: result?.rows[0].created_at,
    updated_at: result?.rows[0].updated_at,
  };
};

const updateIssueIntoDb = async (id: string, payload: TIssue) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    UPDATE issues SET title=COALESCE($1 , title), description=COALESCE($2 , description), type=COALESCE($3 , type) WHERE id=$4 RETURNING *
    `,
    [title, description, type, id],
  );
  return result;
};

const deleteIssuesIntoDb = async (id: string) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id],
  );
  return result;
};

export const issueService = {
  createIssueIntoDb,
  getAllIssues,
  getSingleIssue,
  updateIssueIntoDb,
  deleteIssuesIntoDb,
};
