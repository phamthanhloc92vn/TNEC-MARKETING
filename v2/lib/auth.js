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
        // Check if user email exists in Google Sheet Users tab
        const sheetUser = await getUserByEmail(user.email);
        if (!sheetUser) {
          console.log(`[NextAuth] Access Denied: Email ${user.email} not found in Google Sheets`);
          return false; // Deny login
        }
        return true;
      } catch (error) {
        console.error('[NextAuth] Error in signIn callback (getUserByEmail):', error);
        return false;
      }
    },
    async session({ session }) {
      // Attach role and user info from Sheet
      if (session?.user?.email) {
        const sheetUser = await getUserByEmail(session.user.email);
        if (sheetUser) {
          session.user.role = sheetUser.role;
          session.user.sheetName = sheetUser.name;
          session.user.userId = sheetUser.id;
          session.user.status = sheetUser.status;
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
