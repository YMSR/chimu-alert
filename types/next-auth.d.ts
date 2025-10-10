import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";
import type { AdapterUser } from "next-auth/adapters";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
    };
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: Role;
  }
}
