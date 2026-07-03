// User model + dummy data for the admin user-management screen.
// Based on the `users` table schema. Sensitive columns (password_hash,
// password_reset_token, etc.) are intentionally NOT exposed in the admin UI.

export type AccountType = "EMAIL" | "GOOGLE" | "PHONE";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  isPremium: boolean;
  avatarUrl: string;
  createdAt: string;
};

export const ACCOUNT_TYPES: AccountType[] = ["EMAIL", "GOOGLE", "PHONE"];

export const initialUsers: User[] = [
  {
    id: "u_1001",
    name: "Aarav Sharma",
    email: "aarav@ramayana.com",
    phone: "+91 98765 43210",
    accountType: "EMAIL",
    isPremium: true,
    avatarUrl: "",
    createdAt: "2026-01-12",
  },
  {
    id: "u_1002",
    name: "Priya Nair",
    email: "priya@gmail.com",
    phone: "+91 90123 45678",
    accountType: "GOOGLE",
    isPremium: true,
    avatarUrl: "",
    createdAt: "2026-02-03",
  },
  {
    id: "u_1003",
    name: "Rohan Verma",
    email: "rohan@gmail.com",
    phone: "+91 99887 76655",
    accountType: "PHONE",
    isPremium: false,
    avatarUrl: "",
    createdAt: "2026-03-21",
  },
  {
    id: "u_1004",
    name: "Meera Iyer",
    email: "meera@outlook.com",
    phone: "+91 91234 56789",
    accountType: "EMAIL",
    isPremium: false,
    avatarUrl: "",
    createdAt: "2026-04-08",
  },
];
