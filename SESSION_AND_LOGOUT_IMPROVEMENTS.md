# 🔐 Améliorations du Système de Sessions et Déconnexion

## 📋 Résumé des Changements

Ce document décrit les améliorations apportées au système de gestion des sessions et de déconnexion de l'application Evenzi.

---

## ✅ 1. Réduction de la Durée des Sessions à 15 Jours

### **Changements Appliqués**

**Fichier** : `src/lib/auth.ts`

**Modifications** :
- ✅ `session.maxAge` : `30 * 24 * 60 * 60` → `15 * 24 * 60 * 60` (15 jours)
- ✅ `cookies.sessionToken.maxAge` : `30 * 24 * 60 * 60` → `15 * 24 * 60 * 60` (15 jours)
- ✅ `cookies.callbackUrl.maxAge` : `30 * 24 * 60 * 60` → `15 * 24 * 60 * 60` (15 jours)

**Impact** :
- Les utilisateurs devront se reconnecter après **15 jours d'inactivité** (au lieu de 30)
- Les sessions actives sont **automatiquement rafraîchies** toutes les 24h (`updateAge: 24 * 60 * 60`)
- Les cookies expirent après **15 jours** maximum**

**Avantages** :
- ✅ Sécurité renforcée (sessions plus courtes)
- ✅ Conformité avec les bonnes pratiques de sécurité
- ✅ Réduction du risque si un token est compromis

---

## ✅ 2. Amélioration du Système de Déconnexion

### **Changements Appliqués**

#### **A. Nouvelle API de Déconnexion**

**Fichier** : `src/app/api/auth/logout/route.ts`

**Fonctionnalités** :
- ✅ Logging des déconnexions pour analytics
- ✅ Enregistrement de l'utilisateur, email, rôle et timestamp
- ✅ Gestion d'erreur gracieuse (ne bloque jamais la déconnexion)
- ✅ Compatible avec le système de logging existant

**Exemple de log** :
```json
{
  "userId": "cmc5o6by90000i8pnx6zh8qxd",
  "email": "user@example.com",
  "role": "USER",
  "timestamp": "2025-11-09T02:25:00.000Z"
}
```

#### **B. Amélioration du Composant UserProfile**

**Fichier** : `src/components/dashboard/UserProfile.tsx`

**Améliorations** :
- ✅ Appel de l'API `/api/auth/logout` avant déconnexion
- ✅ Gestion d'erreur robuste (ne bloque pas la déconnexion si l'API échoue)
- ✅ Redirection vers `/login` au lieu de `/` après déconnexion
- ✅ Utilisation de `async/await` pour une meilleure gestion asynchrone

**Code** :
```typescript
const handleSignOut = async () => {
  try {
    // Appeler l'API de déconnexion pour logging (optionnel)
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (apiError) {
      // Ignorer les erreurs, ne pas bloquer la déconnexion
      console.warn('Logout API call failed, continuing with signOut:', apiError);
    }
    
    // Déconnexion NextAuth (supprime automatiquement les cookies)
    await signOut({ 
      redirect: true, 
      callbackUrl: '/login'
    });
  } catch (error) {
    // En cas d'erreur, forcer la déconnexion quand même
    await signOut({ redirect: true, callbackUrl: '/login' });
  }
};
```

**Avantages** :
- ✅ Traçabilité des déconnexions pour analytics
- ✅ Déconnexion fiable même en cas d'erreur API
- ✅ Meilleure expérience utilisateur (redirection vers login)

---

## ✅ 3. Calcul des Monthly Active Users (MAU) et Daily Active Users (DAU)

### **Changements Appliqués**

**Fichier** : `src/app/api/dashboard/stats/route.ts`

**Nouvelles Statistiques** :
- ✅ **Monthly Active Users (MAU)** : Utilisateurs avec `lastLogin` dans les **30 derniers jours**
- ✅ **Daily Active Users (DAU)** : Utilisateurs avec `lastLogin` **aujourd'hui**

**Implémentation** :
```typescript
// MAU : Utilisateurs actifs dans les 30 derniers jours
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const monthlyActiveUsers = await prisma.user.count({
  where: {
    lastLogin: {
      gte: thirtyDaysAgo
    }
  }
});

// DAU : Utilisateurs actifs aujourd'hui
const today = new Date();
today.setHours(0, 0, 0, 0);

const dailyActiveUsers = await prisma.user.count({
  where: {
    lastLogin: {
      gte: today
    }
  }
});
```

**Réponse API** :
```json
{
  "totalEvents": 10,
  "monthlyActiveUsers": 45,
  "dailyActiveUsers": 12,
  // ... autres stats
}
```

**Important** :
- ⚠️ **Un utilisateur avec une session cookie valide n'est PAS automatiquement un MAU**
- ✅ **Un utilisateur devient MAU uniquement s'il s'est connecté dans les 30 derniers jours** (`lastLogin >= now - 30 jours`)
- ✅ Le champ `lastLogin` est mis à jour à chaque connexion réelle (voir `auth.ts`)

