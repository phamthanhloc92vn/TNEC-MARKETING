import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserByEmail } from './db';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // Check if user email exists in database
        const dbUser = await getUserByEmail(user.email);
        if (!dbUser) {
          console.log(`[NextAuth] Access Denied: Email ${user.email} not found in database`);
          return false; // Deny login
        }
        return true;
      } catch (error) {
        console.error('[NextAuth] Error in signIn callback (getUserByEmail):', error);
        return false;
      }
    },
    async session({ session }) {
      // Attach role and user info from db
      if (session?.user?.email) {
        const dbUser = await getUserByEmail(session.user.email);
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.sheetName = dbUser.name;
          session.user.userId = dbUser.id;
          session.user.status = dbUser.status;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};
