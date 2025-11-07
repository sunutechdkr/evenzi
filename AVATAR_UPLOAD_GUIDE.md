# 📸 Guide Upload Avatar - Diagnostic & Configuration

## 🎯 Résumé

Le système d'upload d'avatar fonctionne avec **deux modes** :
1. **Vercel Blob** (recommandé pour production)
2. **Stockage Local** (fallback automatique si Blob non configuré)

---

## 🔧 Configuration Vercel Blob (Recommandé)

### 1. Activer Vercel Blob Storage

#### Via le Dashboard Vercel :
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `inevent`
3. Onglet **Storage** > **Create Store**
4. Choisissez **Blob**
5. Connectez-le à votre projet

#### Automatique :
Vercel créera automatiquement la variable d'environnement `BLOB_READ_WRITE_TOKEN`.

### 2. Vérifier la configuration

Dans les **Environment Variables** de votre projet Vercel :
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

✅ **Redéployez** votre application après configuration.

---

## 📁 Stockage Local (Fallback)

### Fonctionnement

Si `BLOB_READ_WRITE_TOKEN` n'est pas défini, le système utilise automatiquement le stockage local :
- **Upload** : `/public/uploads/avatars/`
- **URL** : `/uploads/avatars/filename.jpg`

### Prérequis Local

Le dossier doit exister et être accessible en écriture :

```bash
mkdir -p public/uploads/avatars
chmod 755 public/uploads/avatars
```

### ⚠️ Limitations du stockage local

- ❌ **Pas persistant sur Vercel** (fichiers perdus au redéploiement)
- ❌ Ne fonctionne qu'en développement local
- ✅ Idéal pour le développement et les tests

---

## 🧪 Tester l'upload d'avatar

### 1. Vérifier les logs de la console

Lors d'un upload, vous devriez voir :

```
📸 Fichier sélectionné: avatar.jpg Taille: 245.67 KB
🚀 Début upload avatar...
📁 Upload avatar vers Vercel Blob: avatars/avatar_1699999999999.jpg
✅ Avatar uploadé vers Blob: https://xxx.vercel-storage.com/avatars/xxx.jpg
✅ Upload avatar terminé avec succès
```

Ou si Blob n'est pas configuré :

```
📸 Fichier sélectionné: avatar.jpg Taille: 245.67 KB
🚀 Début upload avatar...
📁 Upload avatar vers stockage local (Blob non configuré)
✅ Avatar uploadé localement: /uploads/avatars/xxx.jpg
✅ Upload avatar terminé avec succès
```

### 2. Vérifier l'API directement

#### Test avec curl (nécessite une session active) :

```bash
# Créer un fichier test
echo "test" > test.jpg

# Upload (remplacer le cookie par votre session NextAuth)
curl -X POST http://localhost:3000/api/user/upload-avatar \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "avatar=@test.jpg"
```

#### Réponse attendue :

```json
{
  "message": "Avatar mis à jour avec succès",
  "user": {
    "id": "xxx",
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "image": "https://xxx.vercel-storage.com/avatars/xxx.jpg"
  },
  "imageUrl": "https://xxx.vercel-storage.com/avatars/xxx.jpg"
}
```

### 3. Vérifier que l'avatar s'affiche

Après upload :
1. L'avatar doit apparaître immédiatement dans le profil
2. L'avatar doit apparaître dans le sidebar header
3. La session NextAuth doit être mise à jour

---

## ⚠️ Problèmes courants

### 1. "Le fichier est trop volumineux (max 1MB)"

**Cause** : Le fichier dépasse 1MB  
**Solution** : Compressez votre image avant upload

```bash
# Compresser avec ImageMagick
convert avatar.jpg -quality 85 -resize 500x500 avatar_compressed.jpg
```

### 2. "Vercel Blob: No token found"

**Cause** : `BLOB_READ_WRITE_TOKEN` non défini  
**Solution** :
- Configurez Vercel Blob (voir ci-dessus)
- **OU** laissez le fallback local s'activer automatiquement

