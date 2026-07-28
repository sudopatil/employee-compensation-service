-- ============================================================
-- Seed Data — designed to exercise every reporting endpoint
-- ============================================================

-- Departments
INSERT INTO Department (DepartmentName, Location) VALUES
    ('Engineering',     'Pune'),
    ('Human Resources', 'Mumbai'),
    ('Sales',           'Bangalore'),
    ('Marketing',       NULL)
ON CONFLICT DO NOTHING;

-- Employees — carefully chosen to cover edge cases:
-- • Mix of NULL and non-NULL bonuses
-- • Rohan has highest salary but NOT highest bonus
-- • Marketing has only one employee with no bonus
INSERT INTO Employee (FirstName, LastName, DepartmentID, Salary, Bonus, HireDate) VALUES
    ('Amit',     'Sharma',     1, 1200000.00,  150000.00, '2020-03-15'),
    ('Priya',    'Patel',      1,  950000.00,  NULL,      '2021-07-01'),
    ('Rahul',    'Mehta',      2,  800000.00,   80000.00, '2019-11-20'),
    ('Sneha',    'Desai',      2,  750000.00,  NULL,      '2022-01-10'),
    ('Vikram',   'Singh',      3, 1100000.00,  200000.00, '2018-06-01'),
    ('Ananya',   'Kulkarni',   3,  900000.00,   50000.00, '2023-02-14'),
    ('Rohan',    'Joshi',      1, 1500000.00,  100000.00, '2017-09-30'),
    ('Meera',    'Nair',       4,  850000.00,  NULL,      '2021-05-15');
