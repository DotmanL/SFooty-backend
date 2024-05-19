import mongoose, { model } from "mongoose";

export interface IComment {
  userId: string;
  username?: string;
  userImage?: string;
  postId: string;
  text?: string;
  mediaUrls?: string[];
  mediaCloudinaryFileNames?: string[];
}

interface CommentDoc extends mongoose.Document {
  userId: string;
  username?: string;
  userImage?: string;
  postId: string;
  text?: string;
  mediaUrls?: string[];
  mediaCloudinaryFileNames?: string[];
  createdAt?: Date;
}

interface CommentModel extends mongoose.Model<CommentDoc> {
  build(attrs: IComment): CommentDoc;
}

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts"
    },
    text: {
      type: String,
      maxlength: 240
    },
    mediaUrls: [
      {
        type: String
      }
    ],
    mediaCloudinaryFileNames: [
      {
        type: String
      }
    ]
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

commentSchema.statics.build = (comment: IComment) => {
  return new CommentsSchema(comment);
};

const CommentsSchema = model<CommentDoc, CommentModel>(
  "Comments",
  commentSchema
);
export { CommentsSchema };
