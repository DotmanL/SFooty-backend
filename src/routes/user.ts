import express from "express";
import {
  deleteAccountAsync,
  followAsync,
  getUserAsync,
  getUserProfileAsync,
  listAllUsersAsync,
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
router.get("/listAllUsers", validateRequest, requireAuth, listAllUsersAsync);
router.get("/getUser", validateRequest, requireAuth, getUserAsync);
router.get(
  "/getUserProfile/:userId",
  validateRequest,
  requireAuth,
  getUserProfileAsync
);
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
