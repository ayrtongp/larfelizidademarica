import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

const backendURL = '/api/Controller/LoginController';
export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {
        username: {
          label: "Usuário",
          type: "text",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const credentialDetails = {
          username: credentials.username,
          password: credentials.password,
        };

        const resp = await fetch(backendURL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentialDetails),
        });
        const user = await resp.json();
        if (user.is_success) {

          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.username = user.data.auth.username;
        token.username = user.data.auth.userName;
        token.user_type = user.data.auth.userType;
        token.accessToken = user.data.auth.token;
      }

      return token;
    },
    session: ({ session, token, user }) => {
      if (token) {
        session.user.username = token.username;
        session.user.username = token.userName;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);