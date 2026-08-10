import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type NewUser } from '../db/schema';

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
