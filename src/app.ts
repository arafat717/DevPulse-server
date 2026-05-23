import express, { type Request, type Response } from "express";
import { userRoute } from "./module/user/user.route";
import cookieParser from "cookie-parser";
import { issueRouter } from "./module/issue/issue.router";
import globarErrorHandler from "./globalError/globalError";
const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use("/api/auth", userRoute);
app.use("/api/issues", issueRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("DevPluse server is running!");
});

app.use(globarErrorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

export default app;
