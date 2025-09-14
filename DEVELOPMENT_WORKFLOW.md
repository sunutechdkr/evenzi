# 🚀 Workflow de Développement Evenzi

## 📋 Structure des Branches

### **🌟 main** (Production)
- **URL Production** : https://inevent-7a5cvop9z-sunutech.vercel.app
- **Status** : Version stable v1.0.0
- **Protection** : Branche protégée, déploiement automatique sur Vercel
- **Usage** : Uniquement pour les releases stables

### **🔧 preview** (Développement)
- **URL Preview** : https://inevent-[hash]-sunutech.vercel.app (générée automatiquement)
- **Status** : Branche de développement active
- **Déploiement** : Automatique sur chaque push
- **Usage** : Développement et tests de nouvelles fonctionnalités

## ✅ **VARIABLES D'ENVIRONNEMENT CONFIGURÉES**
- Toutes les variables sont maintenant disponibles pour Preview et Production
- DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, RESEND_API_KEY, etc.

## 🔄 Workflow de Développement

### **1. Développement de Nouvelles Fonctionnalités**
```bash
# Basculer sur la branche preview
git checkout preview

# Créer une branche feature (optionnel)
git checkout -b feature/nouvelle-fonctionnalite

# Développer et tester
npm run dev

# Committer les changements
git add .
git commit -m "✨ Nouvelle fonctionnalité"

# Pousser vers preview
git push origin preview
```

### **2. Test en Environnement Preview**
- Vercel déploie automatiquement la branche preview
- Tester toutes les fonctionnalités sur l'URL preview
- Valider les nouvelles features

### **3. Release vers Production**
```bash
# Basculer sur main
git checkout main

# Merger preview dans main
git merge preview

# Créer un nouveau tag de version
git tag -a v1.x.x -m "Release v1.x.x"

# Pousser vers production
git push origin main
git push origin v1.x.x
```

## 🌐 URLs de Déploiement

### **Production (main)**
- **URL** : https://inevent-7a5cvop9z-sunutech.vercel.app
- **Utilisateur Admin** : bouba@evenzi.io / Passer@1ok
- **Base de données** : Production Neon PostgreSQL

### **Preview (preview)**
- **URL** : Générée automatiquement par Vercel
- **Variables d'env** : Partagées avec production
- **Base de données** : Même base que production (attention aux tests)

## ⚠️ Bonnes Pratiques

### **🔒 Protection de la Production**
- Ne jamais pusher directement sur `main`
- Toujours tester sur `preview` avant release
- Créer des tags pour chaque version stable

### **🧪 Tests et Validation**
- Tester toutes les APIs critiques sur preview
- Valider l'authentification
- Vérifier les nouvelles fonctionnalités

### **📦 Gestion des Versions**
- **v1.0.0** : Version stable actuelle
- **v1.1.0** : Prochaine version avec nouvelles features
- **v1.0.x** : Hotfixes de la v1.0.0

## 🛠️ Commandes Utiles

```bash
# Voir toutes les branches
git branch -a

# Voir les tags
git tag -l

# Revenir à une version spécifique
git checkout v1.0.0

# Voir les différences entre branches
git diff main..preview

# Voir l'historique des commits
git log --oneline --graph
```

## 📞 Support

- **Repository** : https://github.com/sunutechdkr/evenzi
- **Issues** : https://github.com/sunutechdkr/evenzi/issues
- **Vercel Dashboard** : https://vercel.com/sunutech/inevent
