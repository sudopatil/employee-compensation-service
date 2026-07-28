import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as employeeService from "../services/employee.service";
import { validateCreateEmployee, validateUpdateEmployee, parseId } from "../utils/validation";
import { withErrorHandling } from "../middleware/errorHandler";

// ============================================================
// CONTROLLER LAYER
// ============================================================
// This layer's ONLY job:
//   1. Parse the HTTP request (params, query, body)
//   2. Validate input
//   3. Call the service
//   4. Format the HTTP response (status code, JSON body)
//
// No SQL here. No business logic here.
// If you find yourself writing an if-statement about salary
// or bonus rules in this file — it belongs in the service.

// --- POST /api/employees ---
app.http("createEmployee", {
  methods: ["POST"],
  route: "employees",
  authLevel: "anonymous",
  handler: withErrorHandling(async (request: HttpRequest): Promise<HttpResponseInit> => {
    const body = await request.json();
    const validation = validateCreateEmployee(body);

    if (!validation.valid) {
      return {
        status: 400,
        jsonBody: { error: "VALIDATION_ERROR", details: validation.errors },
      };
    }

    const employee = await employeeService.createEmployee(validation.data!);

    return { status: 201, jsonBody: employee };
  }),
});

// --- GET /api/employees/{id} ---
app.http("getEmployeeById", {
  methods: ["GET"],
  route: "employees/{id}",
  authLevel: "anonymous",
  handler: withErrorHandling(async (request: HttpRequest): Promise<HttpResponseInit> => {
    const id = parseId(request.params.id);

    if (!id) {
      return {
        status: 400,
        jsonBody: { error: "INVALID_ID", message: "Employee ID must be a positive integer" },
      };
    }

    const employee = await employeeService.getEmployeeById(id);

    return { status: 200, jsonBody: employee };
  }),
});

// --- GET /api/employees?departmentId=2 ---
app.http("getEmployees", {
  methods: ["GET"],
  route: "employees",
  authLevel: "anonymous",
  handler: withErrorHandling(async (request: HttpRequest): Promise<HttpResponseInit> => {
    const deptParam = request.query.get("departmentId");
    let departmentId: number | undefined;

    if (deptParam) {
      departmentId = parseInt(deptParam, 10);
      if (isNaN(departmentId) || departmentId <= 0) {
        return {
          status: 400,
          jsonBody: { error: "INVALID_FILTER", message: "departmentId must be a positive integer" },
        };
      }
    }

    const employees = await employeeService.getAllEmployees(departmentId);

    return {
      status: 200,
      jsonBody: { count: employees.length, data: employees },
    };
  }),
});

// --- PUT/PATCH /api/employees/{id} ---
app.http("updateEmployee", {
  methods: ["PUT", "PATCH"],
  route: "employees/{id}",
  authLevel: "anonymous",
  handler: withErrorHandling(async (request: HttpRequest): Promise<HttpResponseInit> => {
    const id = parseId(request.params.id);

    if (!id) {
      return {
        status: 400,
        jsonBody: { error: "INVALID_ID", message: "Employee ID must be a positive integer" },
      };
    }

    const body = await request.json();
    const validation = validateUpdateEmployee(body);

    if (!validation.valid) {
      return {
        status: 400,
        jsonBody: { error: "VALIDATION_ERROR", details: validation.errors },
      };
    }

    const employee = await employeeService.updateEmployee(id, validation.data!);

    return { status: 200, jsonBody: employee };
  }),
});

// --- DELETE /api/employees/{id} ---
app.http("deleteEmployee", {
  methods: ["DELETE"],
  route: "employees/{id}",
  authLevel: "anonymous",
  handler: withErrorHandling(async (request: HttpRequest): Promise<HttpResponseInit> => {
    const id = parseId(request.params.id);

    if (!id) {
      return {
        status: 400,
        jsonBody: { error: "INVALID_ID", message: "Employee ID must be a positive integer" },
      };
    }

    await employeeService.deleteEmployee(id);

    return { status: 204 };
  }),
});
