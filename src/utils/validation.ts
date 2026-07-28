// ============================================================
// INPUT VALIDATION
// ============================================================
// Validates raw request bodies before they reach the service layer.
// Returns structured errors so the client knows exactly what's wrong.
//
// WHY validate here AND have DB constraints?
// Defense in depth:
//   Layer 1 (here): fast feedback, readable error messages
//   Layer 2 (DB):   last line of defense, catches anything we miss
// ============================================================

export interface ValidationResult<T> {
  valid: boolean;
  errors: { field: string; message: string }[];
  data?: T;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  departmentId: number;
  salary: number;
  bonus?: number | null;
  hireDate?: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  departmentId?: number;
  salary?: number;
  bonus?: number | null;
  hireDate?: string;
}

export function validateCreateEmployee(body: any): ValidationResult<CreateEmployeeInput> {
  const errors: { field: string; message: string }[] = [];

  // Required string fields
  if (!body.firstName || typeof body.firstName !== "string" || !body.firstName.trim()) {
    errors.push({ field: "firstName", message: "Required, must be a non-empty string" });
  } else if (body.firstName.length > 50) {
    errors.push({ field: "firstName", message: "Must be 50 characters or fewer" });
  }

  if (!body.lastName || typeof body.lastName !== "string" || !body.lastName.trim()) {
    errors.push({ field: "lastName", message: "Required, must be a non-empty string" });
  } else if (body.lastName.length > 50) {
    errors.push({ field: "lastName", message: "Must be 50 characters or fewer" });
  }

  // Required numeric fields
  if (body.departmentId == null) {
    errors.push({ field: "departmentId", message: "Required" });
  } else if (!Number.isInteger(body.departmentId) || body.departmentId <= 0) {
    errors.push({ field: "departmentId", message: "Must be a positive integer" });
  }

  if (body.salary == null) {
    errors.push({ field: "salary", message: "Required" });
  } else if (typeof body.salary !== "number" || body.salary <= 0) {
    errors.push({ field: "salary", message: "Must be a positive number" });
  }

  // Optional fields
  if (body.bonus != null && (typeof body.bonus !== "number" || body.bonus < 0)) {
    errors.push({ field: "bonus", message: "Must be a non-negative number if provided" });
  }

  if (body.hireDate != null && isNaN(new Date(body.hireDate).getTime())) {
    errors.push({ field: "hireDate", message: "Must be a valid date (YYYY-MM-DD)" });
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    data: {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      departmentId: body.departmentId,
      salary: body.salary,
      bonus: body.bonus ?? null,
      hireDate: body.hireDate,
    },
  };
}

export function validateUpdateEmployee(body: any): ValidationResult<UpdateEmployeeInput> {
  const errors: { field: string; message: string }[] = [];
  const data: any = {};

  if (body.firstName !== undefined) {
    if (typeof body.firstName !== "string" || !body.firstName.trim()) {
      errors.push({ field: "firstName", message: "Must be a non-empty string" });
    } else {
      data.firstName = body.firstName.trim();
    }
  }

  if (body.lastName !== undefined) {
    if (typeof body.lastName !== "string" || !body.lastName.trim()) {
      errors.push({ field: "lastName", message: "Must be a non-empty string" });
    } else {
      data.lastName = body.lastName.trim();
    }
  }

  if (body.departmentId !== undefined) {
    if (!Number.isInteger(body.departmentId) || body.departmentId <= 0) {
      errors.push({ field: "departmentId", message: "Must be a positive integer" });
    } else {
      data.departmentId = body.departmentId;
    }
  }

  if (body.salary !== undefined) {
    if (typeof body.salary !== "number" || body.salary <= 0) {
      errors.push({ field: "salary", message: "Must be a positive number" });
    } else {
      data.salary = body.salary;
    }
  }

  // Bonus can be explicitly null (remove bonus) or a number
  if ("bonus" in body) {
    if (body.bonus !== null && (typeof body.bonus !== "number" || body.bonus < 0)) {
      errors.push({ field: "bonus", message: "Must be null or a non-negative number" });
    } else {
      data.bonus = body.bonus;
    }
  }

  if (body.hireDate !== undefined) {
    if (isNaN(new Date(body.hireDate).getTime())) {
      errors.push({ field: "hireDate", message: "Must be a valid date" });
    } else {
      data.hireDate = body.hireDate;
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  if (Object.keys(data).length === 0) {
    return {
      valid: false,
      errors: [{ field: "_body", message: "At least one field must be provided" }],
    };
  }

  return { valid: true, errors: [], data };
}

export function parseId(value: string | undefined): number | null {
  if (!value) return null;
  const id = parseInt(value, 10);
  return isNaN(id) || id <= 0 ? null : id;
}
