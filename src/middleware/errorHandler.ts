import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ServiceError } from "../services/employee.service";
import { config } from "../config/env";

// ============================================================
// Centralized error handler — wraps every controller function.
// Maps different error types to appropriate HTTP status codes.
//
// In Express you'd do: app.use((err, req, res, next) => {...})
// In Azure Functions, there's no global middleware chain, so
// we use a higher-order function (wrapper) instead.
// Same concept, different syntax.
// ============================================================

type HandlerFn = (
  request: HttpRequest,
  context: InvocationContext
) => Promise<HttpResponseInit>;

// Maps our ServiceError codes to HTTP status codes
const ERROR_CODE_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export function withErrorHandling(handler: HandlerFn): HandlerFn {
  return async (request, context) => {
    try {
      return await handler(request, context);

    } catch (error: any) {
      context.error(`[${request.method}] ${request.url} — ${error.message}`);

      // Service-level errors (our custom errors with known codes)
      if (error instanceof ServiceError) {
        return {
          status: ERROR_CODE_MAP[error.code] || 400,
          jsonBody: {
            error: error.code,
            message: error.message,
          },
        };
      }

      // PostgreSQL constraint errors
      if (error.code === "23503") {  // Foreign key violation
        return {
          status: 400,
          jsonBody: {
            error: "INVALID_REFERENCE",
            message: "Referenced department does not exist",
          },
        };
      }

      if (error.code === "23505") {  // Unique constraint
        return {
          status: 409,
          jsonBody: {
            error: "CONFLICT",
            message: "A record with this identifier already exists",
          },
        };
      }

      if (error.code === "23514") {  // Check constraint
        return {
          status: 400,
          jsonBody: {
            error: "CONSTRAINT_VIOLATION",
            message: "Data violates a database constraint",
          },
        };
      }

      // Connection errors
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        return {
          status: 503,
          jsonBody: {
            error: "SERVICE_UNAVAILABLE",
            message: "Database connection failed",
          },
        };
      }

      // Unexpected errors — hide details in production
      return {
        status: 500,
        jsonBody: {
          error: "INTERNAL_ERROR",
          message: config.isDev
            ? error.message
            : "An unexpected error occurred",
        },
      };
    }
  };
}
