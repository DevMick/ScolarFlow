import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';

const router: Router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'EduStats API',
      version: '1.0.0',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'EduStats API',
      version: '1.0.0',
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      error: 'Database connection failed'
    });
  }
});

// Database status endpoint
router.get('/db-status', async (req, res) => {
  try {
    // Test database connection and get basic stats
    const userCount = await prisma.users.count();
    const classCount = await prisma.classes.count();
    const studentCount = await prisma.students.count();
    const evaluationCount = await prisma.evaluations.count();

    res.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount,
        classes: classCount,
        students: studentCount,
        evaluations: evaluationCount
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

export default router;
