

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/module/user/user.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  port: process.env.PORT,
  db_url: process.env.DB_URL
};

// src/db/index.ts
var pool = new Pool({
  connectionString: config.db_url
});
var initDB = async () => {
  try {
    await pool.query(
      `
       CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       password TEXT NOT NULL,
       role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
    );
        `
    );
    await pool.query(
      `
       CREATE TABLE IF NOT EXISTS issues (
       id SERIAL PRIMARY KEY,
       title VARCHAR(150) NOT NULL,
       description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
       type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
       status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
       reporter_id INT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
    );
        `
    );
    console.log("Database conected successfully!");
  } catch (err) {
    console.log(err);
  }
};

// src/module/user/user.service.ts
import bycript from "bcrypt";
import jwt from "jsonwebtoken";
var createUserIntoDb = async (payload) => {
  console.log("payload==>", payload);
  const { name, email, role, password } = payload;
  const hashPassword = bycript.hashSync(password, 10);
  const result = pool.query(
    `
    INSERT INTO users(name, email, role, password) VALUES($1,$2,$3,$4) RETURNING *
    `,
    [name, email, role, hashPassword]
  );
  return result;
};
var loginIntoDb = async (payload) => {
  const { email, password } = payload;
  const userExist = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
  );
  const user = userExist.rows[0];
  if (!user) {
    throw new Error("User not found!");
  }
  const isPasswordMatch = await bycript.compare(password, user?.password);
  if (!isPasswordMatch) {
    throw new Error("Password is incorrect!");
  }
  const JwtPayload = {
    id: user?.id,
    name: user?.name,
    role: user?.role
  };
  const token = jwt.sign(JwtPayload, "accessToken", { expiresIn: "7d" });
  delete user.password;
  return { token, user };
};
var getAllUserFromDb = async () => {
  const result = await pool.query(
    `
    SELECT * FROM users
    `
  );
  return result;
};
var getSingleUserFromDb = async (id) => {
  const result = await pool.query(
    `
    SELECT * FROM users WHERE id=$1
    `,
    [id]
  );
  return result;
};
var updateUserIntoDb = async (id, payload) => {
  const { name, email, role } = payload;
  const result = await pool.query(
    `
    UPDATE users SET name=COALESCE($1 , name), email=COALESCE($2 , email), role=COALESCE($3 , role) WHERE id=$4 RETURNING *
    `,
    [name, email, role, id]
  );
  return result;
};
var deleteUserIntoDb = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM users WHERE id=$1
    `,
    [id]
  );
  return result;
};
var userService = {
  createUserIntoDb,
  loginIntoDb,
  getAllUserFromDb,
  getSingleUserFromDb,
  updateUserIntoDb,
  deleteUserIntoDb
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data?.data,
    error: data?.error
  });
};
var sendResponse_default = sendResponse;

// src/module/user/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.createUserIntoDb(req.body);
    delete result.rows[0].password;
    sendResponse_default(res, {
      statusCode: 201,
      message: "User registered successfully",
      success: true,
      data: result?.rows[0]
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 400,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await userService.loginIntoDb(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      message: "Login successful",
      success: true,
      data: result
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 400,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUserFromDb();
    const newResult = result.rows.map((rls) => {
      const { password, ...rest } = rls;
      return rest;
    });
    sendResponse_default(res, {
      statusCode: 200,
      message: "Users retrived successfully!",
      success: true,
      data: newResult
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.getSingleUserFromDb(id);
    if (result.rows.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null
      });
    }
    delete result.rows[0].password;
    sendResponse_default(res, {
      statusCode: 200,
      message: "User retrived successfully!",
      success: true,
      data: result?.rows[0]
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.updateUserIntoDb(id, req.body);
    if (result.rows.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null
      });
    }
    delete result.rows[0].password;
    sendResponse_default(res, {
      statusCode: 200,
      message: "User updated successfully!",
      success: true,
      data: result?.rows
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.deleteUserIntoDb(id);
    if (result.rowCount === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      message: "User deleted successfully!",
      success: true,
      data: null
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var userController = {
  createUser,
  loginUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser
};

// src/module/user/user.route.ts
var router = Router();
router.post("/signup", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getSingleUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
var userRoute = router;

// src/app.ts
import cookieParser from "cookie-parser";

// src/module/issue/issue.router.ts
import { Router as Router2 } from "express";

// src/module/issue/issue.service.ts
var createIssueIntoDb = async (payload, id) => {
  console.log("payload==>", payload);
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id) VALUES($1,$2,$3,$4) RETURNING *
    `,
    [title, description, type, id]
  );
  return result;
};
var getAllIssues = async ({ sort = "newest", type, status } = {}) => {
  const allowedTypes = ["bug", "feature_request"];
  const allowedStatus = ["open", "in_progress", "resolved"];
  const conditions = [];
  const values = [];
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
    values
  );
  const formattedResult = await Promise.all(
    result.rows.map(async (rslt) => {
      const userResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [rslt.reporter_id]
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
          role: reporter.role
        },
        created_at: rslt.created_at,
        updated_at: rslt.updated_at
      };
    })
  );
  return formattedResult;
};
var getSingleIssue = async (id) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id=$1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found!");
  }
  const reporterId = result?.rows[0].reporter_id;
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [reporterId]
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
      role: userResult.rows[0].role
    },
    created_at: result?.rows[0].created_at,
    updated_at: result?.rows[0].updated_at
  };
};
var updateIssueIntoDb = async (id, payload) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    UPDATE issues SET title=COALESCE($1 , title), description=COALESCE($2 , description), type=COALESCE($3 , type) WHERE id=$4 RETURNING *
    `,
    [title, description, type, id]
  );
  return result;
};
var deleteIssuesIntoDb = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1
    `,
    [id]
  );
  return result;
};
var issueService = {
  createIssueIntoDb,
  getAllIssues,
  getSingleIssue,
  updateIssueIntoDb,
  deleteIssuesIntoDb
};

