import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';

// Initialiser Resend avec la clé API seulement si elle existe
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Extend the next-auth types to include our custom properties
declare module "next-auth" {
  interface User {
    role?: string;
    permissions?: string[];
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      permissions?: string[];
    }
  }
}

// Type pour JWT
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions?: string[];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'no-reply@evenzi.io',
      
      // Personnaliser l'envoi d'emails avec Resend
      async sendVerificationRequest({ identifier: email, url }) {
        try {
          // Vérifier si Resend est disponible
          if (!resend) {
            console.warn('Resend API key not configured, skipping email verification');
            throw new Error('Service d\'email non configuré');
          }

          const { data, error } = await resend.emails.send({
            from: 'Evenzi <no-reply@evenzi.io>',
            to: email,
            subject: 'Connexion à votre compte Evenzi',
            html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Arial', sans-serif;">
                <div style="background-color: #81B441; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
                  <h1 style="color: white; margin: 0;">Evenzi</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e0e0e0; border-top: none;">
                  <p style="font-size: 16px; line-height: 1.5;">Bonjour,</p>
                  <p style="font-size: 16px; line-height: 1.5;">Cliquez sur le lien ci-dessous pour vous connecter à votre compte Evenzi :</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background-color: #81B441; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Se connecter</a>
                  </div>
                  <p style="font-size: 16px; line-height: 1.5;">Si vous n'avez pas demandé cette connexion, vous pouvez ignorer cet email.</p>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">Ce lien est valable pendant 10 minutes et ne peut être utilisé qu'une seule fois.</p>
                </div>
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                  <p>&copy; 2024 Evenzi. Tous droits réservés.</p>
                </div>
              </div>
            `,
          });

          if (error) {
            console.error('Erreur lors de l\'envoi du mail de vérification:', error);
            throw new Error('Erreur lors de l\'envoi du mail de vérification');
          }

          console.log('Email de vérification envoyé:', data);
        } catch (error) {
          console.error('Erreur avec Resend:', error);
          throw new Error('Erreur lors de l\'envoi du mail de vérification');
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        autoLogin: { label: "Auto Login", type: "text" },
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        try {
          // Cas d'auto-login après OTP
          if (credentials.autoLogin === 'true' && credentials.token) {
            console.log("Auto-login détecté pour:", credentials.email);
            
            // Rechercher l'utilisateur par email
            const user = await prisma.user.findUnique({
              where: { email: credentials.email }
            });

            if (!user) {
              console.log("Utilisateur non trouvé pour auto-login:", credentials.email);
              return null;
            }

            // Mettre à jour la dernière connexion
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() }
            });

            console.log("Auto-login réussi pour:", user.email);
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role || 'USER',
            };
          }

          // Cas de connexion normale avec mot de passe
          if (!credentials?.password) {
            return null;
          }

          // Rechercher l'utilisateur par email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // Si aucun utilisateur n'est trouvé, renvoyer null
          if (!user) {
            console.log("Aucun utilisateur trouvé avec cet email:", credentials.email);
            return null;
          }

          // Si l'utilisateur existe mais n'a pas de mot de passe (connexion sociale)
          if (!user.password) {
            console.log("L'utilisateur n'a pas de mot de passe défini");
            return null;
          }

          // Vérifier si le mot de passe correspond
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.log("Mot de passe incorrect");
            return null;
          }

          // Mettre à jour la dernière connexion
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          // Authentification réussie
          console.log("Authentification réussie pour:", user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role || 'USER',
          };
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/auth/verify-request', // Page affichée après l'envoi du lien par email
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 24 * 60 * 60, // 15 jours (réduit de 30 jours)
    updateAge: 24 * 60 * 60, // Rafraîchir le token toutes les 24h
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 24 * 60 * 60, // 15 jours (réduit de 30 jours)
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'USER';
        token.permissions = user.permissions || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[] || [];
      }
      return session;
    },
    // Callback pour gérer les redirections après signIn
    async redirect({ url, baseUrl }) {
      // Si l'URL est relative, la rendre absolue
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Si l'URL commence par le baseUrl, l'autoriser
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Vérifier que l'URL est sur le même domaine
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        // Si même domaine, autoriser
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (error) {
        console.error('Error parsing redirect URL:', error);
      }
      
      // Sinon, rediriger vers le dashboard par défaut (sécurité)
      return `${baseUrl}/dashboard`;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-build',
}; 