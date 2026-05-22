import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/userValidation";
import { roles } from "../../types/type";
import canUpdateIssue from "../../middleware/updateValidation";

const router = Router();

router.post(
  "/",
  auth(roles.contributor, roles.maintainer),
  issueController.createIssue,
);

router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.patch(
  "/:id",
  auth(roles.contributor, roles.maintainer),
  canUpdateIssue,
  issueController.updateIssue,
);
router.delete("/:id", auth(roles.maintainer), issueController.deleteIssue);

export const issueRouter = router;
