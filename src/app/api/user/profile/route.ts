import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Schémas de validation
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long').optional(),
  phone: z.string().regex(/^[+]?[0-9\s\-\(\)]+$/, 'Format de téléphone invalide').optional(),
  image: z.string().url('URL d\'image invalide').optional(),
  jobTitle: z.string().max(100, 'Le titre est trop long').optional(),
  company: z.string().max(100, 'Le nom de l\'entreprise est trop long').optional(),
  bio: z.string().max(300, 'La bio ne peut dépasser 300 caractères').optional(),
});

const updateEmailSchema = z.object({
  email: z.string().email('Email invalide'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  confirmPassword: z.string().min(1, 'Confirmation requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const updatePlanSchema = z.object({
  plan: z.enum(['STARTER', 'PRO', 'PREMIUM']),
});

// Types pour les données validées
type UpdateProfileData = z.infer<typeof updateProfileSchema>;
type UpdateEmailData = z.infer<typeof updateEmailSchema>;
type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
type UpdatePlanData = z.infer<typeof updatePlanSchema>;

// GET - Récupérer le profil
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        plan: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        jobTitle: true,
        company: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour le profil
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'profile':
        return await updateProfile(session.user.email, data);
      case 'email':
        return await updateEmail(session.user.email, data);
      case 'password':
        return await updatePassword(session.user.email, data);
      case 'plan':
        return await updatePlan(session.user.email, data);
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonctions auxiliaires
async function updateProfile(email: string, data: UpdateProfileData) {
  const validation = updateProfileSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json({
      error: 'Données invalides',
      details: validation.error.issues
    }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: validation.data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      plan: true,
      role: true,
    },
  });

  return NextResponse.json({
    message: 'Profil mis à jour avec succès',
    user: updatedUser
  });
}

async function updateEmail(currentEmail: string, data: UpdateEmailData) {
  const validation = updateEmailSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json({
      error: 'Email invalide',
      details: validation.error.issues
    }, { status: 400 });
  }

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: validation.data.email }
  });

  if (existingUser && existingUser.email !== currentEmail) {
    return NextResponse.json({
      error: 'Cet email est déjà utilisé'
    }, { status: 409 });
  }

  const updatedUser = await prisma.user.update({
    where: { email: currentEmail },
    data: {
      email: validation.data.email,
      emailVerified: null, // Reset verification
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
    },
  });

  return NextResponse.json({
    message: 'Email mis à jour avec succès. Veuillez vérifier votre nouvel email.',
    user: updatedUser
  });
}

async function updatePassword(email: string, data: UpdatePasswordData) {
  const validation = updatePasswordSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json({
      error: 'Données invalides',
      details: validation.error.issues
    }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  // Si l'utilisateur a déjà un mot de passe, vérifier l'ancien
  if (user.password) {
    if (!validation.data.currentPassword) {
      return NextResponse.json({
        error: 'Mot de passe actuel requis pour modifier le mot de passe existant'
      }, { status: 400 });
    }
    
    const isValidPassword = await bcrypt.compare(validation.data.currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({
        error: 'Mot de passe actuel incorrect'
      }, { status: 400 });
    }
  }

  // Vérifier que le nouveau mot de passe est différent de l'ancien
  if (user.password) {
    const isSamePassword = await bcrypt.compare(validation.data.newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json({
        error: 'Le nouveau mot de passe doit être différent de l\'ancien'
      }, { status: 400 });
    }
  }

  // Hasher le nouveau mot de passe avec bcrypt (12 rounds = sécurisé)
  const hashedPassword = await bcrypt.hash(validation.data.newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return NextResponse.json({
    message: user.password ? 'Mot de passe modifié avec succès' : 'Mot de passe créé avec succès'
  });
}

async function updatePlan(email: string, data: UpdatePlanData) {
  const validation = updatePlanSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json({
      error: 'Plan invalide',
      details: validation.error.issues
    }, { status: 400 });
  }

  // Vérifier que l'utilisateur est ORGANIZER
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true }
  });

  if (!user || user.role !== 'ORGANIZER') {
    return NextResponse.json({
      error: 'Seuls les organisateurs peuvent modifier leur plan'
    }, { status: 403 });
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { plan: validation.data.plan },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
    },
  });

  return NextResponse.json({
    message: 'Plan mis à jour avec succès',
    user: updatedUser
  });
} 