import mongoose from "mongoose";
import { PasswordManager } from "../services/password";

export enum OnboardingStatus {
  None,
  RegisteredLeagues,
  RegisteredClubs
}
export interface IUser {
  userName: string;
  email: string;
  password?: string;
  onboardingStatus: OnboardingStatus;
}

export interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: IUser): UserDoc;
}

export interface UserDoc extends mongoose.Document {
  userName: string;
  email: string;
  password?: string;
  onboardingStatus: number;
}

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    onboardingStatus: { type: Number, required: true }
  },

  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      }
    }
  }
);

userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await PasswordManager.toHash(this.get("password"));
    this.set("password", hashed);
  }

  done();
});

userSchema.statics.build = (user: IUser) => {
  return new UserSchema(user);
};

const UserSchema = mongoose.model<UserDoc, UserModel>("User", userSchema);
export { UserSchema };
