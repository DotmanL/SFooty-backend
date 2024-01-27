import express from "express";
import {
  deleteAccountAsync,
  followAsync,
  getUserAsync,
  listFollowersAsync,
  listFollowingAsync,
  unfollowAsync
} from "../controllers/user";
import { requireAuth } from "../middlewares/require-auth";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.post(
  "/follow/:userToFollowId",
  validateRequest,
  requireAuth,
  followAsync
);
router.post(
  "/unfollow/:userToUnfollowId",
  validateRequest,
  requireAuth,
  unfollowAsync
);
router.get("/getUser", validateRequest, requireAuth, getUserAsync);
router.get(
  "/listFollowers/:userId",
  validateRequest,
  requireAuth,
  listFollowersAsync
);
router.get(
  "/listFollowing/:userId",
  validateRequest,
  requireAuth,
  listFollowingAsync
);
router.delete(
  "/deleteAccount",
  validateRequest,
  requireAuth,
  deleteAccountAsync
);

module.exports = router;
