import { Context, NextFunction } from 'grammy';
export declare function userSetupMiddleware(ctx: Context, next: NextFunction): Promise<void>;
export declare function rateLimitMiddleware(ctx: Context, next: NextFunction): Promise<void>;
export declare function banCheckMiddleware(ctx: Context, next: NextFunction): Promise<void>;
export declare function errorHandlerMiddleware(ctx: Context, error: unknown): Promise<void>;
export declare function logMiddleware(ctx: Context, next: NextFunction): Promise<void>;
//# sourceMappingURL=index.d.ts.map