import { Elysia } from 'elysia';
import { usersRoute } from './routes/users-route';

const port = Number(process.env.PORT) || 3000;

const app = new Elysia()
  .get('/', () => ({
    status: 'ok',
    message: 'Welcome to ElysiaJS + Drizzle + MySQL API',
  }))
  .use(usersRoute)
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
