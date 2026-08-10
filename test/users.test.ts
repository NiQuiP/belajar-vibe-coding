import { describe, expect, it, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import { usersRoute } from '../src/routes/users-route';
import { db } from '../src/db';
import { users, session } from '../src/db/schema';

const app = new Elysia().use(usersRoute);

describe('User API Endpoints', () => {
  beforeEach(async () => {
    // Delete test data before each test to maintain consistency
    await db.delete(session);
    await db.delete(users);
  });

  describe('POST /api/users/register', () => {
    it('should register user successfully', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json).toEqual({ data: 'OK' });
    });

    it('should fail when registering duplicate email', async () => {
      // First registration
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User 1',
            email: 'duplicate@example.com',
            password: 'password123',
          }),
        })
      );

      // Duplicate registration
      const response = await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User 2',
            email: 'duplicate@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: 'email sudah terdaftar' });
    });

    it('should fail when name exceeds 255 characters', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'a'.repeat(300),
            email: 'longname@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Register user first
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Login User',
            email: 'login@example.com',
            password: 'password123',
          }),
        })
      );

      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'login@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(typeof json.data).toBe('string');
    });

    it('should fail with wrong email', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: 'email atau password salah' });
    });

    it('should fail with wrong password', async () => {
      // Register user first
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'User Password Test',
            email: 'wrongpass@example.com',
            password: 'correctpassword',
          }),
        })
      );

      const response = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'wrongpass@example.com',
            password: 'wrongpassword',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({ error: 'email atau password salah' });
    });
  });

  describe('POST /api/users/current', () => {
    it('should get current user info with valid token', async () => {
      // Register
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Current User Test',
            email: 'current@example.com',
            password: 'password123',
          }),
        })
      );

      // Login
      const loginRes = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'current@example.com',
            password: 'password123',
          }),
        })
      );
      const loginJson = await loginRes.json();
      const token = loginJson.data;

      // Get Current User
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.email).toBe('current@example.com');
      expect(json.data.name).toBe('Current User Test');
    });

    it('should fail when Authorization header is missing', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'POST',
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: 'Unauthorized' });
    });

    it('should fail with invalid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer invalid-token-123',
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('DELETE /api/users/logout', () => {
    it('should logout user successfully and invalidate token', async () => {
      // Register
      await app.handle(
        new Request('http://localhost/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Logout Test User',
            email: 'logout@example.com',
            password: 'password123',
          }),
        })
      );

      // Login
      const loginRes = await app.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'logout@example.com',
            password: 'password123',
          }),
        })
      );
      const loginJson = await loginRes.json();
      const token = loginJson.data;

      // Logout
      const logoutRes = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(logoutRes.status).toBe(200);
      const logoutJson = await logoutRes.json();
      expect(logoutJson).toEqual({ data: 'OK' });

      // Verify token is no longer valid for getCurrentUser
      const currentRes = await app.handle(
        new Request('http://localhost/api/users/current', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(currentRes.status).toBe(401);
    });

    it('should fail logout with invalid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer non-existent-token',
          },
        })
      );

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json).toEqual({ error: 'Unauthorized' });
    });
  });
});
