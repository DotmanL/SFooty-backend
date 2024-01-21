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
    req.body.imageUrls = [];
    req.body.imagesCloudinaryFileNames = [];

    if (req.files) {
      req.body.imageUrls = await Promise.all(
        Object.values(req?.files).map(async (fileObj) => {
          try {
            const result = await cloudinary.uploader.upload(fileObj.path);
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

    await post.save();
    await PostGraphQueries.createPost({
      userId: currentUser!.id,
      id: post.id
    });
    res.status(201).json(post);
  } catch (err: any) {
    handleErrorResponse(res, err);
  }
}

async function deletePostAsync(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingPost = await PostsSchema.findById(id);

    if (!existingPost) {
      throw new BadRequestError(`No post exists with this id:${id}`);
    }

    if (
      existingPost.imagesCloudinaryFileNames &&
      existingPost.imagesCloudinaryFileNames.length > 0
    ) {
      await Promise.all(
        existingPost.imagesCloudinaryFileNames.map(async (imp) => {
          await cloudinary.api.delete_resources(
            [`${process.env.CLOUD_FOLDER_NAME}/${imp}`],
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

export { createAsync, deletePostAsync };
