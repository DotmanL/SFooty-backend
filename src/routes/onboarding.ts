import express from "express";
import {
  createClubInterestsAsync,
  createLeagueInterestsAsync,
  updateUserOnboardingStatusAsync
} from "../controllers/onboarding";
import { validateRequest } from "../middlewares/validate-request";
import { requireAuth } from "../middlewares/require-auth";

const router = express.Router();

router.post(
  "/createLeagueInterests",
  validateRequest,
  requireAuth,
  createLeagueInterestsAsync
);

router.post(
  "/createClubInterests",
  validateRequest,
  requireAuth,
  createClubInterestsAsync
);

router.put(
  "/updateOnboardingStatus",
  validateRequest,
  requireAuth,
  updateUserOnboardingStatusAsync
);

module.exports = router;
