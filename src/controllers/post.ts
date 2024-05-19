import "dotenv/config";
import { Request, Response } from "express";
import { handleErrorResponse } from "../middlewares/error-handler";
import { PostsSchema } from "../models/posts";
import { PostGraphQueries } from "../graphQueries/postQueries";
import { BadRequestError } from "../errors/bad-request-error";
import mongoose from "mongoose";
import { IFeedPost } from "../interfaces/IFeedPost";
import { UserSchema } from "../models/user";
import { CommentsSchema } from "../models/comments";
import { ObjectId } from "mongodb";
const cloudinary = require("../config/cloudinary");

//TODO: abstract these methods here into  base methods
async function createAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    const { text } = req.body;
    //TODO: rename imageUrls to mediaUrls
    req.body.imageUrls = [];
    req.body.imagesCloudinaryFileNames = [];

    if (req.files) {
      req.body.imageUrls = await Promise.all(
        Object.values(req.files).map(async (fileObj) => {
          try {
            const result = await cloudinary.uploader.upload(fileObj.path, {
              resource_type: fileObj.mimetype.startsWith("video/")
                ? "video"
                : "image",
              quality: "auto"
            });
            req.body.imagesCloudinaryFileNames.push(result.original_filename);
            return result.secure_url;
          } catch (error) {
            console.error("Error uploading image to Cloudinary:", error);
            return null;
          }
        })
      );
    }

    const post = PostsSchema.build({
      text,
      imageUrls: req.body.imageUrls,
      imagesCloudinaryFileNames: req.body.imagesCloudinaryFileNames,
      userId: currentUser!.id
    });

    const createdPost = await post.save();
    await PostGraphQueries.createPost({
      userId: currentUser!.id,
      id: post.id,
      createdAtTimeStamp: createdPost.createdAt?.getTime().toFixed(0),
      username: currentUser!.username,
      text: text,
      imageUrls: req.body.imageUrls
    });
    res.status(201).json(post);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listAllPostsAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    let { cursorId, take } = req.query;
    const takeNumber = take ? parseInt(take as string, 10) : 10;
    const cursorIdProvided =
      cursorId !== " "
        ? new mongoose.Types.ObjectId(cursorId as string)
        : undefined;

    let query = { userId: userId };

    if (cursorId !== " ") {
      //@ts-ignore
      query._id = { $lt: cursorIdProvided };
    }

    const allPosts = await PostsSchema.find(query)
      .populate({
        path: "userId",
        select: "userName",
        model: UserSchema
      })
      .limit(takeNumber)
      .sort({ createdAt: -1 });

    //@ts-ignore
    const allFeedPosts: IFeedPost[] = allPosts.map((allPost) => {
      const {
        createdAt,
        _id,
        userId,
        imageUrls,
        imagesCloudinaryFileNames,
        text
      } = allPost;

      //@ts-ignore
      const { _id: userIdString, userName } = userId;
      return {
        id: _id.toString(),
        userId: userIdString.toString(),
        username: userName,
        imageUrls,
        imagesCloudinaryFileNames,
        text,
        createdAtTimeStamp: createdAt!.getTime().toFixed(0)
      };
    });

    return res.status(200).json(allFeedPosts);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listAllMediaPostsAsync(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    let { cursorId, take } = req.query;
    const takeNumber = take ? parseInt(take as string, 10) : 10;
    const cursorIdProvided =
      cursorId !== " "
        ? new mongoose.Types.ObjectId(cursorId as string)
        : undefined;

    let query = { userId: userId, imageUrls: { $ne: [] } };
    if (cursorId !== " ") {
      //@ts-ignore
      query._id = { $lt: cursorIdProvided };
    }
    const allPosts = await PostsSchema.find(query)
      .populate({
        path: "userId",
        select: "userName",
        model: UserSchema
      })
      .limit(takeNumber)
      .sort({ createdAt: -1 });

    //@ts-ignore
    const allFeedPosts: IFeedPost[] = allPosts.map((allPost) => {
      const {
        createdAt,
        _id,
        userId,
        imageUrls,
        imagesCloudinaryFileNames,
        text
      } = allPost;

      //@ts-ignore
      const { _id: userIdString, userName } = userId;
      return {
        id: _id.toString(),
        userId: userIdString.toString(),
        username: userName,
        imageUrls,
        imagesCloudinaryFileNames,
        text,
        createdAt: createdAt!.getTime().toFixed(0)
      };
    });

    return res.status(200).json(allFeedPosts);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function listFollowingPostsAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    let { cursorId, take } = req.query;

    if (cursorId === " ") {
      cursorId = undefined;
    }

    const takeNumber = take ? parseInt(take as string, 10) : 10;

    const posts: IFeedPost[] = await PostGraphQueries.listFollowingPosts(
      currentUser?.id!,
      cursorId as string,
      takeNumber
    );

    const postIds = posts.map((post) => new ObjectId(post.id));

    const commentCounts = await CommentsSchema.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } }
    ]);

    const commentCountMap = new Map(
      commentCounts.map((count) => [count._id.toString(), count.count])
    );

    const postsWithCommentCount = posts.map((post) => ({
      ...post,
      commentsCount: commentCountMap.get(post.id!.toString()) || 0
    }));

    return res.status(200).json(postsWithCommentCount);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function deleteAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;

    const { id } = req.params;
    const existingPost = await PostsSchema.findOne({
      _id: id,
      userId: currentUser!.id
    });

    if (!existingPost) {
      throw new BadRequestError(`No post exists with this id:${id}`);
    }

    if (
      existingPost.imagesCloudinaryFileNames &&
      existingPost.imagesCloudinaryFileNames.length > 0
    ) {
      await Promise.all(
        existingPost.imagesCloudinaryFileNames.map(async (icf) => {
          await cloudinary.api.delete_resources(
            [`${process.env.CLOUD_FOLDER_NAME}/${icf}`],
            { type: "upload" }
          );
        })
      );
    }

    await existingPost.deleteOne();
    await PostGraphQueries.deletePost(id);
    res.status(200).json({
      status: "success"
    });
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

export async function deleteAllPostsAsync(userId: string) {
  const existingPosts = await PostsSchema.find({ userId: userId });
  try {
    if (!existingPosts || existingPosts.length === 0) {
      return true;
    }

    await Promise.all(
      existingPosts.map(async (post) => {
        if (
          post.imagesCloudinaryFileNames &&
          post.imagesCloudinaryFileNames.length > 0
        ) {
          await cloudinary.api.delete_resources(
            post.imagesCloudinaryFileNames.map(
              (icf) => `${process.env.CLOUD_FOLDER_NAME}/${icf}`
            ),
            { type: "upload" }
          );
        }
      })
    );

    await PostsSchema.deleteMany({ userId: userId });
    await Promise.all(
      existingPosts.map(async (post) => {
        await PostGraphQueries.deletePost(post.id);
      })
    );
    return true;
  } catch (error: any) {
    console.error(error, "Something went wrong deleting post");
    return false;
  }
}

export {
  createAsync,
  listFollowingPostsAsync,
  deleteAsync,
  listAllPostsAsync,
  listAllMediaPostsAsync
};
