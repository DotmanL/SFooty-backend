import axios from "axios";
import { Request, Response } from "express";
import { BadRequestError } from "../errors/bad-request-error";
import { OnboardingStatus, UserSchema } from "../models/user";
import { IFireBaseResponse } from "interfaces/IFirebaseResponse";
import { calculateExpirationTime } from "../utility/dateTime";
const admin = require("firebase-admin");

async function signUpAsync(req: Request, res: Response) {
  try {
    const { userName, email, password } = req.body;
    const existingUser = await UserSchema.findOne({ email });

    if (existingUser) {
      throw new BadRequestError(`User already exists with email: ${email}`);
    }
    const firebaseSignUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.firebase_apiKey}`;
    const fireBaseResponse: IFireBaseResponse = await axios.post(
      firebaseSignUpUrl,
      {
        userName: userName,
        email: email,
        password: password,
        returnSecureToken: true
      }
    );

    const user = UserSchema.build({
      userName: userName.trim(),
      email,
      password,
      onboardingStatus: OnboardingStatus.None
    });
    await user.save();

    req.session = {
      idToken: fireBaseResponse.data.idToken
    };

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(201).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime,
      user: user
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

//set up frontend first and ensure, I can send IdTokena and IdProvider for Google,
// for Apple, send rawNonce also
async function signUpWithIdpAsync(req: Request, res: Response) {
  try {
    const { userName, email, idToken, providerId } = req.body;
    const existingUser = await UserSchema.findOne({ email });

    if (existingUser) {
      throw new BadRequestError(`User already exists with email: ${email}`);
    }

    const user = UserSchema.build({
      userName: userName.trim(),
      email,
      onboardingStatus: OnboardingStatus.None
    });

    await user.save();

    const firebaseSignUpWithIdpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${process.env.firebase_apiKey}`;

    const data = {
      postBody: `id_token=${idToken}&providerId=${providerId}`,
      requestUri: "http://localhost",
      returnIdpCredential: true,
      returnSecureToken: true
    };

    const fireBaseResponse: IFireBaseResponse = await axios.post(
      firebaseSignUpWithIdpUrl,
      data
    );

    req.session = {
      idToken: fireBaseResponse.data.idToken
    };

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(201).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime,
      user: user
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

async function loginAsync(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const existingUser = await UserSchema.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(`No user exists with email: ${email}`);
    }

    const firebaseSignInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.firebase_apiKey}`;

    const fireBaseResponse: IFireBaseResponse = await axios.post(
      firebaseSignInUrl,
      {
        email: email,
        password: password,
        returnSecureToken: true
      }
    );

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(200).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime,
      user: existingUser
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

async function loginWithIdpAsync(req: Request, res: Response) {
  try {
    const { email, idToken, providerId } = req.body;
    const existingUser = await UserSchema.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(`No user exists with email: ${email}`);
    }

    const firebaseSignUpWithIdpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${process.env.firebase_apiKey}`;

    const data = {
      postBody: `id_token=${idToken}&providerId=${providerId}`,
      requestUri: "http://localhost",
      returnIdpCredential: true,
      returnSecureToken: true
    };

    const fireBaseResponse: IFireBaseResponse = await axios.post(
      firebaseSignUpWithIdpUrl,
      data
    );

    req.session = {
      idToken: fireBaseResponse.data.idToken
    };

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(200).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime,
      user: existingUser
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

async function resetPasswordAsync(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const existingUser = await UserSchema.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(`No user exists with email: ${email}`);
    }

    const firebaseUser = await admin.auth().getUserByEmail(email);

    await admin.auth().updateUser(firebaseUser.uid, {
      password: password
    });

    const firebaseSignInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.firebase_apiKey}`;

    const fireBaseResponse: IFireBaseResponse = await axios.post(
      firebaseSignInUrl,
      {
        email: email,
        password: password,
        returnSecureToken: true
      }
    );

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(201).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime,
      user: existingUser
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

async function changePasswordAsync(req: Request, res: Response) {
  try {
    const { email, idToken, password } = req.body;
    const existingUser = await UserSchema.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError(`No user exists with email: ${email}`);
    }

    const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.firebase_apiKey}`;
    const fireBaseResponse: IFireBaseResponse = await axios.post(firebaseUrl, {
      idToken: idToken,
      password: password,
      returnSecureToken: true
    });
    req.session = {
      idToken: fireBaseResponse.data.idToken
    };

    const expirationTime = calculateExpirationTime(
      parseInt(fireBaseResponse.data.expiresIn)
    );

    res.status(201).json({
      accessToken: fireBaseResponse.data.idToken,
      refreshToken: fireBaseResponse.data.refreshToken,
      expirationDate: expirationTime,
      user: existingUser
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      errors: [
        {
          msg: err.message || "Internal Server Error",
          status: err.statusCode || 500
        }
      ]
    });
  }
}

// Example: Find a user and populate the club and leagues
// use to find
// User.findOne({ username: 'exampleUser' })
//   .populate({
//     path: 'club',
//     populate: { path: 'leagues' },
//   })
//   .exec((err, user) => {
//     if (err) throw err;
//     console.log(user);
//   });

export {
  signUpAsync,
  loginAsync,
  signUpWithIdpAsync,
  loginWithIdpAsync,
  resetPasswordAsync,
  changePasswordAsync
};
