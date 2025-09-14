/**
 * Script de test pour le système de notifications
 * Teste toutes les fonctionnalités de notifications
 */

import { prisma } from '@/lib/prisma';
import { 
  createNotification,
  createRegistrationNotification,
  createGameNotification,
  createEmailCampaignNotification,
  createSystemNotification,
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/lib/notifications';

async function testNotificationSystem() {
  console.log('🧪 Début des tests du système de notifications...\n');

  try {
    // 1. Trouver un utilisateur de test
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'bouba@evenzi.io'
      }
    });

    if (!testUser) {
      console.error('❌ Utilisateur de test non trouvé');
      return;
    }

    console.log(`✅ Utilisateur de test trouvé: ${testUser.email} (${testUser.id})`);

    // 2. Trouver un événement de test
    const testEvent = await prisma.event.findFirst({
      where: {
        userId: testUser.id
      }
    });

    if (!testEvent) {
      console.log('⚠️ Aucun événement trouvé, création d\'un événement de test...');
      // Créer un événement de test si nécessaire
      const newEvent = await prisma.event.create({
        data: {
          name: 'Test Event - Notifications',
          description: 'Événement de test pour les notifications',
          location: 'Test Location',
          slug: 'test-event-notifications-' + Date.now(),
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
          endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // Dans 8 jours
          userId: testUser.id,
        }
      });
      console.log(`✅ Événement de test créé: ${newEvent.name} (${newEvent.id})`);
    }

    const eventId = testEvent?.id || (await prisma.event.findFirst({ where: { userId: testUser.id } }))?.id;

    if (!eventId) {
      console.error('❌ Impossible de créer ou trouver un événement de test');
      return;
    }

    // 3. Test de création de notifications
    console.log('\n📝 Test de création de notifications...');

    // Notification système
    const systemNotif = await createSystemNotification(
      testUser.id,
      'Test Notification Système',
      'Ceci est une notification de test du système',
      'HIGH'
    );
    console.log(`✅ Notification système créée: ${systemNotif.id}`);

    // Notification d'inscription
    const registrationNotif = await createRegistrationNotification(
      testUser.id,
      eventId,
      'Jean Test',
      'test-registration-id'
    );
    console.log(`✅ Notification d'inscription créée: ${registrationNotif.id}`);

    // Notification de gamification
    const gameNotif = await createGameNotification(
      testUser.id,
      eventId,
      50,
      'CHECK_IN',
      'test-game-id'
    );
    console.log(`✅ Notification de gamification créée: ${gameNotif.id}`);

    // Notification de campagne email
    const emailNotif = await createEmailCampaignNotification(
      testUser.id,
      eventId,
      'Campagne de Test',
      25,
      'test-campaign-id'
    );
    console.log(`✅ Notification de campagne email créée: ${emailNotif.id}`);

    // 4. Test de récupération des notifications
    console.log('\n📋 Test de récupération des notifications...');

    const allNotifications = await getUserNotifications({
      userId: testUser.id,
      limit: 10
    });
    console.log(`✅ ${allNotifications.length} notifications récupérées`);

    const unreadNotifications = await getUserNotifications({
      userId: testUser.id,
      isRead: false,
      limit: 10
    });
    console.log(`✅ ${unreadNotifications.length} notifications non lues`);

    // 5. Test du compteur de notifications non lues
    const unreadCount = await getUnreadNotificationsCount(testUser.id);
    console.log(`✅ Compteur de notifications non lues: ${unreadCount}`);

    // 6. Test de marquage comme lu
    console.log('\n✅ Test de marquage comme lu...');

    if (allNotifications.length > 0) {
      const firstNotif = allNotifications[0];
      await markNotificationAsRead(firstNotif.id, testUser.id);
      console.log(`✅ Notification ${firstNotif.id} marquée comme lue`);
    }

    // 7. Test de marquage de toutes les notifications comme lues
    console.log('\n✅ Test de marquage de toutes les notifications comme lues...');
    
    const markAllResult = await markAllNotificationsAsRead(testUser.id);
    console.log(`✅ ${markAllResult.count} notifications marquées comme lues`);

    // 8. Vérification finale
    const finalUnreadCount = await getUnreadNotificationsCount(testUser.id);
    console.log(`✅ Compteur final de notifications non lues: ${finalUnreadCount}`);

    console.log('\n🎉 Tous les tests sont passés avec succès !');

    // 9. Affichage des notifications créées
    console.log('\n📊 Résumé des notifications créées:');
    const finalNotifications = await getUserNotifications({
      userId: testUser.id,
      limit: 10
    });

    finalNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type}] ${notif.title} - ${notif.isRead ? 'Lu' : 'Non lu'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testNotificationSystem();
}

export { testNotificationSystem };
