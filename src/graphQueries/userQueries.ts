import { createSession } from "..";
import { BadRequestError } from "../errors/bad-request-error";
import { IBase } from "../interfaces/IBase";

interface ICreateUser extends IBase {
  userName: string;
}

export async function createUser(user: ICreateUser) {
  const session = createSession();
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
    `CREATE (n:User {id: $id,  username: $username}) RETURN n`,
    {
      id: user.id,
      username: user.userName
    }
  );
}

async function deleteUser(userId: string) {
  const session = createSession();
  await session.run(`MATCH (n:User {id: '${userId}' }) DETACH DELETE n`, {
    userId
  });
}

export const UserGraphQueries = { createUser, deleteUser };
