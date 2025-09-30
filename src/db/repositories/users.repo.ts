import type { User, UserWithPassword } from '../../types/user';
import { execute, queryOne } from '../database';

interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUri?: string | null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  await execute(
    `INSERT INTO users (email, passwordHash, displayName, avatarUri) VALUES (?, ?, ?, ?);`,
    [
      input.email.trim().toLowerCase(),
      input.passwordHash,
      input.displayName.trim(),
      input.avatarUri ?? null,
    ],
  );

  const created = await getUserByEmail(input.email);
  if (!created) {
    throw new Error('Failed to retrieve newly created user');
  }
  const { passwordHash, ...user } = created;
  void passwordHash;
  return user;
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  return await queryOne<UserWithPassword>(
    `SELECT id, email, displayName, avatarUri, passwordHash FROM users WHERE email = ?`,
    [email.trim().toLowerCase()],
  );
}

export async function updateUserAvatar(userId: number, avatarUri: string | null) {
  await execute(`UPDATE users SET avatarUri = ? WHERE id = ?`, [avatarUri, userId]);
}
