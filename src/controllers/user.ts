import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { OnboardingStatus, UserSchema } from "../models/user";

//TODO: get user by user id stored in the secure store, improve this with user session data instead
async function getUserAsync(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await UserSchema.findById(id);

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${id}`);
    }

    res.json(user);
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

export async function updateOnboardingStatusAsync(
  userId: string,
  onboardingStatus: OnboardingStatus
) {
  try {
    const user = await UserSchema.findById(userId).lean();

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${userId}`);
    }

    const updatedUser = await UserSchema.findOneAndUpdate(
      { _id: userId },
      { $set: { onboardingStatus: onboardingStatus } },
      { new: true }
    );

    return updatedUser;
  } catch (err: any) {
    console.error("Failed to update user onboarding process");
    return;
  }
}

export { getUserAsync };
