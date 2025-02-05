import { createSession } from "..";
import { BadRequestError } from "../errors/bad-request-error";
import { IBase } from "../interfaces/IBase";
import { FollowState } from "../models/user";

interface ICreateUser extends IBase {
  userName: string;
  createdAtTimeStamp?: string;
}

export async function createUserAsync(user: ICreateUser) {
  const session = createSession();
  try {
    const usernameExistsResult = await session.run(
      `MATCH (n:User) WHERE n.username = '${user.userName}' RETURN n`
    );

    if (usernameExistsResult.records.length > 0) {
      throw new BadRequestError(
        `User node already exists with Username: ${user.userName}`
      );
    }
    await session.run(
      "CREATE CONSTRAINT constraint_username IF NOT EXISTS FOR (n:User) REQUIRE n.username IS UNIQUE"
    );

    await session.run(
      `CREATE (n:User {id: $id,  username: $username, createdAtTimeStamp: $createdAtTimeStamp}) RETURN n`,
      {
        id: user.id,
        username: user.userName,
        createdAtTimeStamp: user.createdAtTimeStamp
      }
    );
  } finally {
    session.close();
  }
}

async function followUserAsync(currentUserId: string, userToFollowId: string) {
  const session = createSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $currentUserId}), (f:User {id: $userToFollowId})
    WHERE NOT (u)-[:Follows]->(f)
    CREATE (u)-[r:Follows]->(f)
    SET r.timestamp = timestamp()
    RETURN u, f;`,
      {
        currentUserId,
        userToFollowId
      }
    );
    if (result.records.length > 0) {
      return true;
    } else {
      throw new BadRequestError(`User is already being followed`);
    }
  } finally {
    session.close();
  }
}

async function unfollowUserAsync(
  currentUserId: string,
  userToUnfollowId: string
) {
  const session = createSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $currentUserId})-[r:Follows]->(f:User {id: $userToUnfollowId})
    DELETE r
    RETURN u, f;`,
      {
        currentUserId,
        userToUnfollowId
      }
    );

    if (result.records.length > 0) {
      return true;
    } else {
      throw new BadRequestError(`User doesn't follow so can't be unfollowed`);
    }
  } finally {
    session.close();
  }
}

async function getUserProfile(currentUserId: string, userId: string) {
  const session = createSession();

  const isMine = currentUserId === userId;
  try {
    let query = `
    MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)<-[:Follows]-(follower:User)
    WITH u, COUNT(DISTINCT follower) AS followersCount
    OPTIONAL MATCH (u)-[:Follows]->(following:User)
    WITH u, followersCount, COUNT(DISTINCT following) AS followingCount
    RETURN 
      u,
      followingCount,
      followersCount,
      CASE WHEN $currentUserId <> $userId THEN EXISTS { MATCH (cu:User {id: $currentUserId})-[:Follows]->(u) } ELSE false END AS isFollowing,
      CASE WHEN $currentUserId <> $userId THEN EXISTS { MATCH (u)-[:Follows]->(cu:User {id: $currentUserId}) } ELSE false END AS isFollower;
      `;

    const result = await session.run(query, {
      currentUserId,
      userId
    });

    const isFollowing = result.records[0].get("isFollowing");
    const isFollower = result.records[0].get("isFollower");

    let followState: FollowState;

    if (isFollowing) {
      if (isMine) {
        followState = FollowState.None;
      } else {
        followState = FollowState.Following;
      }
    } else if (isFollower) {
      followState = FollowState.FollowBack;
    } else {
      followState = isMine ? FollowState.None : FollowState.Follow;
    }
    return {
      followingCount: result.records[0].get("followingCount").toNumber() - 1,
      followersCount: result.records[0].get("followersCount").toNumber() - 1,
      followState: followState,
      isFollower: isFollower
    };
  } finally {
    session.close();
  }
}

// async function checkUserRelationAsync(currentUserId: string, userId: string) {
//   const session = createSession();
//   try {
//     let query = `
//       MATCH (:User {id: $currentUserId})-[:Follows]->(u:User {id: $userId})
//       RETURN COUNT(u) > 0 AS isFollowing
//     `;

//     const result = await session.run(query, {
//       currentUserId,
//       userId
//     });

//     return result.records[0].get("isFollowing");
//   } finally {
//     session.close();
//   }
// }

async function listFollowersAsync(
  userId: string,
  cursorId: string | undefined,
  takeNumber: number
) {
  const session = createSession();
  try {
    let query = `
      MATCH (u:User {id: $userId})<-[r:Follows]-(follower:User)
    `;

    if (cursorId) {
      query += ` WHERE r.timestamp < $cursorTimestamp`;
    }

    query += `
      WITH follower, r.timestamp AS followTimestamp
      ORDER BY followTimestamp DESC
      SKIP ${cursorId ? 1 : 0}
      LIMIT ${takeNumber}
      RETURN follower, [(follower)<-[:Follows]-(:User {id: $userId}) | 1] AS rels
    `;

    const result = await session.run(query, {
      userId,
      cursorTimestamp: cursorId ? parseInt(cursorId) : null
    });

    return result.records
      .map((record) => {
        const follower = record.get("follower").properties;
        const isFollowingBack = record.get("rels").length > 0;
        return {
          ...follower,
          followState: isFollowingBack
            ? FollowState.Following
            : FollowState.FollowBack
        };
      })
      .filter((r) => r.id !== userId);
  } finally {
    session.close();
  }
}

async function listFollowingAsync(
  userId: string,
  cursorId: string | undefined,
  takeNumber: number
) {
  const session = createSession();
  try {
    let query = `MATCH (u:User {id: $userId})-[r:Follows]->(following:User)`;

    if (cursorId) {
      query += ` WHERE r.timestamp < $cursorTimestamp`;
    }

    query += `
    WITH following, r.timestamp AS followTimestamp
    ORDER BY followTimestamp DESC
    SKIP ${cursorId ? 1 : 0}
    LIMIT ${takeNumber}
    RETURN following
    `;

    const result = await session.run(query, {
      userId,
      cursorTimestamp: cursorId ? parseInt(cursorId) : null
    });

    return result.records
      .map((record) => {
        const followingUser = record.get("following").properties;
        return {
          ...followingUser,
          followState: FollowState.Following
        };
      })
      .filter((r) => r.id !== userId);
  } finally {
    session.close();
  }
}

// Matches the user with the specified userId.
// Follows the [:OWNS]-> relationship to find all posts owned by the user.
// Follows the [:HAS_COMMENT]-> relationship to find all comments associated with those posts to delete.
// MATCH (u:User {id: $userId})-[:OWNS]->(p:Post)-[:HAS_COMMENT]->(c:Comment) DETACH DELETE u, p, c
async function deleteUserAsync(userId: string) {
  const session = createSession();
  try {
    await session.run(
      `MATCH (n:User {id: '${userId}' })-[:Posted]->(p:Post) DETACH DELETE n, p`,
      {
        userId
      }
    );
    await session.run(`MATCH (n:User {id: '${userId}' }) DETACH DELETE n`, {
      userId
    });
  } finally {
    session.close();
  }
}

export const UserGraphQueries = {
  createUserAsync,
  followUserAsync,
  unfollowUserAsync,
  listFollowersAsync,
  listFollowingAsync,
  getUserProfile,
  deleteUserAsync
};
