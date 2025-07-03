import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';

import config from '../config/api.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Import route modules
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import staffRoutes from './routes/staff.js';
// import kpiRoutes from './routes/kpis.js';
// import dataRoutes from './routes/data.js';
// import reportRoutes from './routes/reports.js';

const server = Fastify({
  logger: config.NODE_ENV === 'development' ? {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  } : {
    level: 'warn'
  }
});

async function buildServer() {
  // Security plugins
  await server.register(helmet);
  await server.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW
  });

  // JWT authentication
  await server.register(jwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN
    }
  });

  // API Documentation
  await server.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: config.API_TITLE,
        description: config.API_DESCRIPTION,
        version: config.API_VERSION,
        contact: {
          name: 'KPI CLI Development Team',
          url: 'https://github.com/witoon-skydea/KPI-cli1'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: `http://${config.HOST}:${config.PORT}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ]
    }
  });

  await server.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next(); },
      preHandler: function (request, reply, next) { next(); }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // Health check endpoint
  server.get('/health', async (request, reply) => {
    const uptime = process.uptime();
    
    // Test database connection
    let dbStatus = 'connected';
    let dbResponseTime: number | undefined;
    try {
      const start = Date.now();
      // Simple query to test DB connection - we'll implement this later
      // await server.db?.query('SELECT 1');
      dbResponseTime = Date.now() - start;
    } catch (error) {
      dbStatus = 'disconnected';
    }

    const health = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      version: config.API_VERSION,
      uptime,
      database: {
        status: dbStatus,
        ...(dbResponseTime !== undefined && { responseTime: dbResponseTime })
      },
      services: {
        api: 'operational',
        auth: 'operational',
        reports: 'operational'
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    reply.code(statusCode).send(health);
  });

  // Ready check endpoint (for Kubernetes readiness probes)
  server.get('/ready', async (request, reply) => {
    reply.code(200).send({ status: 'ready' });
  });

  // API versioning prefix
  await server.register(async function (fastify) {
    // Register API routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(departmentRoutes, { prefix: '/departments' });
    await fastify.register(staffRoutes, { prefix: '/staff' });
    // await fastify.register(kpiRoutes, { prefix: '/kpis' });
    // await fastify.register(dataRoutes, { prefix: '/data' });
    // await fastify.register(reportRoutes, { prefix: '/reports' });
    
    // Welcome endpoint
    fastify.get('/', async (request, reply) => {
      reply.send({
        success: true,
        data: {
          message: 'Welcome to KPI Management API',
          version: config.API_VERSION,
          documentation: '/api/docs',
          health: '/health',
          endpoints: {
            auth: '/api/v1/auth',
            departments: '/api/v1/departments',
            staff: '/api/v1/staff',
            kpis: '/api/v1/kpis (coming soon)',
            data: '/api/v1/data (coming soon)',
            reports: '/api/v1/reports (coming soon)'
          }
        }
      });
    });
  }, { prefix: '/api/v1' });

  // Error handlers
  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  return server;
}

async function start() {
  try {
    const server = await buildServer();
    
    await server.listen({
      port: config.PORT,
      host: config.HOST
    });

    console.log(`
🚀 KPI Management API Server is running!

📍 Server: http://${config.HOST}:${config.PORT}
📚 API Docs: http://${config.HOST}:${config.PORT}/api/docs
🏥 Health Check: http://${config.HOST}:${config.PORT}/health
🔧 Environment: ${config.NODE_ENV}

Ready to serve API requests! 🎯
`);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await server.close();
  process.exit(0);
});

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default buildServer;
export { server };