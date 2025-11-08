import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { schema } from "@/db/schema";
import { Resend } from "resend";
import ForgotPasswordEmail from "@/components/emails/reset-password";
import VerifyEmail from "@/components/emails/verify-email";
import { getActiveOrganization } from "@/server/organizations";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export const auth = betterAuth({
    emailVerification: {
      sendVerificationEmail: async ({user, url}) => {
        resend.emails.send({
          from: "no-reply@wouz.jp",
          to: user.email,
          subject: "Verify your email",
          react: VerifyEmail({ username: user.name, verifyUrl: url })
        })
      },
      sendOnSignUp: true
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      }
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({user, url}) => {
        resend.emails.send({
          from: "no-reply@wouz.jp",
          to: user.email,
          subject: "Reset your password",
          react: ForgotPasswordEmail({ username: user.name, resetUrl: url, userEmail: user.email })
        })
      },
      requireEmailVerification: true,
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const organization = await getActiveOrganization(session.userId)
            return {
              data: {
                ...session,
                activeOrganizationId: organization?.id
              }
            }
          }
        }
      }
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    plugins: [
      organization(),
      nextCookies()
    ]
});