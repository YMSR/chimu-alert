import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const {
  auth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/app/login",
  },
  providers: [
    Credentials({
      id: "email-password",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const result = credentialsSchema.safeParse(credentials);
        if (!result.success) {
          return null;
        }

        const email = result.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordValid = await compare(
          result.data.password,
          user.passwordHash,
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } satisfies {
          id: string;
          email: string;
          name: string | null;
          role: Role;
        };
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? Role.USER;
      }

      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: Role }).role ?? Role.USER;
      }

      return token;
    },
  },
});
