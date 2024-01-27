import { createSession } from "..";
import { IBase } from "../interfaces/IBase";

interface ICreatePost extends IBase {
  text: string;
  userId: string;
  createdAtTimeStamp?: string;
  imageUrls: string;
}

export async function createPost(post: ICreatePost) {
  const session = createSession();
  try {
    await session.run(
      `MATCH (u:User {id: $userId})
    CREATE (p:Post {id: $id, createdAtTimeStamp: $createdAtTimeStamp, text: $text, imageUrls: $imageUrls})
    CREATE (u)-[:Posted]->(p)
    RETURN p, u;`,
      {
        id: post.id,
        userId: post.userId,
        text: post.text ?? "",
        imageUrls: post.imageUrls ?? "",
        createdAtTimeStamp: post.createdAtTimeStamp
      }
    );
  } finally {
    session.close();
  }
}

async function listFollowingPosts(
  userId: string,
  cursorId: string | undefined,
  takeNumber: number
) {
  const session = createSession();
  try {
    let query = `
    MATCH (u:User {id: $userId})
    MATCH (u)-[:Follows]->(following:User)
    OPTIONAL MATCH (following)-[:Posted]->(followingPost)
  `;

    if (cursorId) {
      query += ` WHERE followingPost.id > $cursorId`;
    }

    query += `
    WITH COLLECT(DISTINCT followingPost) as followingPosts
    UNWIND followingPosts AS post
    RETURN post
    ORDER BY post.createdAtTimeStamp ASC
    LIMIT ${takeNumber}
  `;

    const result = await session.run(query, {
      userId,
      cursorId
    });

    const followingPosts = result.records.map(
      (record) => record.get("post").properties
    );

    return followingPosts;
  } finally {
    session.close();
  }
}

async function deletePost(postId: string) {
  const session = createSession();
  try {
    await session.run(`MATCH (n:Post {id: '${postId}' }) DETACH DELETE n`, {
      postId
    });
  } finally {
    session.close();
  }
}

export const PostGraphQueries = { createPost, listFollowingPosts, deletePost };
