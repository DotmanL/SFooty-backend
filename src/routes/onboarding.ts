import express from "express";
import {
  createClubInterestsAsync,
  createLeagueInterestsAsync,
  updateUserOnboardingStatusAsync
} from "../controllers/onboarding";
import { validateRequest } from "../middlewares/validate-request";

const router = express.Router();

router.post(
  "/createLeagueInterests/:userId",
  validateRequest,
  createLeagueInterestsAsync
);
router.post(
  "/createClubInterests/:userId",
  validateRequest,
  createClubInterestsAsync
);

router.put(
  "/updateOnboardingStatus/:userId",
  validateRequest,
  updateUserOnboardingStatusAsync
);

module.exports = router;
