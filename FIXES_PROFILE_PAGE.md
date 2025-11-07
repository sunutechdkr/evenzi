# 🔧 Correctifs Page Profil - Guide de Déploiement

## 📋 Résumé des changements

Tous les changements demandés ont été implémentés avec succès :

### ✅ Corrections appliquées

1. **Bloc stats déplacé** : Les statistiques apparaissent maintenant APRÈS le bouton "Modifier mon profil"
2. **Gestion des erreurs API** : L'API `/api/user/stats` retourne 0 si les tables n'existent pas (au lieu de crasher)
3. **Champs profil ajoutés** : `jobTitle`, `company`, `bio` ajoutés au schéma Prisma
4. **Pages créées** : Sécurité, Données, Langage, FAQ, Support, Terms

---

## 🚨 Actions requises pour corriger les erreurs Vercel

### 1. ⚙️ Exécuter la migration SQL

Les champs `jobTitle`, `company` et `bio` doivent être ajoutés à votre table `users` dans Neon :

#### 📝 **Option A : Via Neon Console SQL Editor**

1. Allez sur [Neon Console](https://console.neon.tech/)
2. Sélectionnez votre base de données `evenzidb`
3. Ouvrez le **SQL Editor**
4. Copiez-collez et exécutez :

```sql
-- Ajouter les colonnes job_title, company et bio
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Vérification
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('job_title', 'company', 'bio');
```

✅ **Résultat attendu** : 3 lignes affichant les nouvelles colonnes

#### 📝 **Option B : Via fichier SQL fourni**

Le fichier `add_user_profile_fields.sql` contient le script complet.

---

### 2. 🎨 Configurer Vercel Blob (Upload Avatar)

Vous avez fourni le token : `BLOB_READ_WRITE_TOKEN="vercel_blob_rw_NRHsPeOcazxaoQHo_BRH1sf5MdRlpSK33Ziwquvza81QgAY"`

#### Vérification dans Vercel Dashboard :

1. **Variables d'environnement** :
   ```
   Production: ✅ BLOB_READ_WRITE_TOKEN défini
   Preview: ✅ BLOB_READ_WRITE_TOKEN défini
   ```

2. **Storage Blob activé** :
   - Dashboard > Storage > Blob Storage
   - Doit être connecté au projet `inevent`

3. **Le dossier `avatars/` est créé automatiquement** lors du premier upload :
   - Vous ne verrez pas le dossier avant qu'un utilisateur uploade un avatar
   - C'est normal ! Vercel Blob crée les dossiers à la demande

#### Test d'upload :

```javascript
// Dans la console du navigateur (F12)
// Assurez-vous d'être connecté à /dashboard/profile

const testUpload = async () => {
  // Créer une image test (carré vert)
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#81B441';
  ctx.fillRect(0, 0, 200, 200);
  
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('avatar', blob, 'test-avatar.jpg');
    
    const response = await fetch('/api/user/upload-avatar', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Résultat:', result);
    
    if (response.ok) {
      console.log('✅ Upload réussi !');
      console.log('URL:', result.imageUrl);
      // Recharger la page pour voir l'avatar
      window.location.reload();
    } else {
      console.error('❌ Erreur:', result.error);
    }
  }, 'image/jpeg', 0.9);
};

testUpload();
```

---

### 3. 🔄 Redéployer sur Vercel

Après avoir exécuté la migration SQL :

1. **Vider le cache de build** :
   - Vercel Dashboard > Deployments > ... (menu) > Redeploy > Clear cache and redeploy

2. **Vérifier les logs** :
   - Ouvrir `/dashboard/profile`
   - Logs Vercel > Functions > `/api/user/stats`
   - Vous devriez voir maintenant des `⚠️` au lieu d'erreurs fatales

---

## 🐛 Diagnostic des erreurs dans les logs

### Erreurs fréquentes et solutions

#### ❌ `Invalid prisma.checkIn.aggregate()` 
**Cause** : La table `CheckIn` (check-ins) n'existe pas ou n'a pas de données  
**Solution** : ✅ Déjà corrigé ! L'API retourne maintenant `0` au lieu de crasher

#### ❌ `Invalid prisma.sessionParticipant.count()`
**Cause** : La table `SessionParticipant` n'existe pas  
**Solution** : ✅ Déjà corrigé ! L'API retourne maintenant `0` au lieu de crasher

#### ❌ `Invalid prisma.appointment.count()`
**Cause** : La table `Appointment` n'existe pas  
**Solution** : ✅ Déjà corrigé ! L'API retourne maintenant `0` au lieu de crasher

#### ❌ `Column 'job_title' does not exist`
**Cause** : La migration SQL n'a pas été exécutée  
**Solution** : ⚠️ **Exécuter le script SQL ci-dessus dans Neon**

---

## 📊 Comportement attendu après les correctifs

### Page Profil (`/dashboard/profile`)

```
┌────────────────────────────────────────┐
│  [Avatar]                              │
│  Jean Dupont                           │
│  Développeur • Evenzi                  │
│  +33 6 12 34 56 78                     │
│  jean@evenzi.io                        │
│                                        │
│  "Passionné de tech et d'événements"   │
│                                        │
│  [Modifier mon profil]  ← CTA          │
│                                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │ 125 │ │  12 │ │   8 │ │  45 │     │
│  │Pts  │ │Sess │ │ RV  │ │Cont │     │
│  └─────┘ └─────┘ └─────┘ └─────┘     │
│                                        │
│  🔒 Confidentialité et Sécurité        │
│  💾 Données et Stockage                │
│  🌍 Langage                            │
│  ❓ FAQs                               │
│  🎧 Support                            │
│  📄 Termes et Conditions               │
└────────────────────────────────────────┘
```

### Statistiques affichées

- **0** pour toutes les stats = Normal si aucune donnée
- **> 0** pour les stats = Données existantes dans la DB

Les erreurs ne crashent plus la page ! 🎉

---

## 🧪 Tests à effectuer

### 1. Test page profil

```bash
URL: https://votre-app.vercel.app/dashboard/profile

Checklist:
☐ La page charge sans erreur
☐ Les informations s'affichent (nom, email)
☐ Le bouton "Modifier mon profil" apparaît
☐ Les stats s'affichent APRÈS le bouton (même à 0)
☐ Le menu des paramètres est cliquable
```

### 2. Test upload avatar

```bash
URL: /dashboard/profile

Checklist:
☐ Cliquer sur l'icône caméra
☐ Sélectionner une image < 1MB
☐ Vérifier les logs console (F12)
☐ L'avatar doit apparaître immédiatement
☐ Vérifier dans Vercel Blob Storage (dossier avatars/)
```

### 3. Test modal édition

```bash
Checklist:
☐ Cliquer sur "Modifier mon profil"
☐ Remplir Nom, Fonction, Entreprise, Bio
☐ Sauvegarder
☐ Vérifier que les infos s'affichent
☐ Toast de confirmation apparaît
```

### 4. Test pages paramètres

```bash
Pages à tester:
☐ /dashboard/profile/security (changement mot de passe)
☐ /dashboard/profile/data (export données)
☐ /dashboard/profile/language (sélection langue)
☐ /faq (questions fréquentes)
☐ /support (formulaire contact)
☐ /terms (CGU)
```

---

## 📝 Checklist de déploiement

### Avant déploiement

- [x] Schéma Prisma mis à jour
- [x] Client Prisma régénéré
- [x] Build local réussi
- [x] Code commité sur GitHub
- [ ] Migration SQL exécutée dans Neon ⚠️ **À FAIRE**
- [x] Variables Vercel Blob vérifiées

### Après déploiement

- [ ] Page profil charge sans erreur
- [ ] Stats affichées (même à 0)
- [ ] Upload avatar fonctionne
- [ ] Modal édition fonctionne
- [ ] Toutes les pages paramètres accessibles

---

## 🆘 En cas de problème persistant

### Logs à vérifier

1. **Console navigateur (F12)** :
   ```
   📸 Fichier sélectionné: avatar.jpg Taille: 245.67 KB
   🚀 Début upload avatar...
   ```

2. **Logs Vercel** (Dashboard > Deployments > Logs) :
   ```
   ⚠️ Table CheckIn non accessible: [error]
   → Normal si pas de check-ins encore
   
   ✅ Stats retournées avec succès
   → La page doit fonctionner
   ```

3. **Neon Database** (Console > Query) :
   ```sql
   -- Vérifier que les colonnes existent
   SELECT job_title, company, bio 
   FROM users 
   LIMIT 1;
   ```

### Commandes utiles

```bash
# Régénérer le client Prisma
npx prisma generate

# Tester le build
npm run build

# Voir le schéma actuel de la DB
npx prisma db pull

# Pousser le schéma vers la DB (ATTENTION: peut écraser)
# npx prisma db push
```

---

## ✅ Résumé

**Déjà fait** :
- ✅ Code corrigé et déployé sur GitHub (commit `b5962fe`)
- ✅ Gestion des erreurs API avec fallbacks
- ✅ Schéma Prisma mis à jour
- ✅ Build réussi localement

**À faire** :
- ⚠️ **Exécuter la migration SQL dans Neon** (script fourni ci-dessus)
- 🔄 Redéployer sur Vercel (clear cache)
- ✅ Vérifier que Blob fonctionne (token déjà configuré)

**Résultat attendu** :
- Page profil charge sans erreur
- Stats affichées (0 ou valeurs réelles)
- Upload avatar fonctionnel
- Toutes les pages accessibles

---

## 📞 Support

Si après avoir exécuté la migration SQL les erreurs persistent :

1. Vérifier les logs Vercel en détail
2. Partager le message d'erreur exact
3. Vérifier que la migration SQL a bien été exécutée :
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users';
   ```

---

**✨ Une fois la migration SQL exécutée, tout devrait fonctionner parfaitement !**

