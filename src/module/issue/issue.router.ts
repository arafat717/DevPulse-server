import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/userValidation";
import { roles } from "../../types/type";

const router = Router();

router.post(
  "/",
  auth(roles.contributor, roles.maintainer),
  issueController.createIssue,
);

router.get("/", issueController.getAllIssues);

export const issueRouter = router;
