import { IBase } from "./IBase";

export interface IFeedPost extends IBase {
  username: string;
  userId?: string;
  profileImageUri: string;
  createdAtTimeStamp: string;
  text?: string;
  imageUrls?: string[]; //TODO: rename properly
  commentsCount?: number;
  whistleCount?: number;
  likeCount?: number;
  bookmarked?: boolean;
}
