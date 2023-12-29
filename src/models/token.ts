import mongoose, { model } from "mongoose";

export interface IToken {
  email: string;
  token: string;
  expiresIn?: Date;
}

interface TokenDoc extends mongoose.Document {
  email: string;
  token: string;
  expiresIn?: Date;
}

interface TokenModel extends mongoose.Model<TokenDoc> {
  build(attrs: IToken): TokenDoc;
}

const tokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    expires: { type: Date, default: Date.now, expires: "10m" }
  },

  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

tokenSchema.statics.build = (token: IToken) => {
  return new TokenSchema(token);
};

const TokenSchema = model<TokenDoc, TokenModel>("Token", tokenSchema);
export { TokenSchema };
