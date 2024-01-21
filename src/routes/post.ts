import express from "express";
import "dotenv/config";
import { validateRequest } from "../middlewares/validate-request";
import { requireAuth } from "../middlewares/require-auth";
import { createAsync, deletePostAsync } from "../controllers/post";
import { body } from "express-validator";
import multer from "multer";
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUD_FOLDER_NAME,
    allowedFormats: ["jpg", "png"]
  }
});

const parser = multer({ storage: storage });

const router = express.Router();

router.post(
  "/createPost",
  [body("text").isLength({ max: 240 })],
  validateRequest,
  parser.array("images", 6),
  requireAuth,
  createAsync
);

router.delete("/deletePost/:id", validateRequest, requireAuth, deletePostAsync);

module.exports = router;
