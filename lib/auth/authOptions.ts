import { SignJWT } from "jose";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial login
      if (account && profile) {
        token.email = profile.email;
        token.name = profile.name;
      }

      // Mint API token (short)
      const apiJwtSecret = process.env.BACKEND_JWT_SECRET;
      if (!apiJwtSecret) throw new Error("Missing BACKEND_JWT_SECRET");

      const key = new TextEncoder().encode(apiJwtSecret);

      if (!token.apiToken) {
        token.apiToken = await new SignJWT({ email: token.email as string })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setIssuedAt()
          .setExpirationTime("30m")
          .setIssuer("textbooked-web")
          .setAudience("textbooked-api")
          .sign(key);
      }

      return token;
    },

    session({ session, token }) {
      session.apiToken = token.apiToken;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
