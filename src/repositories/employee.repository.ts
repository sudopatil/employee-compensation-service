import { getPool } from "../config/database";

// ============================================================
// REPOSITORY LAYER
// ============================================================
// This layer has ONE job: talk to the database.
// - No HTTP logic (that's the controller's job)
// - No business logic (that's the service's job)
// - Only SQL queries with parameterized placeholders ($1, $2)
//
// WHY parameterized queries prevent SQL injection:
// When you write: query("SELECT * FROM Employee WHERE id = $1", [userId])
// The database treats $1 as DATA, never as SQL code.
// Even if userId = "1; DROP TABLE Employee", it's treated as a
// literal string, not executed. The query plan is compiled first,
// then parameters are bound — no string concatenation, no injection.
// ============================================================

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

// -------- CRUD --------

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

export async function updateEmployeeById(id: number, data: UpdateEmployeeData): Promise<EmployeeRow | null> {
  const pool = getPool();

  // Build SET clause dynamically — only update fields that were provided
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

// WHY dynamic SET?
// The client sends only the fields they want to change.
// If they send { bonus: 50000 }, we update ONLY bonus.
// If we updated all columns, we'd accidentally null out fields
// the client didn't even mention. This is PATCH semantics.

export async function deleteEmployeeById(id: number): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM Employee WHERE EmployeeID = $1 RETURNING EmployeeID`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
