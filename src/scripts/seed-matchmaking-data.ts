const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SAMPLE_INTERESTS = [
  ["IA", "Machine Learning", "Innovation", "Startup"],
  ["Blockchain", "Fintech", "Crypto", "Innovation"],
  ["Marketing", "Digital", "E-commerce", "Growth"],
  ["Design", "UX/UI", "Product", "Créativité"],
  ["Finance", "Investissement", "Business", "Stratégie"],
  ["Tech", "DevOps", "Cloud", "Développement"],
  ["RH", "Management", "Leadership", "Talent"],
  ["Sales", "Business Development", "Partnerships", "Networking"]
];

const SAMPLE_GOALS = [
  ["Networking", "Apprentissage", "Innovation"],
  ["Investissement", "Partenariat", "Expansion"],
  ["Recrutement", "Talent", "Team Building"],
  ["Vente", "Business Development", "Growth"],
  ["Collaboration", "Partenariat", "Innovation"],
  ["Mentoring", "Formation", "Apprentissage"],
  ["Fundraising", "Investissement", "Croissance"],
  ["Consulting", "Expertise", "Conseil"]
];

const SAMPLE_AVAILABILITY = [
  ["09:00 - 10:00", "10:00 - 11:00", "14:00 - 15:00"],
  ["11:00 - 12:00", "15:00 - 16:00", "16:00 - 17:00"],
  ["09:00 - 10:00", "13:00 - 14:00", "17:00 - 18:00"],
  ["10:00 - 11:00", "11:00 - 12:00", "15:00 - 16:00"],
  ["14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00"],
  ["09:00 - 10:00", "12:00 - 13:00", "13:00 - 14:00"],
  ["11:00 - 12:00", "14:00 - 15:00", "17:00 - 18:00"],
  ["10:00 - 11:00", "16:00 - 17:00", "17:00 - 18:00"]
];

const SAMPLE_HEADLINES = [
  "Expert en IA et Machine Learning",
  "Entrepreneur Blockchain & Fintech",
  "Directeur Marketing Digital",
  "Designer UX/UI Senior",
  "Analyste Financier & Investisseur",
  "Développeur Full-Stack & DevOps",
  "Responsable RH & Talent Acquisition",
  "Business Developer & Sales Manager"
];

const SAMPLE_BIOS = [
  "Passionné par l'intelligence artificielle et son application dans les entreprises. J'aide les startups à intégrer l'IA dans leurs processus.",
  "Entrepreneur dans le domaine blockchain depuis 5 ans. Je développe des solutions DeFi innovantes et accompagne les projets crypto.",
  "Spécialiste du marketing digital avec 8 ans d'expérience. J'aide les entreprises à développer leur présence en ligne et optimiser leurs conversions.",
  "Designer passionné par l'expérience utilisateur. Je crée des interfaces intuitives qui transforment la façon dont les gens interagissent avec la technologie.",
  "Analyste financier avec expertise en investissement et évaluation d'entreprises. Je conseille les startups sur leur stratégie de financement.",
  "Développeur full-stack passionné par les technologies modernes. J'aide les entreprises à construire des applications scalables et performantes.",
  "Responsable RH spécialisé dans le recrutement tech. J'aide les startups à construire leurs équipes et développer leur culture d'entreprise.",
  "Business developer avec un réseau étendu dans l'écosystème startup. Je facilite les partenariats et le développement commercial."
];

async function seedMatchmakingData() {
  try {
    console.log('🌱 Début du seeding des données de matchmaking...');

    // Récupérer toutes les registrations avec les informations utilisateur et événement
    const registrations = await prisma.registration.findMany({
      include: {
        event: true
      }
    });

    console.log(`👥 Trouvé ${registrations.length} registrations`);

    let createdProfiles = 0;

    for (const registration of registrations) {
      // Trouver l'utilisateur par email
      const user = await prisma.user.findUnique({
        where: {
          email: registration.email
        }
      });

      if (!user) {
        console.log(`⚠️  Utilisateur non trouvé pour l'email ${registration.email}`);
        continue;
      }

      // Vérifier si un profil de matchmaking existe déjà
      const existingProfile = await prisma.userMatchProfile.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: registration.eventId
          }
        }
      });

      if (!existingProfile) {
        // Créer un profil de matchmaking avec des données aléatoires
        const randomIndex = Math.floor(Math.random() * SAMPLE_INTERESTS.length);
        
        await prisma.userMatchProfile.create({
          data: {
            userId: user.id,
            eventId: registration.eventId,
            headline: SAMPLE_HEADLINES[randomIndex],
            bio: SAMPLE_BIOS[randomIndex],
            jobTitle: registration.jobTitle || `Professionnel ${randomIndex + 1}`,
            company: registration.company || `Entreprise ${randomIndex + 1}`,
            interests: SAMPLE_INTERESTS[randomIndex],
            goals: SAMPLE_GOALS[randomIndex],
            availability: SAMPLE_AVAILABILITY[randomIndex]
          }
        });

        createdProfiles++;
        console.log(`✅ Profil créé pour ${user.name || user.email} dans l'événement ${registration.event.name}`);
      } else {
        console.log(`⏭️  Profil existant pour ${user.name || user.email} dans l'événement ${registration.event.name}`);
      }
    }

    console.log(`🎉 Seeding terminé ! ${createdProfiles} nouveaux profils de matchmaking créés.`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  seedMatchmakingData();
}

module.exports = seedMatchmakingData; 