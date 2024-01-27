import { createSession } from "..";
import { BadRequestError } from "../errors/bad-request-error";
import { IBase } from "../interfaces/IBase";

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

async function listFollowersAsync(
  userId: string,
  cursorId: string | undefined,
  takeNumber: number
) {
  const session = createSession();
  try {
    let query = `MATCH (u:User {id: $userId})<-[r:Follows]-(follower:User)`;

    if (cursorId) {
      query += ` WHERE follower.id > $cursorId`;
    }

    query += ` RETURN follower ORDER BY r.timestamp DESC LIMIT  ${takeNumber}`;

    const result = await session.run(query, {
      userId,
      cursorId
    });

    return result.records.map((record) => record.get("follower").properties);
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
      query += ` WHERE following.id > $cursorId`;
    }

    query += ` RETURN following ORDER BY r.timestamp DESC LIMIT  ${takeNumber}`;

    const result = await session.run(query, {
      userId,
      cursorId
    });

    return result.records.map((record) => record.get("following").properties);
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
  deleteUserAsync
};
