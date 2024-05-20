import express from "express";
import "dotenv/config";
import { validateRequest } from "../middlewares/validate-request";
import { requireAuth } from "../middlewares/require-auth";
import {
  createAsync,
  deleteAsync,
  listAllMediaPostsAsync,
  listAllPostsAsync,
  listFollowingPostsAsync
} from "../controllers/post";
import { body } from "express-validator";
import multer from "multer";
const cloudinary = require("../config/cloudinary");
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder: string | undefined;
    let resource_type: string | undefined;
    if (file.mimetype.startsWith("image/")) {
      folder = process.env.CLOUD_FOLDER_NAME;
      resource_type = "image";
    } else if (file.mimetype.startsWith("video/")) {
      folder = process.env.CLOUD_FOLDER_NAME;
      resource_type = "video";
    } else {
      throw new Error("Unsupported file type");
    }
    return {
      folder: folder,
      resource_type: resource_type
    };
  }
});

const parser = multer({ storage: storage, limits: { fileSize: 150 * 1024 * 1024 }});

const router = express.Router();

router.post(
  "/createPost",
  [body("text").isLength({ max: 240 })],
  validateRequest,
  parser.array("media", 6),
  requireAuth,
  createAsync
);

router.get(
  "/listFollowingPosts",
  validateRequest,
  requireAuth,
  listFollowingPostsAsync
);

router.get(
  "/listAllPosts/:userId",
  validateRequest,
  requireAuth,
  listAllPostsAsync
);
router.get(
  "/listAllMediaPosts/:userId",
  validateRequest,
  requireAuth,
  listAllMediaPostsAsync
);
router.delete("/deletePost/:id", validateRequest, requireAuth, deleteAsync);

module.exports = router;
