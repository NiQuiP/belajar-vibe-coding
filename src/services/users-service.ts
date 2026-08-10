import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, session, type NewUser, type NewSession } from '../db/schema';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export type RegisterUserResult =
  | { success: true; data: string }
  | { success: false; error: string; statusCode: number };

export async function registerUserService(input: RegisterUserInput): Promise<RegisterUserResult> {
  const { name, email, password } = input;

  // 1. Check if email already exists
  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUsers.length > 0) {
    return {
      success: false,
      error: 'email sudah terdaftar',
      statusCode: 400,
    };
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Insert new user
  const newUser: NewUser = {
    name,
    email,
    password: hashedPassword,
  };

  await db.insert(users).values(newUser);

  return {
    success: true,
    data: 'OK',
  };
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export type LoginUserResult =
  | { success: true; data: string }
  | { success: false; error: string; statusCode: number };

export async function loginUserService(input: LoginUserInput): Promise<LoginUserResult> {
  const { email, password } = input;

  // 1. Find user by email
  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const user = existingUsers[0];
  if (!user) {
    return {
      success: false,
      error: 'email atau password salah',
      statusCode: 400,
    };
  }

  // 2. Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return {
      success: false,
      error: 'email atau password salah',
      statusCode: 400,
    };
  }

  // 3. Generate UUID token
  const token = crypto.randomUUID();

  // 4. Save session
  const newSession: NewSession = {
    token,
    userId: user.id,
  };

  await db.insert(session).values(newSession);

  // 5. Return token
  return {
    success: true,
    data: token,
  };
}

export interface CurrentUserResponse {
  id: number;
  name: string;
  email: string;
  created_at: Date | string;
}

export type GetCurrentUserResult =
  | { success: true; data: CurrentUserResponse }
  | { success: false; error: string; statusCode: number };

export async function getCurrentUserService(token: string): Promise<GetCurrentUserResult> {
  // 1. Find session by token
  const sessions = await db.select().from(session).where(eq(session.token, token)).limit(1);

  const userSession = sessions[0];
  if (!userSession) {
    return {
      success: false,
      error: 'Unauthorized',
      statusCode: 401,
    };
  }

  // 2. Find user by userId
  const foundUsers = await db.select().from(users).where(eq(users.id, userSession.userId)).limit(1);

  const user = foundUsers[0];
  if (!user) {
    return {
      success: false,
      error: 'Unauthorized',
      statusCode: 401,
    };
  }

  return {
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt,
    },
  };
}
