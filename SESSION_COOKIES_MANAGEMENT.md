# 🍪 Gestion des Cookies et Sessions - Application Evenzi

**Date** : Décembre 2024  
**Version** : Production

---

## 📊 État Actuel de la Gestion des Sessions

### ✅ **Configuration Actuelle**

L'application utilise **NextAuth.js** avec la stratégie **JWT** pour la gestion des sessions.

#### **Configuration dans `src/lib/auth.ts`** :

```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 jours
}
```

#### **Configuration des Cookies** :

Les cookies sont configurés dans plusieurs endpoints personnalisés :

```typescript
response.cookies.set('next-auth.session-token', sessionToken, {
  httpOnly: true,                    // ✅ Protection XSS
  secure: process.env.NODE_ENV === 'production', // ✅ HTTPS uniquement en prod
  sameSite: 'lax',                  // ✅ Protection CSRF partielle
  maxAge: 30 * 24 * 60 * 60,        // ✅ 30 jours
  path: '/',                        // ✅ Accessible sur tout le site
});
```

---

## 🔍 Analyse Détaillée

### 1. **Persistance de Session**

#### ✅ **OUI - La session persiste après fermeture du navigateur**

**Comment ça fonctionne** :
- NextAuth utilise des **cookies persistants** (pas des session cookies)
- Le cookie `next-auth.session-token` a un `maxAge` de **30 jours**
- Même si l'utilisateur ferme le navigateur, le cookie reste stocké
- À la réouverture, NextAuth lit automatiquement le cookie et restaure la session

#### **Comportement Actuel** :

| Scénario | Comportement | Statut |
|----------|--------------|--------|
| **Fermeture de l'onglet** | Session maintenue | ✅ OK |
| **Fermeture du navigateur** | Session maintenue | ✅ OK |
| **Redémarrage de l'ordinateur** | Session maintenue | ✅ OK |
| **Après 30 jours** | Session expirée, reconnexion requise | ✅ OK |
| **Suppression des cookies** | Reconnexion requise | ✅ Normal |

---

### 2. **Configuration des Cookies NextAuth**

#### **Cookies par Défaut de NextAuth** :

NextAuth crée automatiquement plusieurs cookies :

1. **`next-auth.session-token`** (Production)
   - **Type** : Cookie persistant
   - **Durée** : 30 jours
   - **HttpOnly** : ✅ Oui (protection XSS)
   - **Secure** : ✅ Oui (HTTPS uniquement en production)
   - **SameSite** : `lax` (protection CSRF partielle)

2. **`__Secure-next-auth.session-token`** (Production avec Secure)
   - Même configuration mais avec préfixe `__Secure-`

3. **`next-auth.csrf-token`** (CSRF protection)
   - **Type** : Cookie de session (expire à la fermeture)
   - **HttpOnly** : ✅ Oui
   - **SameSite** : `lax`

#### **⚠️ Configuration Manquante** :

La configuration NextAuth actuelle **ne définit pas explicitement** les options de cookies. NextAuth utilise ses valeurs par défaut, mais on peut les personnaliser.

---

## 🔧 Améliorations Recommandées

### **1. Configuration Explicite des Cookies**

#### **Problème Actuel** :
- Pas de configuration explicite des cookies dans `authOptions`
- NextAuth utilise les valeurs par défaut (qui sont bonnes, mais non personnalisables)

#### **Solution Recommandée** :

Ajouter la configuration des cookies dans `src/lib/auth.ts` :

```typescript
export const authOptions: NextAuthOptions = {
  // ... configuration existante ...
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60,   // Rafraîchir le token toutes les 24h
  },
  
  // ✅ NOUVEAU : Configuration explicite des cookies
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 jours
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  
  // ... reste de la configuration ...
};
```

---

### **2. Fonctionnalité "Se souvenir de moi" (Remember Me)**

#### **État Actuel** :
- ❌ Pas de checkbox "Se souvenir de moi" sur la page de connexion
- ❌ Tous les utilisateurs ont la même durée de session (30 jours)

#### **Solution Recommandée** :

**Option A : Durée de session variable**

