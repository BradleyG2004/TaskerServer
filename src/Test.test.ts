import request from 'supertest';
import express from 'express';
import { initRoutes } from './handlers/routes';
import { AppDataSource } from './database/database';
import jwt from 'jsonwebtoken';

jest.mock('./database/database');
jest.mock('jsonwebtoken');

const app = express();
initRoutes(app);

const mockVerify = jwt.verify as jest.Mock;

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Task Resource', () => {
  describe('POST /task', () => {
    it('should create a task successfully', async () => {
      mockVerify.mockReturnValue({ userId: 1 });
      const mockTask = {
        shortDesc: 'Test Task',
        longDesc: 'This is a test task',
        deadline: '2025-09-30T00:00:00Z',
        listId: 1,
      };

      const response = await request(app)
        .post('/task')
        .set('Authorization', 'Bearer valid-token')
        .send(mockTask);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('task');
      expect(response.body.message).toBe('Task created successfully');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/task')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('shortDesc is required');
    });

    it('should return 401 for missing Authorization header', async () => {
      const response = await request(app).post('/task').send({});

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authenticated');
    });
  });
});

describe('List Resource', () => {
  describe('GET /list', () => {
    it('should retrieve lists successfully', async () => {
      mockVerify.mockReturnValue({ userId: 1 });

      const response = await request(app)
        .get('/list')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('lists');
      expect(response.body.message).toBe('Lists retrieved successfully');
    });

    it('should return 401 for missing Authorization header', async () => {
      const response = await request(app).get('/list');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authenticated');
    });
  });
});

describe('Logout Resource', () => {
  describe('DELETE /logout', () => {
    it('should log out successfully', async () => {
      mockVerify.mockReturnValue({ userId: 1 });
      const response = await request(app)
        .delete('/logout')
        .set('Cookie', 'refreshToken=valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Token successfully deleted');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app).delete('/logout');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No refresh token provided');
    });
  });
});