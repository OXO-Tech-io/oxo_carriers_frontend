import { describe, it, expect } from "vitest";
import { mapDbUserToAppUser, type DbUserResponse } from "@/lib/mappers/user.mapper";

const baseRaw: DbUserResponse = {
  id: 1,
  employeeId: "E1",
  email: "a@a.com",
  title: "Mr",
  firstName: "John",
  lastName: "Doe",
  role: "employee",
  department: "IT",
  position: "Dev",
  hireDate: "2026-01-01",
  managerId: 2,
  hourlyRate: "10.5",
  bankName: "Bank",
  accountHolderName: "John Doe",
  accountNumber: "123",
  bankBranch: "Main",
  bankBranchCode: "001",
  swiftCode: "SWIFT",
  companyName: "Acme",
  contactNumber: "0771234567",
  undergraduateDegreeCompletionDate: "2020-01-01",
  createdAt: "2025-01-01",
};

describe("mapDbUserToAppUser", () => {
  it("returns null for null/undefined input", () => {
    expect(mapDbUserToAppUser(null)).toBeNull();
    expect(mapDbUserToAppUser(undefined)).toBeNull();
  });

  it("maps camelCase backend fields to snake_case app fields", () => {
    const mapped = mapDbUserToAppUser(baseRaw);
    expect(mapped).toEqual({
      id: 1,
      employee_id: "E1",
      email: "a@a.com",
      title: "Mr",
      first_name: "John",
      last_name: "Doe",
      role: "employee",
      department: "IT",
      position: "Dev",
      hire_date: "2026-01-01",
      manager_id: 2,
      hourly_rate: 10.5,
      created_at: "2025-01-01",
      contact_number: "0771234567",
      bank_name: "Bank",
      account_holder_name: "John Doe",
      account_number: "123",
      bank_branch: "Main",
      bank_branch_code: "001",
      swift_code: "SWIFT",
      company_name: "Acme",
      undergraduate_degree_completion_date: "2020-01-01",
    });
  });

  it("fills in defaults for missing optional fields", () => {
    const mapped = mapDbUserToAppUser({
      id: 2,
      email: "b@b.com",
      firstName: "Jane",
      lastName: "Roe",
      role: "hr",
    });
    expect(mapped).toMatchObject({
      id: 2,
      employee_id: "",
      title: null,
      department: "",
      position: "",
      hire_date: "",
      manager_id: undefined,
      hourly_rate: null,
      created_at: "",
      contact_number: null,
      bank_name: null,
    });
  });

  it("coerces a numeric hourlyRate", () => {
    const mapped = mapDbUserToAppUser({ ...baseRaw, hourlyRate: 12.34 });
    expect(mapped?.hourly_rate).toBe(12.34);
  });

  it("keeps hourly_rate null when explicitly null", () => {
    const mapped = mapDbUserToAppUser({ ...baseRaw, hourlyRate: null });
    expect(mapped?.hourly_rate).toBeNull();
  });
});
