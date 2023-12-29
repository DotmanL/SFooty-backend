import { Request, Response } from "express";
import { InterestsSchema } from "../models/interests";
import { IUser, OnboardingStatus, UserSchema } from "../models/user";
import { BadRequestError } from "../errors/bad-request-error";
import { updateOnboardingStatusAsync } from "./user";

async function createOrUpdateAsync(req: Request, res: Response) {
  try {
    const { userId, leagueIds, clubIds } = req.body;
    const existingInterest = await InterestsSchema.findOne({ userId });

    if (existingInterest) {
      const updatedInterest = await InterestsSchema.findOneAndUpdate(
        { userId },
        { $set: { leagueIds, clubIds } },
        { new: true }
      );

      return res.status(201).json(updatedInterest);
    }

    const interestToBeCreated = InterestsSchema.build({
      userId,
      leagueIds,
      clubIds
    });

    await interestToBeCreated.save();
    res.status(201).json(interestToBeCreated);
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

export { createOrUpdateAsync };
