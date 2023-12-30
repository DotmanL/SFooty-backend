import { Request, Response } from "express";
import { InterestsSchema } from "../models/interests";
import { OnboardingStatus, UserSchema } from "../models/user";
import { updateOnboardingStatusAsync } from "./user";
import { BadRequestError } from "../errors/bad-request-error";
import { handleErrorResponse } from "../middlewares/error-handler";

async function createLeagueInterestsAsync(req: Request, res: Response) {
  try {
    const { leagueIds } = req.body;

    const currentUser = req.currentUser;

    await InterestsSchema.findOneAndUpdate(
      { userId: currentUser!.id },
      { $set: { leagueIds } },
      { new: true, upsert: true }
    );
    const updateduser = await updateOnboardingStatusAsync(
      currentUser!.id,
      OnboardingStatus.RegisteredLeagues
    );

    return res.status(201).json(updateduser);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function createClubInterestsAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const { clubIds } = req.body;

    await InterestsSchema.findOneAndUpdate(
      { userId: currentUser!.id },
      { $set: { clubIds } },
      { new: true, upsert: true }
    );

    const updateduser = await updateOnboardingStatusAsync(
      currentUser!.id,
      OnboardingStatus.RegisteredClubs
    );
    return res.status(201).json(updateduser);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function updateUserOnboardingStatusAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const { onboardingStatus } = req.body;
    const user = await UserSchema.findById(currentUser!.id);

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${currentUser!.id}`);
    }

    const updatedUser = await UserSchema.findOneAndUpdate(
      { _id: currentUser!.id },
      { $set: { onboardingStatus: onboardingStatus } },
      { new: true }
    );

    res.status(201).json(updatedUser);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

export {
  createClubInterestsAsync,
  createLeagueInterestsAsync,
  updateUserOnboardingStatusAsync
};