```typescript
// Dans src/lib/auth.ts
session: {
  strategy: "jwt",
  maxAge: (rememberMe: boolean) => {
    return rememberMe 
      ? 30 * 24 * 60 * 60  // 30 jours si "Se souvenir"
      : 24 * 60 * 60;      // 24 heures si pas de "Se souvenir"
  },
}
```

**Option B : Checkbox sur la page de login**

```tsx
// Dans src/app/login/page.tsx
const [rememberMe, setRememberMe] = useState(false);

const handleAdminSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = await signIn('credentials', {
    redirect: false,
    email,
    password,
    rememberMe, // Passer l'option
  });
  // ...
};
```

---

### **3. Rafraîchissement Automatique de Session**

#### **État Actuel** :
- ✅ NextAuth rafraîchit automatiquement les sessions
- ⚠️ Pas de configuration explicite de `updateAge`

#### **Recommandation** :

```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,  // 30 jours
  updateAge: 24 * 60 * 60,    // ✅ Rafraîchir toutes les 24h
}
```

**Avantages** :
- Le token JWT est régénéré régulièrement
- Réduction du risque si un token est compromis
- Session reste active si l'utilisateur utilise l'app régulièrement

---

### **4. Gestion de la Déconnexion**

#### **État Actuel** :
- ✅ Fonction `signOut()` disponible
- ⚠️ Pas de vérification si le cookie est bien supprimé

#### **Vérification** :

```typescript
// Dans les composants
import { signOut } from 'next-auth/react';

const handleSignOut = async () => {
  await signOut({ 
    redirect: true,
    callbackUrl: '/login'
  });
  // NextAuth supprime automatiquement les cookies
};
```

---

## 📋 Checklist de Vérification

### ✅ **Ce qui fonctionne actuellement** :

- [x] **Session persiste après fermeture du navigateur** (30 jours)
- [x] **Cookies HttpOnly** (protection XSS)
- [x] **Cookies Secure en production** (HTTPS uniquement)
- [x] **SameSite: lax** (protection CSRF partielle)
- [x] **Rafraîchissement automatique** par NextAuth
- [x] **Déconnexion fonctionnelle** (suppression des cookies)

### ⚠️ **Ce qui peut être amélioré** :

- [ ] **Configuration explicite des cookies** dans authOptions
- [ ] **Fonctionnalité "Se souvenir de moi"** avec durée variable
- [ ] **Configuration updateAge** pour rafraîchissement régulier
- [ ] **Gestion des sessions multiples** (plusieurs onglets)
- [ ] **Détection de session expirée** avec message utilisateur
- [ ] **Logout automatique** après inactivité (optionnel)

---

## 🧪 Tests de Persistance

### **Test 1 : Fermeture et Réouverture**

```bash
1. Se connecter à l'application
2. Vérifier dans DevTools > Application > Cookies :
   - next-auth.session-token existe
   - maxAge = 2592000 (30 jours en secondes)
3. Fermer complètement le navigateur
4. Rouvrir le navigateur
5. Aller sur https://votre-app.vercel.app/dashboard
6. ✅ L'utilisateur doit être toujours connecté
```

### **Test 2 : Vérification du Cookie**

```javascript
// Dans la console du navigateur (F12)
console.log(document.cookie);
// Ne doit PAS afficher next-auth.session-token (HttpOnly)

// Vérifier dans DevTools > Application > Cookies
// Le cookie doit être présent avec :
// - HttpOnly: ✅
// - Secure: ✅ (en production)
// - SameSite: Lax
// - Expires: Dans 30 jours
```

### **Test 3 : Expiration de Session**

```bash
1. Se connecter
2. Modifier manuellement le cookie dans DevTools :
   - Expires: Hier (pour simuler expiration)
3. Recharger la page
4. ✅ L'utilisateur doit être redirigé vers /login
```

---

## 🔒 Sécurité des Cookies

### **Protections Actuelles** :

