import { Elysia, t } from 'elysia';
import { registerUserService } from '../services/users-service';

export const usersRoute = new Elysia({ prefix: '/users' }).post(
  '/register',
  async ({ body, set }) => {
    try {
      const result = await registerUserService(body);

      if (!result.success) {
        set.status = result.statusCode;
        return { error: result.error };
      }

      set.status = 201;
      return { data: result.data };
    } catch (error: any) {
      // Handle MySQL duplicate key error if triggered by database constraint
      if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('Duplicate entry')) {
        set.status = 400;
        return { error: 'email sudah terdaftar' };
      }
      set.status = 500;
      return { error: error.message || 'Internal Server Error' };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: 'email' }),
      password: t.String(),
    }),
  }
);
