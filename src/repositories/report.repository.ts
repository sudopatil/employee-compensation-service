import { getPool } from "../config/database";

// Repository layer: raw parameterized SQL for compensation reports.

// B1: Total bonus paid across the company, treating NULL as zero.
export async function findTotalBonus() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT 
      COALESCE(SUM(COALESCE(Bonus, 0)), 0)  AS total_bonus,
      COUNT(*)                                AS total_employees,
      COUNT(Bonus)                            AS employees_with_bonus
    FROM Employee
  `);
  return result.rows[0];
}

// B2: Employees who have never received a bonus.
export async function findEmployeesWithoutBonus() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT e.*, d.DepartmentName
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
    WHERE e.Bonus IS NULL
    ORDER BY e.LastName, e.FirstName
  `);
  return result.rows;
}

// B3: Bonus percentage for employees with an awarded bonus.
export async function findBonusPercentages() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT 
      e.EmployeeID, e.FirstName, e.LastName,
      e.Salary, e.Bonus,
      ROUND((e.Bonus / e.Salary) * 100, 2) AS bonus_percentage
    FROM Employee e
    WHERE e.Bonus IS NOT NULL
    ORDER BY bonus_percentage DESC
  `);
  return result.rows;
}

// B4: Departments whose total bonus exceeds their average salary.
export async function findDepartmentsWhereBonusExceedsAvgSalary() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT 
      d.DepartmentID, 
      d.DepartmentName,
      COALESCE(SUM(e.Bonus), 0) AS total_bonus,
      ROUND(AVG(e.Salary), 2)   AS avg_salary
    FROM Department d
    JOIN Employee e ON d.DepartmentID = e.DepartmentID
    GROUP BY d.DepartmentID, d.DepartmentName
    HAVING COALESCE(SUM(e.Bonus), 0) > AVG(e.Salary)
  `);
  return result.rows;
}

// B5: Employees ranked by bonus with no-bonus employees last.
export async function findEmployeesRankedByBonus() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT 
      e.EmployeeID, e.FirstName, e.LastName,
      e.Salary, e.Bonus, d.DepartmentName,
      RANK() OVER (
        ORDER BY 
          CASE WHEN e.Bonus IS NULL THEN 1 ELSE 0 END,
          e.Bonus DESC
      ) AS bonus_rank
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
    ORDER BY bonus_rank
  `);
  return result.rows;
}

// B6: Employee with the highest base salary.
export async function findHighestSalaryEmployee() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT e.EmployeeID, e.FirstName, e.LastName,
           e.Salary, e.Bonus, d.DepartmentName,
           (e.Salary + COALESCE(e.Bonus, 0)) AS total_compensation
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
    ORDER BY e.Salary DESC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

// B6: Employee with the highest salary plus bonus.
export async function findHighestTotalCompEmployee() {
  const pool = getPool();
  const result = await pool.query(`
    SELECT e.EmployeeID, e.FirstName, e.LastName,
           e.Salary, e.Bonus, d.DepartmentName,
           (e.Salary + COALESCE(e.Bonus, 0)) AS total_compensation
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
    ORDER BY (e.Salary + COALESCE(e.Bonus, 0)) DESC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

// Part C: Effective bonus with the default applied at read time.
export async function findEmployeesWithEffectiveBonus(defaultPercent: number) {
  const pool = getPool();
  const result = await pool.query(`
    SELECT 
      e.EmployeeID, e.FirstName, e.LastName,
      e.Salary, e.Bonus,
      COALESCE(e.Bonus, ROUND(e.Salary * $1 / 100, 2)) AS effective_bonus,
      CASE WHEN e.Bonus IS NULL THEN true ELSE false END AS is_default_bonus,
      d.DepartmentName
    FROM Employee e
    JOIN Department d ON e.DepartmentID = d.DepartmentID
    ORDER BY e.EmployeeID
  `, [defaultPercent]);
  return result.rows;
}
