import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { InterestsSchema } from "../models/interests";
import { IUser, OnboardingStatus, UserSchema } from "../models/user";
import { handleErrorResponse } from "../middlewares/error-handler";
import { UserGraphQueries } from "../graphQueries/userQueries";
import { deleteAllPostsAsync } from "./post";
import { PostsSchema } from "../models/posts";
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

//TODO: remove this method once search is implemented
async function listAllUsersAsync(req: Request, res: Response) {
  try {
    const users = await UserSchema.find();

    if (!users) {
      throw new Error("No users found.");
    }

    res.status(200).json(users);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function getUserProfileAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const { userId } = req.params;

    let user = await UserSchema.findById(userId);

    const allPosts = await PostsSchema.find({ userId: userId });

    if (!user) {
      throw new BadRequestError(`No user exists with id: ${userId}`);
    }

    const profile = await UserGraphQueries.getUserProfile(
      currentUser!.id,
      userId
    );

    const userData: IUser = {
      ...user.toObject(),
      ...profile,
      postsCount: allPosts.length
    };

    res.status(200).json(userData);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function followAsync(req: Request, res: Response) {
  try {
    const { userToFollowId } = req.params;
    const currentUser = req.currentUser;
    const isSuccessful = await UserGraphQueries.followUserAsync(
      currentUser?.id!,
      userToFollowId
    );

    if (isSuccessful) {
      return res.status(200).json({
        status: "success"
      });
    }
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function unfollowAsync(req: Request, res: Response) {
  try {
    const { userToUnfollowId } = req.params;
    const currentUser = req.currentUser;
    const isSuccessful = await UserGraphQueries.unfollowUserAsync(
      currentUser?.id!,
      userToUnfollowId
    );

    if (isSuccessful) {
      return res.status(200).json({
        status: "success"
      });
    }
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listFollowersAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    let { cursorId, take } = req.query;

    if (!cursorId) {
      cursorId = undefined;
    }

    const takeNumber = take ? parseInt(take as string, 10) : 10;

    const followers = await UserGraphQueries.listFollowersAsync(
      userId,
      cursorId as string,
      takeNumber
    );

    return res.status(200).json({
      followers
    });
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listFollowingAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    let { cursorId, take } = req.query;

    if (!cursorId) {
      cursorId = undefined;
    }

    const takeNumber = take ? parseInt(take as string, 10) : 10;

    const following = await UserGraphQueries.listFollowingAsync(
      userId,
      cursorId as string,
      takeNumber
    );

    return res.status(200).json({
      following
    });
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
      await userInterest.deleteOne();
    }

    const isSuccessful = await deleteAllPostsAsync(currentUser?.id!);
    if (isSuccessful) {
      await UserGraphQueries.deleteUserAsync(currentUser?.id!);
      await existingUser.deleteOne();
    }

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

export {
  deleteAccountAsync,
  getUserAsync,
  getUserProfileAsync,
  followAsync,
  unfollowAsync,
  listAllUsersAsync,
  listFollowersAsync,
  listFollowingAsync
};
