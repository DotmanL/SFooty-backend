import "dotenv/config";
import { Request, Response } from "express";
import { handleErrorResponse } from "../middlewares/error-handler";
import { CommentsSchema } from "../models/comments";
import { BadRequestError } from "../errors/bad-request-error";
import mongoose from "mongoose";
import { IUser, UserSchema } from "../models/user";
const cloudinary = require("../config/cloudinary");

async function createAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const { text } = req.body;
    const { postId } = req.params;

    req.body.mediaUrls = [];
    req.body.mediaCloudinaryFileNames = [];

    if (req.files) {
      req.body.mediaUrls = await Promise.all(
        Object.values(req.files).map(async (fileObj) => {
          try {
            const result = await cloudinary.uploader.upload(fileObj.path, {
              resource_type: fileObj.mimetype.startsWith("video/")
                ? "video"
                : "image",
              quality: "auto"
            });
            req.body.mediaCloudinaryFileNames.push(result.original_filename);
            return result.secure_url;
          } catch (error) {
            console.error("Error uploading media to Cloudinary:", error);
            return null;
          }
        })
      );
    }

    const comment = CommentsSchema.build({
      text,
      postId,
      mediaUrls: req.body.mediaUrls,
      mediaCloudinaryFileNames: req.body.mediaCloudinaryFileNames,
      userId: currentUser!.id
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function getPostCommentsAsync(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    let { cursorId, take } = req.query;

    const takeNumber = take ? parseInt(take as string, 10) : 10;
    const cursorIdProvided =
      cursorId !== " "
        ? new mongoose.Types.ObjectId(cursorId as string)
        : undefined;

    let query = { postId: postId };

    if (cursorIdProvided) {
      //@ts-ignore
      query._id = { $lt: cursorIdProvided };
    }

    const comments = await CommentsSchema.find(query)
      .populate({
        path: "userId",
        select: "userName",
        model: UserSchema
      })
      .limit(takeNumber)
      .sort({ createdAt: -1 });

    const paginatedComments = comments.map((comment) => {
      const { _id, userId: user, text, createdAt } = comment;
      //@ts-ignore
      const { userName, id } = user as IUser;
      return {
        id: _id.toString(),
        text,
        createdAtTimeStamp: createdAt!.getTime().toFixed(0),
        username: userName,
        userId: id
      };
    });

    return res.status(200).json(paginatedComments);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function deleteAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const { id } = req.params;
    const existingComment = await CommentsSchema.findOne({
      _id: id,
      userId: currentUser!.id
    });

    if (!existingComment) {
      throw new BadRequestError(`No comment exists with this id:${id}`);
    }

    if (
      existingComment.mediaCloudinaryFileNames &&
      existingComment.mediaCloudinaryFileNames.length > 0
    ) {
      await Promise.all(
        existingComment.mediaCloudinaryFileNames.map(async (icf) => {
          await cloudinary.api.delete_resources(
            [`${process.env.CLOUD_FOLDER_NAME}/${icf}`],
            { type: "upload" }
          );
        })
      );
    }

    await existingComment.deleteOne();
    res.status(200).json({
      status: "success"
    });
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

export { createAsync, deleteAsync, getPostCommentsAsync };
