/**
 * Script de test pour le nouveau système de notifications optimisé
 * Usage: npx ts-node src/scripts/test-optimized-notifications.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  // Nouvelles fonctions optimisées
  createRegistrationMilestoneNotification,
  createCheckinMilestoneNotification,
  createSessionCapacityNotification,
  createEmailQuotaAlertNotification,
  createDigitalBadgeNotification,
  createAppointmentRequestNotification,
  createAppointmentConfirmationNotification,
  createGamificationPointsNotification,
  createSessionReminderNotification,
  
  // Utilitaires de paliers
  checkRegistrationMilestone,
  checkCheckinMilestone,
  checkSessionCapacity,
  checkEmailQuota,
  
  // Constantes
  REGISTRATION_MILESTONES,
  CHECKIN_MILESTONES
} from '../lib/notifications';

const prisma = new PrismaClient();

async function testOptimizedNotifications() {
  console.log('🧪 === TEST DU SYSTÈME DE NOTIFICATIONS OPTIMISÉ ===\n');
  
  try {
    // 1. Récupérer un événement de test
    console.log('1. 📊 Recherche d\'un événement de test...');
    const event = await prisma.event.findFirst({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        registrations: {
          take: 5,
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!event) {
      console.log('❌ Aucun événement trouvé. Créez d\'abord un événement de test.');
      return;
    }

    console.log(`✅ Événement trouvé: "${event.name}" (ID: ${event.id})`);
    console.log(`   Organisateur: ${event.user.name} (${event.user.email})`);
    console.log(`   Participants: ${event.registrations.length} inscriptions\n`);

    // 2. Test des notifications de paliers d'inscription
    console.log('2. 🎯 Test des paliers d\'inscription...');
    console.log(`   Paliers configurés: ${REGISTRATION_MILESTONES.join(', ')}`);
    
    const registrationCheck = await checkRegistrationMilestone(event.id);
    console.log(`   Résultat: ${JSON.stringify(registrationCheck)}`);

    if (registrationCheck.shouldNotify) {
      console.log('   🎉 Création d\'une notification de palier d\'inscription...');
      await createRegistrationMilestoneNotification(
        event.user.id,
        event.id,
        event.name,
        registrationCheck.milestone!
      );
      console.log('   ✅ Notification de palier créée avec succès');
    } else {
      console.log('   ℹ️ Aucun palier atteint, test avec simulation...');
      await createRegistrationMilestoneNotification(
        event.user.id,
        event.id,
        event.name,
        250 // Simulation
      );
      console.log('   ✅ Notification de palier simulée créée');
    }

    // 3. Test des notifications de paliers de check-in
    console.log('\n3. 📊 Test des paliers de check-in...');
    console.log(`   Paliers configurés: ${CHECKIN_MILESTONES.join(', ')}`);
    
    const checkinCheck = await checkCheckinMilestone(event.id);
    console.log(`   Résultat: ${JSON.stringify(checkinCheck)}`);

    if (checkinCheck.shouldNotify) {
      console.log('   🎉 Création d\'une notification de palier de check-in...');
      await createCheckinMilestoneNotification(
        event.user.id,
        event.id,
        checkinCheck.count!,
        checkinCheck.milestone!
      );
      console.log('   ✅ Notification de palier check-in créée');
    } else {
      console.log('   ℹ️ Aucun palier atteint, test avec simulation...');
      await createCheckinMilestoneNotification(
        event.user.id,
        event.id,
        100, // Simulation
        100
      );
      console.log('   ✅ Notification de palier check-in simulée créée');
    }

    // 4. Test notification quota email
    console.log('\n4. 📧 Test de notification quota email...');
    const quotaCheck = await checkEmailQuota(event.id);
    console.log(`   Résultat: ${JSON.stringify(quotaCheck)}`);

    if (quotaCheck.shouldNotify) {
      console.log('   🚨 Création d\'une notification de quota email...');
      await createEmailQuotaAlertNotification(
        event.user.id,
        event.id,
        quotaCheck.eventName!,
        quotaCheck.quotaUsed!,
        quotaCheck.quotaLimit!
      );
      console.log('   ✅ Notification de quota créée');
    } else {
      console.log('   ℹ️ Quota OK, test avec simulation...');
      await createEmailQuotaAlertNotification(
        event.user.id,
        event.id,
        event.name,
        9500, // 95% du quota
        10000
      );
      console.log('   ✅ Notification de quota simulée créée');
    }

    // 5. Test des notifications participants
    if (event.registrations.length > 0) {
      const participant = event.registrations[0];
      console.log(`\n5. 👤 Test des notifications participant (${participant.firstName} ${participant.lastName})...`);

      // Rechercher l'utilisateur correspondant
      const participantUser = await prisma.user.findFirst({
        where: { email: participant.email },
        select: { id: true }
      });

      if (participantUser) {
        console.log(`   ✅ Utilisateur participant trouvé (ID: ${participantUser.id})`);

        // Test notification badge digital
        console.log('   🎫 Test notification badge digital...');
        await createDigitalBadgeNotification(
          participantUser.id,
          event.id
        );
        console.log('   ✅ Notification badge digital créée');

        // Test notification gamification
        console.log('   🎮 Test notification gamification...');
        await createGamificationPointsNotification(
          participantUser.id,
          event.id,
          10,
          'Session de test',
          'participation_session'
        );
        console.log('   ✅ Notification gamification créée');

        // Test notification rappel de session
        console.log('   ⏰ Test notification rappel de session...');
        await createSessionReminderNotification(
          participantUser.id,
          event.id,
          'Keynote d\'ouverture',
          'session-test-id',
          15
        );
        console.log('   ✅ Notification rappel de session créée');

        // Test notification rendez-vous (si on a un 2ème participant)
        if (event.registrations.length > 1) {
          const otherParticipant = event.registrations[1];
          console.log('   🤝 Test notification demande de rendez-vous...');
          await createAppointmentRequestNotification(
            participantUser.id,
            event.id,
            `${otherParticipant.firstName} ${otherParticipant.lastName}`,
            'appointment-test-id'
          );
          console.log('   ✅ Notification demande de rendez-vous créée');

          console.log('   ✅ Test notification confirmation de rendez-vous...');
          await createAppointmentConfirmationNotification(
            participantUser.id,
            event.id,
            `${otherParticipant.firstName} ${otherParticipant.lastName}`,
            '14h30',
            'Stand A12',
            'appointment-test-id'
          );
          console.log('   ✅ Notification confirmation de rendez-vous créée');
        }
      } else {
        console.log('   ⚠️ Aucun utilisateur trouvé pour ce participant (email non correspondant)');
      }
    }

    // 6. Vérification des notifications créées
    console.log('\n6. 📋 Vérification des notifications créées...');
    const notifications = await prisma.notification.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        isRead: true,
        createdAt: true,
        metadata: true
      }
    });

    console.log(`   📊 ${notifications.length} notifications trouvées pour cet événement:`);
    notifications.forEach((notif, index) => {
      const metadata = notif.metadata ? ` (${JSON.stringify(notif.metadata)})` : '';
      console.log(`   ${index + 1}. [${notif.type}] ${notif.title} - ${notif.priority}${metadata}`);
      console.log(`      "${notif.message}"`);
      console.log(`      Créée: ${notif.createdAt.toLocaleString('fr-FR')}\n`);
    });

    console.log('✅ === TESTS TERMINÉS AVEC SUCCÈS ===');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testOptimizedNotifications();
}

export { testOptimizedNotifications };
