import { Request, Response } from "express";
import { InterestsSchema } from "../models/interests";
import { OnboardingStatus, UserSchema } from "../models/user";
import { updateOnboardingStatusAsync } from "./user";
import { BadRequestError } from "../errors/bad-request-error";

async function createLeagueInterestsAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { leagueIds } = req.body;

    await InterestsSchema.findOneAndUpdate(
      { userId },
      { $set: { leagueIds } },
      { new: true, upsert: true }
    );
    const updateduser = await updateOnboardingStatusAsync(
      userId,
      OnboardingStatus.RegisteredLeagues
    );

    return res.status(201).json(updateduser);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

async function createClubInterestsAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { clubIds } = req.body;

    await InterestsSchema.findOneAndUpdate(
      { userId },
      { $set: { clubIds } },
      { new: true, upsert: true }
    );

    const updateduser = await updateOnboardingStatusAsync(
      userId,
      OnboardingStatus.RegisteredClubs
    );
    return res.status(201).json(updateduser);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

async function updateUserOnboardingStatusAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { onboardingStatus } = req.body;
    const user = await UserSchema.findById(userId);

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${userId}`);
    }

    const updatedUser = await UserSchema.findOneAndUpdate(
      { _id: userId },
      { $set: { onboardingStatus: onboardingStatus } },
      { new: true }
    );

    res.status(201).json(updatedUser);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

export {
  createClubInterestsAsync,
  createLeagueInterestsAsync,
  updateUserOnboardingStatusAsync
};
