import { getPool } from "../config/database";

// ============================================================
// REPORT REPOSITORY — Part B queries
// ============================================================
// Each function maps to one reporting requirement.
// All NULL bonus handling is done in SQL using COALESCE / IS NULL.
// ============================================================

// B1: Total bonus paid across the company (NULL → 0)
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

// WHY nested COALESCE?
// Inner: COALESCE(Bonus, 0) → each NULL bonus becomes 0 for summing
// Outer: COALESCE(SUM(...), 0) → if table is empty, SUM returns NULL → we want 0

// B2: Employees who have never received a bonus
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

// WHY "IS NULL" not "= NULL"?
// NULL = NULL → evaluates to NULL (not true!)
// NULL is not a value — it's the ABSENCE of a value.
// You must use IS NULL / IS NOT NULL for NULL comparisons.

// B3: Bonus as percentage of salary (only for employees WITH bonus)
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

// B4: Departments where total bonus > department average salary
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

// WHY HAVING and not WHERE?
// WHERE filters rows BEFORE aggregation (GROUP BY).
// HAVING filters groups AFTER aggregation.
// We need SUM and AVG computed first, then compare them.
//
// Interview trick question: "Can you use WHERE instead of HAVING?"
// No — because SUM(Bonus) doesn't exist at the row level.
// WHERE sees individual rows; HAVING sees aggregated groups.

// B5: All employees ranked by bonus (no-bonus employees ranked last)
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

// WHY the CASE inside RANK()?
// Creates a two-tier sort:
//   Tier 0 (CASE = 0): employees WITH bonus → sorted DESC by amount
//   Tier 1 (CASE = 1): employees WITHOUT bonus → all ranked last
//
// WHY RANK() not ROW_NUMBER()?
// RANK() gives equal rank to ties (same bonus = same rank).
// ROW_NUMBER() arbitrarily breaks ties (unfair for comp reports).
// DENSE_RANK() would also work — difference is gap handling:
//   RANK:       1, 2, 2, 4 (skips 3)
//   DENSE_RANK: 1, 2, 2, 3 (no gap)

// B6: Highest salary + whether same person has highest total comp
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

// Part C Optional: All employees with default 5% bonus applied at read-time
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
