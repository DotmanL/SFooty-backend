import mongoose, { model } from "mongoose";

export interface IPost {
  userId: string;
  text?: string;
  imageUrls?: string[];
  imagesCloudinaryFileNames?: string[];
}

interface PostDoc extends mongoose.Document {
  userId: string;
  text?: string;
  imageUrls?: string[];
  imagesCloudinaryFileNames?: string[];
  createdAt?: Date;
}

interface PostModel extends mongoose.Model<PostDoc> {
  build(attrs: IPost): PostDoc;
}

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    },
    text: {
      type: String,
      maxlength: 240
    },
    imageUrls: [
      {
        type: String
      }
    ],
    imagesCloudinaryFileNames: [
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

postSchema.statics.build = (post: IPost) => {
  return new PostsSchema(post);
};

const PostsSchema = model<PostDoc, PostModel>("Posts", postSchema);
export { PostsSchema };