### 3. L'avatar ne s'affiche pas après upload

**Causes possibles** :
- Cache du navigateur
- Session NextAuth pas mise à jour
- URL de l'avatar incorrecte

**Solutions** :
```javascript
// Forcer le rechargement
window.location.reload();

// Ou vider le cache
// Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)
```

### 4. Upload échoue en production Vercel

**Causes** :
- Variables d'environnement manquantes
- Blob Storage non activé

**Solution** :
1. Vérifier les variables d'environnement sur Vercel
2. Activer Blob Storage dans le dashboard
3. Redéployer l'application

---

## 📊 Limites

| Critère | Valeur |
|---------|--------|
| **Taille max fichier** | 1 MB |
| **Formats acceptés** | JPEG, JPG, PNG, WebP |
| **Stockage Blob** | 10 GB gratuit (puis $0.15/GB) |
| **Bande passante Blob** | 100 GB gratuit (puis $0.10/GB) |

---

## 🔍 Diagnostic complet

### Script de test (à exécuter dans la console développeur) :

```javascript
// Tester l'upload d'avatar
const testAvatarUpload = async () => {
  console.log('🧪 Test upload avatar...');
  
  // 1. Vérifier que l'utilisateur est connecté
  const session = await fetch('/api/auth/session').then(r => r.json());
  console.log('Session:', session);
  
  if (!session?.user) {
    console.error('❌ Non connecté');
    return;
  }
  
  // 2. Créer un fichier test
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#81B441';
  ctx.fillRect(0, 0, 200, 200);
  
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('avatar', blob, 'test-avatar.jpg');
    
    console.log('📤 Envoi fichier test...');
    
    const response = await fetch('/api/user/upload-avatar', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Résultat:', result);
    
    if (response.ok) {
      console.log('✅ Upload réussi !');
      console.log('URL avatar:', result.imageUrl);
    } else {
      console.error('❌ Erreur:', result.error);
    }
  }, 'image/jpeg', 0.9);
};

testAvatarUpload();
```

---

## 🚀 Déploiement

### Checklist avant déploiement :

- [ ] Vercel Blob Storage activé
- [ ] `BLOB_READ_WRITE_TOKEN` configuré (Production + Preview)
- [ ] Variables d'environnement vérifiées
- [ ] Test upload en local réussi
- [ ] Test upload sur preview Vercel réussi

### Après déploiement :

1. Testez l'upload sur l'URL de production
2. Vérifiez que l'avatar s'affiche correctement
3. Testez la suppression d'avatar
4. Vérifiez les logs Vercel pour erreurs éventuelles

---

## 📞 Support

En cas de problème persistant :

1. **Vérifiez les logs Vercel** : Dashboard > Deployments > Logs
2. **Vérifiez la console du navigateur** : F12 > Console
3. **Testez l'API directement** avec curl/Postman
4. **Contactez le support** : Les logs détaillés aident au diagnostic

---

## ✅ Résumé de l'architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│  handleFileSelect() → uploadAvatar() → FormData     │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/user/upload-avatar
                       ↓
┌─────────────────────────────────────────────────────┐
│              API Route (Next.js)                    │
│  1. Authentification (NextAuth)                     │
│  2. Validation fichier (taille, type)               │
│  3. Vérification BLOB_READ_WRITE_TOKEN              │
└──────────────────────┬──────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       │                               │
       ↓                               ↓
┌─────────────┐              ┌──────────────────┐
│ Vercel Blob │              │ Stockage Local   │
│  (si token) │              │  (fallback)      │
└─────────────┘              └──────────────────┘
       │                               │
       └───────────────┬───────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│              Database (Prisma)                      │
│  user.image = avatarUrl                             │
└─────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│         NextAuth Session Update                     │
│  session.user.image = avatarUrl                     │
└─────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│              UI Refresh                             │
│  Avatar s'affiche automatiquement                   │
└─────────────────────────────────────────────────────┘
```

---

**✨ L'upload d'avatar est maintenant fonctionnel avec fallback automatique !**

