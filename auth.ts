import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { SignJWT } from "jose";

const authSecret = getRequiredEnv(
  "AUTH_SECRET",
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
);
const googleClientId = getRequiredEnv(
  "GOOGLE_CLIENT_ID",
  process.env.GOOGLE_CLIENT_ID,
);
const googleClientSecret = getRequiredEnv(
  "GOOGLE_CLIENT_SECRET",
  process.env.GOOGLE_CLIENT_SECRET,
);
const backendJwtSecret = process.env.BACKEND_JWT_SECRET ?? authSecret;

const backendSigningKey = new TextEncoder().encode(backendJwtSecret);

export const { handlers, auth } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = token.sub ?? user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }

      const sub = typeof token.sub === "string" ? token.sub : "";
      const email = typeof token.email === "string" ? token.email : "";
      const name = typeof token.name === "string" ? token.name : null;
      const picture = typeof token.picture === "string" ? token.picture : null;

      if (sub && email) {
        token.backendToken = await signBackendToken({
          sub,
          email,
          name,
          picture,
        });
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        name: typeof token.name === "string" ? token.name : session.user?.name,
        email:
          typeof token.email === "string" ? token.email : session.user?.email,
        image:
          typeof token.picture === "string"
            ? token.picture
            : session.user?.image,
      };

      session.backendToken =
        typeof token.backendToken === "string" ? token.backendToken : undefined;

      return session;
    },
  },
});

async function signBackendToken(payload: {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(backendSigningKey);
}

function getRequiredEnv(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
