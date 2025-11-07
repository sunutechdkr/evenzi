import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put, del } from '@vercel/blob';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

// Vérifier si Vercel Blob est disponible
function shouldUseBlob(): boolean {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  return hasBlobToken;
}

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
    const maxSize = 1 * 1024 * 1024; // 1MB (limite maximale)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Le fichier est trop volumineux (max 1MB)'
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

    const useBlob = shouldUseBlob();
    let imageUrl: string;

    if (useBlob) {
      // Supprimer l'ancien avatar de Vercel Blob si c'est une URL Blob
      if (currentUser?.image && currentUser.image.startsWith('https://') && currentUser.image.includes('vercel-storage.com')) {
        try {
          await del(currentUser.image);
          console.log('✅ Ancien avatar supprimé de Vercel Blob');
        } catch (error) {
          console.warn('⚠️ Impossible de supprimer l\'ancien avatar:', error);
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
        addRandomSuffix: true,
      });

      console.log('✅ Avatar uploadé vers Blob:', blob.url);
      imageUrl = blob.url;
    } else {
      // Fallback vers stockage local
      console.log('📁 Upload avatar vers stockage local (Blob non configuré)');

      // Supprimer l'ancien avatar local si existe
      if (currentUser?.image && currentUser.image.startsWith('/uploads/')) {
        try {
          const oldPath = join(process.cwd(), 'public', currentUser.image);
          if (existsSync(oldPath)) {
            await unlink(oldPath);
            console.log('✅ Ancien avatar supprimé localement');
          }
        } catch (error) {
          console.warn('⚠️ Impossible de supprimer l\'ancien avatar:', error);
        }
      }

      // Créer le dossier uploads s'il n'existe pas
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch {
        // Le dossier existe déjà
      }

      // Générer un nom de fichier unique
      const fileName = `${randomUUID()}-${file.name}`;
      const filePath = join(uploadsDir, fileName);

      // Écrire le fichier
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // URL publique du fichier
      imageUrl = `/uploads/avatars/${fileName}`;
      console.log('✅ Avatar uploadé localement:', imageUrl);
    }

    // Mettre à jour l'utilisateur avec la nouvelle image
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: imageUrl },
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
      imageUrl
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

    // Récupérer l'utilisateur actuel pour supprimer l'avatar
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { image: true }
    });

    const useBlob = shouldUseBlob();

    // Supprimer l'avatar selon le type de stockage
    if (currentUser?.image) {
      if (useBlob && currentUser.image.startsWith('https://') && currentUser.image.includes('vercel-storage.com')) {
        // Supprimer de Vercel Blob
        try {
          await del(currentUser.image);
          console.log('✅ Avatar supprimé de Vercel Blob');
        } catch (error) {
          console.warn('⚠️ Impossible de supprimer l\'avatar de Blob:', error);
        }
      } else if (!useBlob && currentUser.image.startsWith('/uploads/')) {
        // Supprimer du stockage local
        try {
          const oldPath = join(process.cwd(), 'public', currentUser.image);
          if (existsSync(oldPath)) {
            await unlink(oldPath);
            console.log('✅ Avatar supprimé localement');
          }
        } catch (error) {
          console.warn('⚠️ Impossible de supprimer l\'avatar local:', error);
        }
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