**Avantages** :
- ✅ Métriques précises d'engagement utilisateur
- ✅ Distinction claire entre sessions actives et utilisateurs réellement actifs
- ✅ Compatible avec les standards d'analytics (MAU/DAU)

---

## 📊 Utilisation des Nouvelles Statistiques

### **Dans le Dashboard**

Les nouvelles statistiques `monthlyActiveUsers` et `dailyActiveUsers` sont maintenant disponibles dans l'API `/api/dashboard/stats`.

**Exemple d'utilisation côté client** :
```typescript
const response = await fetch('/api/dashboard/stats');
const data = await response.json();

console.log(`MAU: ${data.monthlyActiveUsers}`);
console.log(`DAU: ${data.dailyActiveUsers}`);
```

### **Affichage Recommandé**

Vous pouvez maintenant afficher ces métriques dans :
- 📊 Dashboard admin (vue d'ensemble des utilisateurs actifs)
- 📈 Page analytics (graphiques d'engagement)
- 📱 Widgets de statistiques (cartes de métriques)

---

## 🔍 Vérification et Tests

### **Tests Recommandés**

#### **1. Test de Durée de Session (15 jours)**
1. Se connecter à l'application
2. Vérifier que les cookies ont `maxAge: 15 * 24 * 60 * 60` (1296000 secondes)
3. Attendre 15 jours (ou modifier temporairement la date système)
4. Vérifier que la session expire et redirige vers login

#### **2. Test de Déconnexion**
1. Se connecter à l'application
2. Cliquer sur "Déconnexion" dans le profil
3. Vérifier :
   - ✅ Redirection vers `/login`
   - ✅ Cookies supprimés (vérifier dans DevTools > Application > Cookies)
   - ✅ Log de déconnexion dans les logs serveur

#### **3. Test MAU/DAU**
1. Se connecter avec plusieurs comptes à différentes dates
2. Appeler `/api/dashboard/stats`
3. Vérifier :
   - ✅ `monthlyActiveUsers` compte les utilisateurs avec `lastLogin >= 30 jours`
   - ✅ `dailyActiveUsers` compte les utilisateurs avec `lastLogin >= aujourd'hui`
   - ✅ Les utilisateurs avec session cookie mais `lastLogin` ancien ne sont PAS comptés

---

## 📝 Notes Importantes

### **Sessions vs MAU**

**Confusion courante** :
- ❌ **FAUX** : "Un utilisateur avec une session cookie valide est un MAU"
- ✅ **VRAI** : "Un utilisateur est un MAU s'il s'est connecté dans les 30 derniers jours"

**Explication** :
- Une session cookie peut être valide pendant 15 jours
- Mais si l'utilisateur ne s'est pas connecté dans les 30 derniers jours, il n'est **pas** un MAU
- Le `lastLogin` est mis à jour uniquement lors d'une **connexion réelle** (pas lors du rafraîchissement automatique de session)

### **Rafraîchissement Automatique**

- Les sessions sont rafraîchies automatiquement toutes les 24h (`updateAge: 24 * 60 * 60`)
- Cela ne met **pas** à jour le `lastLogin`
- Le `lastLogin` est mis à jour uniquement lors d'une **authentification complète** (login)

---

## 🚀 Déploiement

### **Checklist de Déploiement**

- [x] ✅ Modifications appliquées dans `auth.ts`
- [x] ✅ API `/api/auth/logout` créée
- [x] ✅ Composant `UserProfile` amélioré
- [x] ✅ Calcul MAU/DAU ajouté dans `/api/dashboard/stats`
- [x] ✅ Build testé et réussi
- [x] ✅ Aucune erreur de linting

### **Variables d'Environnement**

Aucune nouvelle variable d'environnement requise. Les changements utilisent la configuration existante.

---

## 📚 Fichiers Modifiés

1. ✅ `src/lib/auth.ts` - Réduction maxAge à 15 jours
2. ✅ `src/app/api/auth/logout/route.ts` - Nouvelle API de déconnexion
3. ✅ `src/components/dashboard/UserProfile.tsx` - Amélioration handleSignOut
4. ✅ `src/app/api/dashboard/stats/route.ts` - Ajout calcul MAU/DAU

---

## 🎯 Résumé

**3 améliorations majeures** :

1. ✅ **Sessions réduites à 15 jours** → Sécurité renforcée
2. ✅ **Déconnexion améliorée** → Logging et gestion d'erreur robuste
3. ✅ **MAU/DAU calculés** → Métriques précises d'engagement utilisateur

**Tous les changements sont testés et prêts pour le déploiement !** 🚀

---

**Créé le** : 9 novembre 2025  
**Dernière mise à jour** : 9 novembre 2025  
**Version** : 1.0.0

