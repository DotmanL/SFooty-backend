import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { InterestsSchema } from "../models/interests";
import { OnboardingStatus, UserSchema } from "../models/user";
import { handleErrorResponse } from "../middlewares/error-handler";
const admin = require("firebase-admin");

//TODO: get user by user id stored in the secure store, improve this with user session data instead
async function getUserAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;

    const user = await UserSchema.findById(currentUser!.id);

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${currentUser!.id}`);
    }

    res.status(200).json(user);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

//NOTE: we only delete account with password provider, any other provider we don't delete
//but user can't login as we always check our database for the user.
async function deleteAccountAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const existingUser = await UserSchema.findById(currentUser?.id);

    if (!existingUser) {
      throw new BadRequestError(
        `No user exists with this id:${currentUser?.id}`
      );
    }
    const userInterest = await InterestsSchema.findOne({
      userId: existingUser?.id
    });

    if (userInterest) {
      await userInterest.delete();
    }

    await existingUser.delete();

    try {
      const firebaseUsers = await admin
        .auth()
        .getUsers([{ email: existingUser.email, providerId: "password" }]);

      if (firebaseUsers) {
        const firebaseUserUid = firebaseUsers.users[0]?.uid;
        if (firebaseUserUid) {
          await admin.auth().deleteUser(firebaseUserUid);
        }
      }
      res.status(200).json({
        status: "success"
      });
    } catch (error) {
      res.status(200).json({
        status: "No firebase user to delete"
      });
    }
  } catch (err: any) {
    handleErrorResponse(res, err);
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

export { deleteAccountAsync, getUserAsync };
