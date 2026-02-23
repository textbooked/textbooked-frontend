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
      if (account && profile && typeof profile === "object") {
        const oauthProfile = profile as Record<string, unknown>;

        token.sub = resolveNonEmptyString(token.sub) ?? readString(oauthProfile, ["sub", "id"]);
        token.email = resolveNonEmptyString(token.email) ?? readString(oauthProfile, ["email"]);
        token.name = resolveNonEmptyString(token.name) ?? readString(oauthProfile, ["name"]);
        token.picture = resolveNonEmptyString(token.picture) ?? readString(oauthProfile, ["picture", "image"]);
        token.givenName = readString(oauthProfile, ["given_name", "givenName"]);
        token.familyName = readString(oauthProfile, ["family_name", "familyName"]);
        token.locale = readString(oauthProfile, ["locale"]);

        const emailVerified = readBoolean(oauthProfile, ["email_verified", "emailVerified"]);
        if (typeof emailVerified === "boolean") {
          token.emailVerified = emailVerified;
        }
      }

      const subject = resolveNonEmptyString(token.sub);
      const email = resolveNonEmptyString(token.email)?.toLowerCase();
      if (!subject || !email) {
        throw new Error("Google profile is missing required claims (sub/email).");
      }

      const apiJwtSecret =
        process.env.BACKEND_JWT_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
      if (!apiJwtSecret) {
        throw new Error("Missing JWT secret. Set BACKEND_JWT_SECRET or AUTH_SECRET.");
      }

      const key = new TextEncoder().encode(apiJwtSecret);
      const now = Math.floor(Date.now() / 1000);
      const shouldMintApiToken =
        typeof token.apiToken !== "string" ||
        typeof token.apiTokenExp !== "number" ||
        token.apiTokenExp - now <= 60;

      if (shouldMintApiToken) {
        const expiresAt = now + 30 * 60;
        token.apiToken = await new SignJWT({
          sub: subject,
          email,
          name: resolveNonEmptyString(token.name) ?? undefined,
          picture: resolveNonEmptyString(token.picture) ?? undefined,
          given_name: resolveNonEmptyString(token.givenName) ?? undefined,
          family_name: resolveNonEmptyString(token.familyName) ?? undefined,
          locale: resolveNonEmptyString(token.locale) ?? undefined,
          email_verified: typeof token.emailVerified === "boolean" ? token.emailVerified : undefined,
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setIssuedAt(now)
          .setExpirationTime(expiresAt)
          .setIssuer("textbooked-web")
          .setAudience("textbooked-api")
          .sign(key);
        token.apiTokenExp = expiresAt;
      }

      return token;
    },

    session({ session, token }) {
      session.apiToken = typeof token.apiToken === "string" ? token.apiToken : undefined;
      if (session.user) {
        session.user.name = resolveNonEmptyString(token.name) ?? session.user.name;
        session.user.email = resolveNonEmptyString(token.email) ?? session.user.email;
        session.user.image = resolveNonEmptyString(token.picture) ?? session.user.image;
      }
      return session;
    },
  },

  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};

function resolveNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = resolveNonEmptyString(source[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized === "true") {
        return true;
      }
      if (normalized === "false") {
        return false;
      }
    }
  }

  return undefined;
}
