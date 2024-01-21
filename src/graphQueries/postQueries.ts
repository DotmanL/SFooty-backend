import { createSession } from "..";
import { IBase } from "../interfaces/IBase";

interface ICreatePost extends IBase {
  userId: string;
}

export async function createPost(post: ICreatePost) {
  const session = createSession();
  await session.run(
    `MATCH (u:User {id: $userId})
    CREATE (p:Post {id: $id})
    CREATE (u)-[:OwnsPost]->(p)
    RETURN p, u;`,
    {
      id: post.id,
      userId: post.userId
    }
  );
}

async function deletePost(postId: string) {
  const session = createSession();
  await session.run(`MATCH (n:Post {id: '${postId}' }) DETACH DELETE n`, {
    postId
  });
}

export const PostGraphQueries = { createPost, deletePost };