| Protection | État | Description |
|------------|------|-------------|
| **HttpOnly** | ✅ | Cookie inaccessible via JavaScript (protection XSS) |
| **Secure** | ✅ | Cookie envoyé uniquement via HTTPS en production |
| **SameSite: Lax** | ✅ | Protection CSRF partielle (bloque les requêtes cross-site POST) |
| **Path: /** | ✅ | Cookie accessible sur tout le site |
| **MaxAge: 30 jours** | ✅ | Durée de vie limitée |

### **Recommandations de Sécurité** :

1. **✅ Maintenir HttpOnly** : Ne jamais exposer le token via JavaScript
2. **✅ Maintenir Secure** : HTTPS obligatoire en production
3. **💡 Améliorer SameSite** : Passer à `strict` pour une meilleure protection CSRF (mais peut casser certaines intégrations)
4. **💡 Ajouter Domain** : Si vous avez plusieurs sous-domaines, configurer le domaine explicitement

---

## 📊 Comparaison : Session Cookie vs Persistent Cookie

### **Session Cookie** (expire à la fermeture) :

```typescript
// ❌ PAS utilisé actuellement
maxAge: undefined // ou pas de maxAge
```

**Comportement** :
- ❌ Session perdue à la fermeture du navigateur
- ✅ Plus sécurisé (expire rapidement)
- ❌ Mauvaise UX (reconnexion fréquente)

### **Persistent Cookie** (expire après X jours) :

```typescript
// ✅ Utilisé actuellement
maxAge: 30 * 24 * 60 * 60 // 30 jours
```

**Comportement** :
- ✅ Session maintenue après fermeture
- ✅ Meilleure UX
- ⚠️ Moins sécurisé si le cookie est volé (valide 30 jours)

---

## 🚀 Plan d'Amélioration

### **Phase 1 : Configuration Explicite (Urgent)**

1. ✅ Ajouter configuration `cookies` dans `authOptions`
2. ✅ Configurer `updateAge` pour rafraîchissement régulier
3. ✅ Tester la persistance après fermeture/réouverture

### **Phase 2 : Fonctionnalité "Remember Me" (Important)**

4. ✅ Ajouter checkbox "Se souvenir de moi" sur la page login
5. ✅ Implémenter durée de session variable (24h vs 30 jours)
6. ✅ Tester les deux scénarios

### **Phase 3 : Améliorations UX (Optionnel)**

7. ✅ Détection de session expirée avec message
8. ✅ Logout automatique après inactivité (optionnel, configurable)
9. ✅ Gestion des sessions multiples (plusieurs onglets)

---

## 📝 Code à Implémenter

### **1. Mise à jour de `src/lib/auth.ts`** :

```typescript
export const authOptions: NextAuthOptions = {
  // ... configuration existante ...
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60,   // ✅ NOUVEAU : Rafraîchir toutes les 24h
  },
  
  // ✅ NOUVEAU : Configuration explicite des cookies
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
  
  // ... reste de la configuration ...
};
```

### **2. Ajout "Remember Me" sur la page login** :

```tsx
// Dans src/app/login/page.tsx
const [rememberMe, setRememberMe] = useState(true); // Par défaut activé

// Dans le formulaire
<div className="flex items-center">
  <input
    type="checkbox"
    id="rememberMe"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
    className="mr-2"
  />
  <label htmlFor="rememberMe" className="text-sm">
    Se souvenir de moi (30 jours)
  </label>
</div>
```

---

## ✅ Conclusion

### **État Actuel** :

✅ **La session PERSISTE après fermeture du navigateur**  
✅ **Les cookies sont sécurisés** (HttpOnly, Secure, SameSite)  
✅ **Durée de session : 30 jours**  
✅ **Rafraîchissement automatique** par NextAuth

### **Réponse à votre question** :

**OUI**, l'application gère correctement les cookies et la persistance de session. Si un utilisateur :
1. Se connecte
2. Ferme le navigateur
3. Rouvre le navigateur plus tard (dans les 30 jours)

**Il sera toujours connecté** sans avoir à se reconnecter ! 🎉

### **Améliorations Recommandées** :

1. **Configuration explicite des cookies** (meilleure maintenabilité)
2. **Fonctionnalité "Se souvenir de moi"** (UX améliorée)
3. **Rafraîchissement régulier** (sécurité renforcée)

---

**Dernière mise à jour** : Décembre 2024

