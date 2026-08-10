import { Elysia, t } from 'elysia';
import { registerUserService, loginUserService, getCurrentUserService } from '../services/users-service';

export const usersRoute = new Elysia()
  .post(
    '/users/register',
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
  )
  .post(
    '/api/users',
    async ({ body, set }) => {
      try {
        const result = await loginUserService(body);

        if (!result.success) {
          set.status = result.statusCode;
          return { error: result.error };
        }

        set.status = 200;
        return { data: result.data };
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || 'Internal Server Error' };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )
  .post(
    '/api/users/current',
    async ({ headers, set }) => {
      try {
        const authHeader = headers['authorization'] || headers['Authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        const token = authHeader.substring(7).trim();
        if (!token) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }

        const result = await getCurrentUserService(token);

        if (!result.success) {
          set.status = result.statusCode;
          return { error: result.error };
        }

        set.status = 200;
        return { data: result.data };
      } catch (error: any) {
        set.status = 500;
        return { error: error.message || 'Internal Server Error' };
      }
    }
  );
