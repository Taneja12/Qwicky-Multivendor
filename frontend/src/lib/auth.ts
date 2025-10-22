import { NextAuthOptions } from 'next-auth';
import type { DefaultSession } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/lib/api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const { user, access, refresh } = await authApi.login({
            email: credentials.email,
            password: credentials.password,
          });

          if (user) {
            // Return user plus tokens to be stored in the JWT callback
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
              role: user.role,
              access,
              refresh,
              ...user,
            };
          }
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  },
  callbacks: {
    // Use any for callback params to match next-auth's expected signatures
    async jwt(params: any) {
      const { token, user } = params;
      if (user) {
        if (user.role) token.role = user.role;
        if (user.id) token.id = user.id;
        if ((user as any).access) token.access = (user as any).access;
        if ((user as any).refresh) token.refresh = (user as any).refresh;
      }
      return token;
    },
    async session(params: any) {
      const { session, token } = params;
      if (token) {
        if (session.user) {
          if (token.role) (session.user as any).role = token.role;
          if (token.id) (session.user as any).id = token.id;
        }
        if (token.access) (session as any).access = token.access;
        if (token.refresh) (session as any).refresh = token.refresh;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
};