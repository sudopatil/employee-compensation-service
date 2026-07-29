import { getPool } from "../config/database";

// Repository layer: raw parameterized SQL for Employee CRUD operations.

export interface EmployeeRow {
  employeeid: number;
  firstname: string;
  lastname: string;
  departmentid: number;
  salary: string;        // DECIMAL comes back as string from pg driver
  bonus: string | null;
  hiredate: Date;
  departmentname?: string;
  location?: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  departmentId: number;
  salary: number;
  bonus?: number | null;
  hireDate?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  departmentId?: number;
  salary?: number;
  bonus?: number | null;
  hireDate?: string;
}

// Inserts a new employee and returns the generated row.
export async function insertEmployee(data: CreateEmployeeData): Promise<EmployeeRow> {
  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO Employee (FirstName, LastName, DepartmentID, Salary, Bonus, HireDate)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
     RETURNING *`,
    [data.firstName, data.lastName, data.departmentId, data.salary, data.bonus ?? null, data.hireDate ?? null]
  );
  return result.rows[0];
}

// Fetches one employee with department details.
export async function findEmployeeById(id: number): Promise<EmployeeRow | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT e.*, d.DepartmentName, d.Location
     FROM Employee e
     JOIN Department d ON e.DepartmentID = d.DepartmentID
     WHERE e.EmployeeID = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// Lists employees, optionally filtered by department.
export async function findAllEmployees(departmentId?: number): Promise<EmployeeRow[]> {
  const pool = getPool();

  let query = `
    SELECT e.*, d.DepartmentName, d.Location
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
  `;
  const params: any[] = [];

  if (departmentId) {
    query += ` WHERE e.DepartmentID = $1`;
    params.push(departmentId);
  }

  query += ` ORDER BY e.EmployeeID`;

  const result = await pool.query(query, params);
  return result.rows;
}

// Updates only the fields provided in the request.
export async function updateEmployeeById(id: number, data: UpdateEmployeeData): Promise<EmployeeRow | null> {
  const pool = getPool();

  // Build SET dynamically so omitted fields are left unchanged.
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    firstName: "FirstName",
    lastName: "LastName",
    departmentId: "DepartmentID",
    salary: "Salary",
    bonus: "Bonus",
    hireDate: "HireDate",
  };

  for (const [jsKey, dbColumn] of Object.entries(fieldMap)) {
    if (jsKey in data) {
      setClauses.push(`${dbColumn} = $${paramIndex}`);
      values.push((data as any)[jsKey]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE Employee SET ${setClauses.join(", ")} WHERE EmployeeID = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

// Deletes one employee by ID.
export async function deleteEmployeeById(id: number): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM Employee WHERE EmployeeID = $1 RETURNING EmployeeID`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
