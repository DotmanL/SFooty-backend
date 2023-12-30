import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { UserSchema } from "../models/user";

export const checkDuplicateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userName, email } = req.body;
  try {
    const existingUserByEmail = await UserSchema.findOne({ email });
    if (existingUserByEmail) {
      throw new BadRequestError(`User already exists with email: ${email}`);
    }

    const existingUserByUserName = await UserSchema.findOne({ userName });

    if (existingUserByUserName) {
      throw new BadRequestError(
        `User already exists with Username: ${userName}`
      );
    }
    next();
  } catch (error) {
    next(error);
    // console.error(error);
  }
  //   next();
};
