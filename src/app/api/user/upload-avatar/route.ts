import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put, del } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Le fichier est trop volumineux (max 5MB)'
      }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Type de fichier non autorisé (JPEG, PNG, WebP uniquement)'
      }, { status: 400 });
    }

    // Récupérer l'utilisateur actuel pour supprimer l'ancien avatar si existe
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { image: true }
    });

    // Supprimer l'ancien avatar de Vercel Blob si c'est une URL Blob
    if (currentUser?.image && currentUser.image.startsWith('https://') && currentUser.image.includes('vercel-storage.com')) {
      try {
        // Utiliser l'URL complète pour supprimer le blob
        await del(currentUser.image);
        console.log('✅ Ancien avatar supprimé de Vercel Blob');
      } catch (error) {
        console.warn('⚠️ Impossible de supprimer l\'ancien avatar:', error);
        // Continuer même si la suppression échoue
      }
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `avatar_${timestamp}.${extension}`;
    const pathname = `avatars/${filename}`;

    console.log('📁 Upload avatar vers Vercel Blob:', pathname);

    // Upload vers Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true, // Évite les conflits
    });

    console.log('✅ Avatar uploadé vers Blob:', blob.url);

    // Mettre à jour l'utilisateur avec la nouvelle image
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: blob.url },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Avatar mis à jour avec succès',
      user: updatedUser,
      imageUrl: blob.url
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'upload de l\'avatar:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'upload de l\'avatar'
    }, { status: 500 });
  }
}

// DELETE - Supprimer l'avatar
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer l'utilisateur actuel pour supprimer l'avatar de Vercel Blob
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { image: true }
    });

    // Supprimer l'avatar de Vercel Blob si c'est une URL Blob
    if (currentUser?.image && currentUser.image.startsWith('https://') && currentUser.image.includes('vercel-storage.com')) {
      try {
        // Utiliser l'URL complète pour supprimer le blob
        await del(currentUser.image);
        console.log('✅ Avatar supprimé de Vercel Blob');
      } catch (error) {
        console.warn('⚠️ Impossible de supprimer l\'avatar de Blob:', error);
        // Continuer même si la suppression échoue
      }
    }

    // Remettre l'image à null (utilisera les initiales par défaut)
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Avatar supprimé avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'avatar:', error);
    return NextResponse.json({
      error: 'Erreur lors de la suppression de l\'avatar'
    }, { status: 500 });
  }
} 