// src/module/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issueService.createIssueIntoDb(
      req.body,
      req?.user?.id
    );
    sendResponse_default(res, {
      statusCode: 201,
      message: "Issue created successfully",
      success: true,
      data: result?.rows[0]
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 400,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var getAllIssues2 = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issueService.getAllIssues(req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      data: result
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var getSingleIssue2 = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssue(id);
    if (!result?.id) {
      sendResponse_default(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      // message: "User retrived successfully!",
      success: true,
      data: result
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.updateIssueIntoDb(id, req.body);
    if (result.rows.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null
      });
    }
    delete result.rows[0].password;
    sendResponse_default(res, {
      statusCode: 200,
      message: "Issue updated successfully",
      success: true,
      data: result?.rows
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.deleteIssuesIntoDb(id);
    if (result.rowCount === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        message: "User not found!",
        success: false,
        data: null
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      message: "Issue deleted successfully",
      success: true
    });
  } catch (err) {
    sendResponse_default(res, {
      statusCode: 500,
      message: err.message,
      success: false,
      error: err
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues: getAllIssues2,
  getSingleIssue: getSingleIssue2,
  updateIssue,
  deleteIssue
};

// src/middleware/userValidation.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles2) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          message: "Unauthorize access",
          success: false
        });
      }
      const decodedToken = jwt2.verify(
        token,
        "accessToken"
      );
      const userExist = await pool.query(
        `
              SELECT * FROM users WHERE id=$1
              `,
        [decodedToken.id]
      );
      const user = userExist.rows[0];
      if (!user) {
        return sendResponse_default(res, {
          statusCode: 404,
          message: "User not found!",
          success: false
        });
      }
      if (roles2 && !roles2.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: 403,
          message: "Forbidden access!",
          success: false
        });
      }
      req.user = decodedToken;
      next();
    } catch (err) {
      console.log(err);
    }
  };
};
var userValidation_default = auth;

// src/types/type.ts
var roles = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/middleware/updateValidation.ts
var canUpdateIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const issueResult = await pool.query(`SELECT * FROM issues WHERE id=$1`, [
      issueId
    ]);
    const issue = issueResult.rows[0];
    console.log("issue here ==>", issue);
    if (!issue) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    const user = req.user;
    if (user.role === "maintainer") {
      return next();
    }
    if (user.role === "contributor") {
      const isOwner = issue.reporter_id === user.id;
      const isOpen = issue.status === "open";
      if (isOwner && isOpen) {
        return next();
      }
    }
    return sendResponse_default(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden access"
    });
  } catch (err) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Something went wrong"
    });
  }
};
var updateValidation_default = canUpdateIssue;

// src/module/issue/issue.router.ts
var router2 = Router2();
router2.post(
  "/",
  userValidation_default(roles.contributor, roles.maintainer),
  issueController.createIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch(
  "/:id",
  userValidation_default(roles.contributor, roles.maintainer),
  updateValidation_default,
  issueController.updateIssue
);
router2.delete("/:id", userValidation_default(roles.maintainer), issueController.deleteIssue);
var issueRouter = router2;

// src/globalError/globalError.ts
var globarErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalError_default = globarErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use("/api/auth", userRoute);
app.use("/api/issues", issueRouter);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use(globalError_default);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  });
});
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map