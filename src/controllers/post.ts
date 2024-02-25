import "dotenv/config";
import { Request, Response } from "express";
import { handleErrorResponse } from "../middlewares/error-handler";
import { PostsSchema } from "../models/posts";
import { PostGraphQueries } from "../graphQueries/postQueries";
import { BadRequestError } from "../errors/bad-request-error";
const cloudinary = require("../config/cloudinary");

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

async function listFollowingPostsAsync(req: Request, res: Response) {
  try {
    const currentUser = req.currentUser;
    let { cursorId, take } = req.query;

    if (cursorId === " ") {
      cursorId = undefined;
    }

    const takeNumber = take ? parseInt(take as string, 10) : 10;

    const posts = await PostGraphQueries.listFollowingPosts(
      currentUser?.id!,
      cursorId as string,
      takeNumber
    );

    return res.status(200).json(posts);
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

export { createAsync, listFollowingPostsAsync, deleteAsync };
