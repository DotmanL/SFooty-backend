import express from "express";
import { deleteAccountAsync, getUserAsync } from "../controllers/user";
import { requireAuth } from "../middlewares/require-auth";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.get("/getUser", validateRequest, requireAuth, getUserAsync);
router.delete(
  "/deleteAccount",
  validateRequest,
  requireAuth,
  deleteAccountAsync
);

module.exports = router;
