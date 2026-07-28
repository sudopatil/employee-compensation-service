-- ============================================================
-- Migration 001: Create Department and Employee tables
-- ============================================================

CREATE TABLE IF NOT EXISTS Department (
    DepartmentID    SERIAL          PRIMARY KEY,
    DepartmentName  VARCHAR(100)    NOT NULL,
    Location        VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID      SERIAL          PRIMARY KEY,
    FirstName       VARCHAR(50)     NOT NULL,
    LastName        VARCHAR(50)     NOT NULL,
    DepartmentID    INT             NOT NULL,
    Salary          DECIMAL(12,2)   NOT NULL CHECK (Salary > 0),
    Bonus           DECIMAL(12,2)   DEFAULT NULL,
    HireDate        DATE            NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_department
        FOREIGN KEY (DepartmentID)
        REFERENCES Department(DepartmentID)
        ON DELETE RESTRICT
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_employee_department ON Employee(DepartmentID);
CREATE INDEX IF NOT EXISTS idx_employee_bonus ON Employee(Bonus);
