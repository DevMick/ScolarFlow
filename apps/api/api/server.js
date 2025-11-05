var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
let app;
let prisma;
let Logger;
let serverless;
async function initializeImports() {
    if (app && prisma && Logger && serverless) {
        return;
    }
    try {
        console.log('Initializing imports...');
        const serverModule = await Promise.resolve().then(() => __importStar(require('../dist/src/server')));
        app = serverModule.app;
        prisma = serverModule.prisma;
        console.log('Server module imported');
        const loggerModule = await Promise.resolve().then(() => __importStar(require('../dist/src/utils/logger')));
        Logger = loggerModule.Logger;
        console.log('Logger module imported');
        const serverlessModule = await Promise.resolve().then(() => __importStar(require('serverless-http')));
        serverless = serverlessModule.default;
        console.log('Serverless module imported');
    }
    catch (error) {
        console.error('Failed to import modules:', error);
        console.error('Import error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}
let isInitialized = false;
let initializationPromise = null;
async function ensureInitialized() {
    if (isInitialized) {
        return;
    }
    if (!initializationPromise) {
        initializationPromise = (async () => {
            try {
                console.log('Starting Vercel initialization...');
                await initializeImports();
                console.log('Imports initialized');
                if (!process.env.VERCEL) {
                    process.env.VERCEL = '1';
                }
                if (!process.env.DATABASE_URL) {
                    console.error('DATABASE_URL is not set');
                    throw new Error('DATABASE_URL environment variable is not set');
                }
                console.log('DATABASE_URL is set');
                try {
                    await Promise.race([
                        prisma.$connect(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 10000))
                    ]);
                    Logger.info('Connected to PostgreSQL database (Vercel)');
                }
                catch (dbError) {
                    console.error('Database connection error:', dbError);
                    throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
                }
                try {
                    const { ensureDirectories } = await Promise.resolve().then(() => __importStar(require('../dist/src/utils/fileUpload')));
                    ensureDirectories();
                    Logger.info('File directories initialized (Vercel)');
                }
                catch (dirError) {
                    console.warn('File directories initialization warning:', dirError);
                }
                try {
                    const { createApiRoutes } = await Promise.resolve().then(() => __importStar(require('../dist/src/routes')));
                    const apiRoutes = await createApiRoutes(prisma);
                    app.use('/api', apiRoutes);
                    Logger.info('Additional API routes initialized for Vercel');
                }
                catch (routesError) {
                    console.warn('Routes initialization warning:', routesError);
                }
                try {
                    const { notFoundHandler } = await Promise.resolve().then(() => __importStar(require('../dist/src/middleware/errorHandler')));
                    const { secureErrorHandler } = await Promise.resolve().then(() => __importStar(require('../dist/src/middleware/errorHandler.security')));
                    app.use(notFoundHandler);
                    app.use(secureErrorHandler);
                }
                catch (middlewareError) {
                    console.warn('Middleware initialization warning:', middlewareError);
                }
                isInitialized = true;
                Logger.info('Vercel initialization completed successfully');
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorStack = error instanceof Error ? error.stack : undefined;
                console.error('Failed to initialize for Vercel:', errorMessage, errorStack);
                try {
                    Logger.error('Failed to initialize for Vercel', error);
                }
                catch {
                }
                isInitialized = false;
                initializationPromise = null;
                throw error;
            }
        })();
    }
    return initializationPromise;
}
let serverlessHandler = null;
async function getHandler() {
    if (!serverlessHandler) {
        await initializeImports();
        await ensureInitialized();
        serverlessHandler = serverless(app, {
            binary: ['image/*', 'application/pdf', 'application/octet-stream'],
        });
    }
    return serverlessHandler;
}
async function handler(req, res) {
    try {
        console.log('Vercel handler called:', req.method, req.url);
        console.log('Getting serverless handler...');
        const handler = await getHandler();
        console.log('Serverless handler obtained');
        console.log('Calling serverless handler...');
        const result = await handler(req, res);
        console.log('Serverless handler completed');
        return result;
    }
    catch (error) {
        console.error('Error in Vercel handler:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('Error name:', error?.name);
        try {
            if (Logger) {
                Logger.error('Error in Vercel handler', error);
            }
        }
        catch {
        }
        const isDevelopment = process.env.NODE_ENV === 'development' ||
            process.env.VERCEL_ENV === 'development' ||
            process.env.VERCEL_ENV === 'preview';
        if (!res.headersSent) {
            try {
                res.status(500).json({
                    success: false,
                    message: 'Erreur interne du serveur',
                    error: isDevelopment
                        ? {
                            message: error?.message || String(error),
                            name: error?.name,
                            stack: error?.stack
                        }
                        : undefined
                });
            }
            catch (sendError) {
                console.error('Failed to send error response:', sendError);
            }
        }
    }
}
module.exports = handler;
