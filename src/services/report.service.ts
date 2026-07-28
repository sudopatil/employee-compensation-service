import * as reportRepo from "../repositories/report.repository";
import { config } from "../config/env";

// ============================================================
// REPORT SERVICE — Business logic for Part B
// ============================================================
// Transforms raw DB rows into structured response objects.
// This is where we shape the data, add computed fields, 
// and format numbers — keeping the controller thin.
// ============================================================

export async function getTotalBonus() {
  const row = await reportRepo.findTotalBonus();
  return {
    totalBonusPaid: parseFloat(row.total_bonus),
    totalEmployees: parseInt(row.total_employees),
    employeesWithBonus: parseInt(row.employees_with_bonus),
  };
}

export async function getEmployeesWithoutBonus() {
  return reportRepo.findEmployeesWithoutBonus();
}

export async function getBonusPercentages() {
  return reportRepo.findBonusPercentages();
}

export async function getDepartmentsHighBonus() {
  return reportRepo.findDepartmentsWhereBonusExceedsAvgSalary();
}

export async function getEmployeesRankedByBonus() {
  return reportRepo.findEmployeesRankedByBonus();
}

export async function getHighestCompensation() {
  const [highestSalary, highestTotalComp] = await Promise.all([
    reportRepo.findHighestSalaryEmployee(),
    reportRepo.findHighestTotalCompEmployee(),
  ]);

  // WHY Promise.all?
  // Fires both queries simultaneously instead of sequentially.
  // Two 50ms queries → 50ms total instead of 100ms.
  // Safe because these are independent read-only queries.

  const sameEmployee =
    highestSalary && highestTotalComp
      ? highestSalary.employeeid === highestTotalComp.employeeid
      : null;

  return {
    highestSalary,
    highestTotalCompensation: highestTotalComp,
    isSameEmployee: sameEmployee,
  };
}

export async function getEffectiveBonus() {
  const employees = await reportRepo.findEmployeesWithEffectiveBonus(
    config.defaultBonusPercentage
  );

  return {
    defaultBonusPercentage: config.defaultBonusPercentage,
    employees,
  };
}
