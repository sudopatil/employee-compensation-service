import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import * as reportService from "../services/report.service";
import { withErrorHandling } from "../middleware/errorHandler";

// ============================================================
// REPORT CONTROLLER — Part B + Part C endpoints
// All GET-only (pure reads, no mutations)
// ============================================================

// B1: GET /api/reports/total-bonus
app.http("getTotalBonus", {
  methods: ["GET"],
  route: "reports/total-bonus",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const result = await reportService.getTotalBonus();
    return { status: 200, jsonBody: result };
  }),
});

// B2: GET /api/reports/no-bonus
app.http("getEmployeesNoBonus", {
  methods: ["GET"],
  route: "reports/no-bonus",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const employees = await reportService.getEmployeesWithoutBonus();
    return {
      status: 200,
      jsonBody: { count: employees.length, data: employees },
    };
  }),
});

// B3: GET /api/reports/bonus-percentages
app.http("getBonusPercentages", {
  methods: ["GET"],
  route: "reports/bonus-percentages",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const employees = await reportService.getBonusPercentages();
    return {
      status: 200,
      jsonBody: { count: employees.length, data: employees },
    };
  }),
});

// B4: GET /api/reports/departments-high-bonus
app.http("getDepartmentsHighBonus", {
  methods: ["GET"],
  route: "reports/departments-high-bonus",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const departments = await reportService.getDepartmentsHighBonus();
    return {
      status: 200,
      jsonBody: {
        count: departments.length,
        data: departments,
        description: "Departments where total bonus paid exceeds the department's average salary",
      },
    };
  }),
});

// B5: GET /api/reports/bonus-ranking
app.http("getBonusRanking", {
  methods: ["GET"],
  route: "reports/bonus-ranking",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const employees = await reportService.getEmployeesRankedByBonus();
    return {
      status: 200,
      jsonBody: { count: employees.length, data: employees },
    };
  }),
});

// B6: GET /api/reports/highest-compensation
app.http("getHighestCompensation", {
  methods: ["GET"],
  route: "reports/highest-compensation",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const result = await reportService.getHighestCompensation();
    return { status: 200, jsonBody: result };
  }),
});

// Part C: GET /api/reports/effective-bonus
app.http("getEffectiveBonus", {
  methods: ["GET"],
  route: "reports/effective-bonus",
  authLevel: "anonymous",
  handler: withErrorHandling(async (): Promise<HttpResponseInit> => {
    const result = await reportService.getEffectiveBonus();
    return {
      status: 200,
      jsonBody: {
        ...result,
        note: `Employees without a bonus receive a default of ${result.defaultBonusPercentage}% of salary. ` +
              `Computed at read-time to preserve original data integrity.`,
      },
    };
  }),
});
