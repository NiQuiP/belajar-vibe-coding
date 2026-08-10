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

  if (existingUsers.length === 0) {
    return {
      success: false,
      error: 'email atau password salah',
      statusCode: 400,
    };
  }

  const user = existingUsers[0];

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
