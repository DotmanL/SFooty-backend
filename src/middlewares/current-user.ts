import { Request, Response, NextFunction } from "express";
import { UserSchema } from "../models/user";
const admin = require("firebase-admin");

interface UserPayload {
  id: string;
  email: string;
}

//adding an optioanl property of currentUser to Request with existing type definition
declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

export const currentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const idToken =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!idToken) {
    return next();
  }

  try {
    const payload = await admin.auth().verifyIdToken(idToken);
    const firebaseUser = await admin.auth().getUser(payload.uid);
    const localUser = await UserSchema.findOne({
      email: firebaseUser.providerData[0].email
    }).lean();

    req.currentUser = { ...payload, id: localUser?._id.toString() };
  } catch (err: any) {
    console.error(err);
  }
  next();
};
