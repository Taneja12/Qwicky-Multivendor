import { NextAuthOptions, User, DefaultSession } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { authApi } from "@/lib/api";

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
    access?: string;
    refresh?: string;
    error?: string;
  }

  interface User {
    id: string;
    role?: string;
    access?: string;
    refresh?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    access?: string;
    refresh?: string;
    expiresAt?: number;
    error?: string;
  }
}

async function refreshAccessToken(token: any) {
  try {
    console.log('Refreshing access token...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: token.refresh,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return {
      ...token,
      access: refreshedTokens.access,
      refresh: refreshedTokens.refresh || token.refresh, // Fall back to old refresh token if new one isn't provided
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour from now
      error: undefined, // Clear any previous errors
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

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
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.first_name ? `${user.first_name} ${user.last_name}` : user.email,
              role: user.role,
              access,
              refresh,
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        console.log('Initial JWT creation for user:', user.email);
        return {
          ...token,
          id: user.id,
          role: user.role,
          access: user.access,
          refresh: user.refresh,
          expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour from now
        };
      }

      // Check if token needs refresh (5 minutes before expiry)
      if (token.expiresAt && Date.now() < token.expiresAt - 5 * 60 * 1000) {
        console.log('Token still valid, returning existing token');
        return token;
      }

      // Token is expired or about to expire, try to refresh
      console.log('Token needs refresh, attempting refresh...');
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      session.access = token.access;
      session.refresh = token.refresh;
      session.error = token.error;
      
      console.log('Session callback - error:', token.error);
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};