import * as employeeRepo from "../repositories/employee.repository";

// ============================================================
// SERVICE LAYER
// ============================================================
// Sits between Controller and Repository.
// Controller handles HTTP → Service handles BUSINESS LOGIC → Repository handles SQL
//
// "But there's barely any business logic here?"
// True for now. In a real app, this layer would:
//   • Validate that department exists before creating employee
//   • Enforce salary ranges per department
//   • Send notification emails on bonus changes
//   • Log audit trails
//   • Apply authorization rules
//
// The value is in separation: when business rules grow (and they
// always do), they go here — not scattered across controllers
// or crammed into SQL queries.
// ============================================================

export async function createEmployee(data: employeeRepo.CreateEmployeeData) {
  // Business rule: bonus (if provided) should not exceed salary
  if (data.bonus !== undefined && data.bonus !== null && data.bonus > data.salary) {
    throw new ServiceError(
      "Bonus cannot exceed base salary",
      "VALIDATION_ERROR"
    );
  }

  return employeeRepo.insertEmployee(data);
}

export async function getEmployeeById(id: number) {
  const employee = await employeeRepo.findEmployeeById(id);

  if (!employee) {
    throw new ServiceError(
      `Employee with ID ${id} not found`,
      "NOT_FOUND"
    );
  }

  return employee;
}

export async function getAllEmployees(departmentId?: number) {
  return employeeRepo.findAllEmployees(departmentId);
}

export async function updateEmployee(id: number, data: employeeRepo.UpdateEmployeeData) {
  const existingEmployee = await employeeRepo.findEmployeeById(id);

  if (!existingEmployee) {
    throw new ServiceError(
      `Employee with ID ${id} not found`,
      "NOT_FOUND"
    );
  }

  // Business rule: validate the final state after a partial update.
  // A request may update only bonus or only salary, so compare against
  // the existing value when the matching field is not provided.
  const finalSalary =
    data.salary !== undefined ? data.salary : parseFloat(existingEmployee.salary);
  const finalBonus =
    data.bonus !== undefined
      ? data.bonus
      : existingEmployee.bonus === null
        ? null
        : parseFloat(existingEmployee.bonus);

  if (finalBonus !== null && finalBonus > finalSalary) {
    throw new ServiceError(
      "Bonus cannot exceed base salary",
      "VALIDATION_ERROR"
    );
  }

  const employee = await employeeRepo.updateEmployeeById(id, data);

  if (!employee) {
    throw new ServiceError(
      `Employee with ID ${id} not found`,
      "NOT_FOUND"
    );
  }

  return employee;
}

export async function deleteEmployee(id: number) {
  const deleted = await employeeRepo.deleteEmployeeById(id);

  if (!deleted) {
    throw new ServiceError(
      `Employee with ID ${id} not found`,
      "NOT_FOUND"
    );
  }

  return true;
}

// ============================================================
// Custom error class for service-level errors
// ============================================================
// WHY a custom error instead of just throwing strings?
//   • The 'code' field lets the controller map to HTTP status codes
//   • It's a typed, structured error — not a mystery string
//   • instanceof check reliably identifies service errors vs
//     unexpected crashes (DB down, etc.)
// ============================================================

export class ServiceError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}
