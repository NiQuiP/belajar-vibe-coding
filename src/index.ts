import { Elysia, t } from 'elysia';
import { db } from './db';
import { users } from './db/schema';

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .get('/', () => ({
    status: 'ok',
    message: 'Welcome to ElysiaJS + Drizzle + MySQL API',
  }))
  .get('/users', async ({ set }) => {
    try {
      const allUsers = await db.select().from(users);
      return { success: true, data: allUsers };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  })
  .post(
    '/users',
    async ({ body, set }) => {
      try {
        const result = await db.insert(users).values(body);
        set.status = 201;
        return { success: true, message: 'User created successfully', result };
      } catch (error: any) {
        set.status = 500;
        return { success: false, error: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: 'email' }),
      }),
    }
  )
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
