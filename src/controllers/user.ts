import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { OnboardingStatus, UserSchema } from "../models/user";
import { InterestsSchema } from "../models/interests";
import axios from "axios";
const admin = require("firebase-admin");

//TODO: get user by user id stored in the secure store, improve this with user session data instead
async function getUserAsync(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await UserSchema.findById(id);

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${id}`);
    }

    res.status(200).json(user);
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

//NOTE: we only delete account with password provider, any other provider we don't delete
//but user can't login as we always check our database for the user.
async function deleteAccountAsync(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingUser = await UserSchema.findById(id);

    if (!existingUser) {
      throw new BadRequestError(`No user exists with this id:${id}`);
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

export { getUserAsync, deleteAccountAsync };
