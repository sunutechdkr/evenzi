/**
 * API DIAGNOSTIC NOTIFICATIONS V2
 * GET /api/notifications-v2/diagnose - Diagnostiquer l'état du système
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const diagnostics = {
      user: session.user,
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        tableExists: false,
        structure: null,
        sampleData: null,
        userNotifications: 0
      },
      recommendations: []
    };

    try {
      // Test 1: Connexion base de données
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.database.connected = true;

      // Test 2: Existence de la table notifications
      const tableExistsResult = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
        ) as exists;
      `;
      diagnostics.database.tableExists = tableExistsResult[0]?.exists || false;

      if (diagnostics.database.tableExists) {
        // Test 3: Structure de la table
        const structure = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
          ORDER BY ordinal_position;
        `;
        diagnostics.database.structure = structure;

        // Test 4: Données d'exemple
        const sampleData = await prisma.$queryRaw`
          SELECT id, user_id, title, message, type, is_read, created_at
          FROM notifications 
          ORDER BY created_at DESC 
          LIMIT 3;
        `;
        diagnostics.database.sampleData = sampleData;

        // Test 5: Notifications de l'utilisateur
        const userNotifications = await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM notifications 
          WHERE user_id = ${session.user.id};
        `;
        diagnostics.database.userNotifications = parseInt(userNotifications[0]?.count || '0');

        // Vérifications de structure
        const requiredColumns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'created_at'];
        const existingColumns = structure.map(col => col.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
          diagnostics.recommendations.push({
            type: 'error',
            message: `Colonnes manquantes: ${missingColumns.join(', ')}`,
            action: 'Exécuter le script SQL de correction'
          });
        } else {
          diagnostics.recommendations.push({
            type: 'success',
            message: 'Structure de table correcte',
            action: 'Le système devrait fonctionner'
          });
        }

        if (diagnostics.database.userNotifications === 0) {
          diagnostics.recommendations.push({
            type: 'info',
            message: 'Aucune notification trouvée pour cet utilisateur',
            action: 'Tester la création de notifications'
          });
        }

      } else {
        diagnostics.recommendations.push({
          type: 'error',
          message: 'Table notifications introuvable',
          action: 'Exécuter le script SQL pour créer la table'
        });
      }

    } catch (dbError) {
      diagnostics.database.error = dbError.message;
      diagnostics.recommendations.push({
        type: 'error',
        message: `Erreur base de données: ${dbError.message}`,
        action: 'Vérifier la connexion et les permissions'
      });
    }

    return NextResponse.json(diagnostics);

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return NextResponse.json(
      { error: 'Erreur lors du diagnostic', details: error.message },
      { status: 500 }
    );
  }
}
