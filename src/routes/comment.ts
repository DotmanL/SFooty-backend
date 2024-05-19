import "dotenv/config";
import express from "express";
import { body } from "express-validator";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import {
  createAsync,
  deleteAsync,
  getPostCommentsAsync
} from "../controllers/comment";
import { requireAuth } from "../middlewares/require-auth";
import { validateRequest } from "../middlewares/validate-request";
const cloudinary = require("../config/cloudinary");

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

const parser = multer({ storage: storage });

const router = express.Router();

router.post(
  "/createComment/:postId",
  [body("text").isLength({ max: 240 })],
  validateRequest,
  parser.array("media", 6),
  requireAuth,
  createAsync
);

router.get(
  "/postComments/:postId",
  validateRequest,
  requireAuth,
  getPostCommentsAsync
);

router.delete("/deleteComment/:id", validateRequest, requireAuth, deleteAsync);

module.exports = router;
