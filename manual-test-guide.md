# 🧪 GUIDE DE TEST MANUEL - EVENZI

## ✅ ÉTAPES DE TEST COMPLÈTES

### 1. 🔐 TEST DE CONNEXION

**URL:** https://studio.evenzi.io/auth/signin

**Actions à effectuer:**
1. Aller sur la page de connexion
2. Se connecter avec un compte existant ou créer un compte
3. Vérifier la redirection vers le dashboard approprié selon le rôle

**Résultats attendus:**
- ✅ Page de connexion accessible (Status 200) ✓
- ✅ Formulaire de connexion fonctionnel
- ✅ Redirection correcte après connexion

### 2. 🎉 TEST DE CRÉATION D'ÉVÉNEMENT

**Navigation:** Dashboard > Événements > Créer un événement

**Données de test - "Evenzi Launch Day":**
```json
{
  "title": "Evenzi Launch Day",
  "description": "Événement de lancement officiel de la plateforme Evenzi - Découvrez toutes les fonctionnalités et rencontrez l'équipe",
  "location": "Paris, France - Centre de Conférences",
  "startDate": "2025-12-15",
  "startTime": "09:00",
  "endDate": "2025-12-15", 
  "endTime": "18:00",
  "maxParticipants": 200,
  "registrationDeadline": "2025-12-10",
  "sector": "Technologie",
  "type": "Conférence",
  "format": "Hybride"
}
```

**Tests à effectuer:**
- ✅ Créer l'événement avec les données ci-dessus
- ✅ Vérifier que l'événement apparaît dans la liste
- ✅ Accéder aux détails de l'événement
- ✅ Modifier les informations de l'événement
- ✅ Vérifier la génération automatique du slug

### 3. 👥 TEST DE CRÉATION DE PARTICIPANTS (40 PARTICIPANTS)

**Navigation:** Événement > Participants > Ajouter des participants

**Participants de test à créer:**

#### Batch 1 - Organisateurs (5 participants)
1. Marie Dubois - marie.dubois@evenzi.com - Directrice Marketing
2. Pierre Martin - pierre.martin@evenzi.com - CTO
3. Sophie Bernard - sophie.bernard@evenzi.com - Responsable Événements
4. Lucas Moreau - lucas.moreau@evenzi.com - Designer UX
5. Emma Leroy - emma.leroy@evenzi.com - Community Manager

#### Batch 2 - Speakers (10 participants)
6. Dr. Jean Dupont - jean.dupont@tech-innovation.fr - Expert IA
7. Sarah Chen - sarah.chen@startup-hub.com - CEO StartupHub
8. Marc Rodriguez - marc.rodriguez@digital-agency.fr - Digital Strategist
9. Amélie Rousseau - amelie.rousseau@innovation-lab.org - Innovation Manager
10. Thomas Kim - thomas.kim@future-tech.io - Futurologue
11. Léa Gonzalez - lea.gonzalez@green-tech.fr - Sustainability Expert
12. David Wilson - david.wilson@ai-research.com - AI Researcher
13. Camille Nguyen - camille.nguyen@design-studio.fr - Creative Director
14. Alex Johnson - alex.johnson@blockchain-corp.com - Blockchain Expert
15. Julie Patel - julie.patel@marketing-pro.fr - Growth Hacker

#### Batch 3 - Participants Standard (25 participants)
16-40. [Générer 25 participants avec des noms et emails variés]

**Tests à effectuer:**
- ✅ Ajouter des participants un par un
- ✅ Importer des participants via CSV (si disponible)
- ✅ Vérifier la liste des participants
- ✅ Modifier les informations d'un participant
- ✅ Supprimer un participant
- ✅ Rechercher des participants
- ✅ Exporter la liste des participants

### 4. 📅 TEST DE CRÉATION DE SESSIONS

**Navigation:** Événement > Sessions > Créer une session

**Sessions de test à créer:**

#### Session 1 - Keynote d'ouverture
```json
{
  "title": "L'Avenir des Plateformes Événementielles",
  "description": "Présentation des tendances et innovations dans l'industrie événementielle",
  "speaker": "Dr. Jean Dupont",
  "startTime": "09:30",
  "endTime": "10:30",
  "location": "Auditorium Principal",
  "type": "Keynote",
  "maxParticipants": 200
}
```

#### Session 2 - Workshop Tech
```json
{
  "title": "Atelier : Créer des Expériences Immersives",
  "description": "Workshop pratique sur les technologies immersives pour événements",
  "speaker": "Sarah Chen",
  "startTime": "11:00",
  "endTime": "12:30",
  "location": "Salle Workshop A",
  "type": "Workshop",
  "maxParticipants": 50
}
```

#### Session 3 - Panel Discussion
```json
{
  "title": "Table Ronde : Innovation et Durabilité",
  "description": "Discussion sur l'innovation responsable dans l'événementiel",
  "speaker": "Léa Gonzalez, Marc Rodriguez, Amélie Rousseau",
  "startTime": "14:00",
  "endTime": "15:30",
  "location": "Salle de Conférence B",
  "type": "Panel",
  "maxParticipants": 100
}
```

