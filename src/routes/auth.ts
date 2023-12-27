import express, { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validate-request";
import {
  getEmailProvidersAsync,
  loginAsync,
  loginWithIdpAsync,
  signUpAsync,
  signUpWithIdpAsync
} from "../controllers/auth";

const router = express.Router();

router.post(
  "/signup",
  [
    body("userName").not().isEmpty(),
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
  ],
  validateRequest,
  signUpAsync
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").notEmpty().withMessage("Password cannot be empty")
  ],
  validateRequest,
  loginAsync
);

router.post(
  "/signupWithIdp",
  [
    body("userName").not().isEmpty(),
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("idToken").not().isEmpty(),
    body("providerId").not().isEmpty()
  ],
  validateRequest,
  signUpWithIdpAsync
);

router.post(
  "/loginWithIdp",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("idToken").not().isEmpty(),
    body("providerId").not().isEmpty()
  ],
  validateRequest,
  loginWithIdpAsync
);

router.post(
  "/getEmailProvider",
  [body("email").isEmail().withMessage("Email must be valid")],
  validateRequest,
  getEmailProvidersAsync
);

module.exports = router;
