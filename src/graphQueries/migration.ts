import { createSession } from "..";
import { PostsSchema } from "../models/posts";

export async function updatePostWithUserId() {
  const session = createSession();
  try {
    const result = await session.run(
      `MATCH (p:Post)
            RETURN p.id AS postId, p`
    );
    const allUserPosts = await PostsSchema.find();

    const postsToUpdate = result.records.map((record) => {
      const postId = record.get("postId");
      const correspondingUserPost = allUserPosts.find(
        (userPost) => userPost.id === postId
      );
      const userId = correspondingUserPost
        ? correspondingUserPost.userId
        : null;
      return { postId, userId };
    });

    for (const { postId, userId } of postsToUpdate) {
      if (userId) {
        const userIdString = userId.toString();
        await session.run(
          `MATCH (p:Post {id: $postId})
             SET p.userId = $userIdString`,
          { postId, userIdString }
        );
      }
    }
  } finally {
    session.close();
  }
}

export const PostGraphQueries = { updatePostWithUserId };