#### Session 4 - Networking
```json
{
  "title": "Session Networking & Cocktail",
  "description": "Moment d'échange et de networking entre participants",
  "startTime": "16:00",
  "endTime": "17:30",
  "location": "Espace Networking",
  "type": "Networking",
  "maxParticipants": 200
}
```

**Tests à effectuer:**
- ✅ Créer les 4 sessions avec les données ci-dessus
- ✅ Vérifier l'affichage du planning
- ✅ Modifier une session
- ✅ Assigner des participants aux sessions
- ✅ Gérer les conflits d'horaires
- ✅ Exporter le planning

### 5. 🏢 TEST DE CRÉATION D'EXPOSANTS/SPONSORS

**Navigation:** Événement > Sponsors/Exposants > Ajouter un sponsor

**Sponsors de test à créer:**

#### Sponsor Principal
```json
{
  "name": "TechCorp Solutions",
  "logo": "https://via.placeholder.com/300x150/0066cc/ffffff?text=TechCorp",
  "description": "Leader mondial des solutions technologiques pour entreprises",
  "website": "https://techcorp-solutions.com",
  "contact": "contact@techcorp-solutions.com",
  "tier": "Platine",
  "standNumber": "A01"
}
```

#### Sponsors Gold
```json
[
  {
    "name": "Innovation Labs",
    "tier": "Gold",
    "standNumber": "B02"
  },
  {
    "name": "Digital Future",
    "tier": "Gold", 
    "standNumber": "B03"
  },
  {
    "name": "StartupBoost",
    "tier": "Gold",
    "standNumber": "B04"
  }
]
```

#### Sponsors Silver
```json
[
  {
    "name": "CloudTech Pro",
    "tier": "Silver",
    "standNumber": "C05"
  },
  {
    "name": "AI Dynamics",
    "tier": "Silver",
    "standNumber": "C06"
  }
]
```

**Tests à effectuer:**
- ✅ Créer les sponsors avec différents tiers
- ✅ Uploader des logos
- ✅ Assigner des emplacements de stands
- ✅ Gérer les membres des équipes sponsors
- ✅ Modifier les informations sponsors
- ✅ Afficher la liste publique des sponsors

### 6. 🔧 TEST DES APIs CRUD

**APIs à tester:**

#### Événements
- ✅ GET /api/events - Liste des événements
- ✅ POST /api/events - Création d'événement
- ✅ GET /api/events/[id] - Détails événement
- ✅ PUT /api/events/[id] - Modification événement
- ✅ DELETE /api/events/[id] - Suppression événement

#### Participants
- ✅ GET /api/events/[id]/participants - Liste participants
- ✅ POST /api/events/[id]/participants - Ajout participant
- ✅ PUT /api/events/[id]/participants/[id] - Modification participant
- ✅ DELETE /api/events/[id]/participants/[id] - Suppression participant

#### Sessions
- ✅ GET /api/events/[id]/sessions - Liste sessions
- ✅ POST /api/events/[id]/sessions - Création session
- ✅ PUT /api/events/[id]/sessions/[id] - Modification session
- ✅ DELETE /api/events/[id]/sessions/[id] - Suppression session

#### Sponsors
- ✅ GET /api/events/[id]/sponsors - Liste sponsors
- ✅ POST /api/events/[id]/sponsors - Ajout sponsor
- ✅ PUT /api/events/[id]/sponsors/[id] - Modification sponsor
- ✅ DELETE /api/events/[id]/sponsors/[id] - Suppression sponsor

### 7. 📊 TESTS FONCTIONNELS AVANCÉS

**Fonctionnalités à valider:**
- ✅ Dashboard analytics avec statistiques
- ✅ Export des données (participants, sessions, sponsors)
- ✅ Système de check-in (QR codes)
- ✅ Envoi d'emails (invitations, rappels)
- ✅ Gestion des rôles et permissions
- ✅ Interface responsive (mobile/desktop)
- ✅ Performance (temps de chargement)

## 🎯 CRITÈRES DE SUCCÈS

### ✅ FONCTIONNALITÉS CORE
- [ ] Connexion/Authentification
- [ ] Création d'événement "Evenzi Launch Day"
- [ ] 40 participants créés et gérés
- [ ] 4 sessions créées avec planning
- [ ] 6 sponsors/exposants configurés
- [ ] APIs CRUD fonctionnels (15 endpoints testés)

### ✅ QUALITÉ & PERFORMANCE
- [ ] Interface responsive
- [ ] Temps de chargement < 3 secondes
- [ ] Aucune erreur critique
- [ ] Navigation intuitive
- [ ] Données cohérentes

### ✅ SÉCURITÉ
- [ ] Authentification requise
- [ ] Permissions par rôle respectées
- [ ] Validation des données
- [ ] Protection contre les attaques courantes

## 📝 RAPPORT DE TEST

**À compléter après les tests:**

### Résultats Globaux
- Tests réussis: __ / __
- Erreurs critiques: __
- Erreurs mineures: __
- Performance globale: __/10

### Problèmes Identifiés
1. [Décrire les problèmes rencontrés]
2. [Actions correctives nécessaires]

### Recommandations
1. [Améliorations suggérées]
2. [Optimisations possibles]

---

**🚀 Une fois tous les tests validés, l'application Evenzi sera prête pour la production !**
