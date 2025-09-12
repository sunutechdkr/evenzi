#!/usr/bin/env node

/**
 * TEST DE CORRECTION DU LOGIN EVENZI
 * Vérification que le problème Prisma P6001 est résolu
 */

const https = require('https');

const PROD_URL = 'https://studio.evenzi.io';

console.log('🔧 TEST DE CORRECTION DU LOGIN EVENZI');
console.log('=====================================');
console.log('URL testée:', PROD_URL);
console.log('');

// Fonction pour faire des requêtes HTTP
function makeRequest(url, method = 'GET', headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Login-Test/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test des endpoints critiques
async function testCriticalEndpoints() {
  console.log('🧪 TEST DES ENDPOINTS CRITIQUES');
  console.log('=================================');
  
  const tests = [
    {
      name: 'Page d\'accueil',
      url: `${PROD_URL}/`,
      expectedStatus: 200
    },
    {
      name: 'Page de connexion',
      url: `${PROD_URL}/auth/signin`,
      expectedStatus: 200
    },
    {
      name: 'API Auth Providers',
      url: `${PROD_URL}/api/auth/providers`,
      expectedStatus: 200
    },
    {
      name: 'API Events (sans auth)',
      url: `${PROD_URL}/api/events`,
      expectedStatus: 401, // Doit être non autorisé, pas d'erreur Prisma
      shouldNotContain: ['P6001', 'prisma://', 'Data Proxy']
    },
    {
      name: 'API Dashboard Stats (sans auth)',
      url: `${PROD_URL}/api/dashboard/stats`,
      expectedStatus: 401,
      shouldNotContain: ['P6001', 'prisma://', 'Data Proxy']
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    
    try {
      const response = await makeRequest(test.url);
      
      // Vérifier le status code
      if (response.statusCode === test.expectedStatus) {
        console.log(`   ✅ Status: ${response.statusCode} (attendu: ${test.expectedStatus})`);
      } else {
        console.log(`   ❌ Status: ${response.statusCode} (attendu: ${test.expectedStatus})`);
        allTestsPassed = false;
      }
      
      // Vérifier que certains termes ne sont PAS présents
      if (test.shouldNotContain) {
        const responseText = response.data.toLowerCase();
        let foundForbiddenTerms = [];
        
        for (const term of test.shouldNotContain) {
          if (responseText.includes(term.toLowerCase())) {
            foundForbiddenTerms.push(term);
          }
        }
        
        if (foundForbiddenTerms.length === 0) {
          console.log(`   ✅ Pas d'erreurs Prisma détectées`);
        } else {
          console.log(`   ❌ Erreurs Prisma détectées: ${foundForbiddenTerms.join(', ')}`);
          console.log(`   Réponse: ${response.data.substring(0, 200)}...`);
          allTestsPassed = false;
        }
      }
      
      // Afficher un échantillon de la réponse pour les APIs
      if (test.url.includes('/api/')) {
        const preview = response.data.substring(0, 100);
        console.log(`   📄 Réponse: ${preview}${response.data.length > 100 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERREUR: ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

// Test de performance basique
async function testPerformance() {
  console.log('\n⚡ TEST DE PERFORMANCE');
  console.log('======================');
  
  const endpoint = `${PROD_URL}/auth/signin`;
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(endpoint);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`🔍 Endpoint: ${endpoint}`);
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Temps de réponse: ${responseTime}ms`);
    
    if (responseTime < 2000) {
      console.log(`   ✅ Performance excellente (< 2s)`);
      return true;
    } else if (responseTime < 5000) {
      console.log(`   ⚠️  Performance acceptable (< 5s)`);
      return true;
    } else {
      console.log(`   ❌ Performance dégradée (> 5s)`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ ERREUR: ${error.message}`);
    return false;
  }
}

// Test des logs Vercel (simulation)
async function testForPrismaErrors() {
  console.log('\n🔍 VÉRIFICATION ABSENCE ERREURS PRISMA');
  console.log('======================================');
  
  // Test plusieurs endpoints qui utilisaient Prisma
  const prismaEndpoints = [
    `${PROD_URL}/api/events`,
    `${PROD_URL}/api/dashboard/stats`,
    `${PROD_URL}/api/users`
  ];
  
  let noPrismaErrors = true;
  
  for (const endpoint of prismaEndpoints) {
    console.log(`\n🔍 Test: ${endpoint}`);
    
    try {
      const response = await makeRequest(endpoint);
      const responseText = response.data.toLowerCase();
      
      // Chercher les erreurs Prisma spécifiques
      const prismaErrorPatterns = [
        'p6001',
        'prisma://',
        'data proxy',
        'invalid `prisma',
        'prisma client'
      ];
      
      let foundErrors = [];
      for (const pattern of prismaErrorPatterns) {
        if (responseText.includes(pattern)) {
          foundErrors.push(pattern);
        }
      }
      
      if (foundErrors.length === 0) {
        console.log(`   ✅ Aucune erreur Prisma détectée`);
        console.log(`   📊 Status: ${response.statusCode}`);
      } else {
        console.log(`   ❌ Erreurs Prisma trouvées: ${foundErrors.join(', ')}`);
        console.log(`   📄 Réponse: ${response.data.substring(0, 300)}...`);
        noPrismaErrors = false;
      }
      
    } catch (error) {
      console.log(`   ⚠️  Erreur réseau: ${error.message}`);
    }
  }
  
  return noPrismaErrors;
}

// Fonction principale
async function runLoginFixTest() {
  console.log('🚀 DÉMARRAGE DU TEST DE CORRECTION');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('');
  
  try {
    const endpointsTest = await testCriticalEndpoints();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const performanceTest = await testPerformance();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const prismaTest = await testForPrismaErrors();
    
    console.log('\n🎯 RÉSUMÉ DU TEST DE CORRECTION');
    console.log('===============================');
    
    if (endpointsTest) {
      console.log('✅ Endpoints critiques: FONCTIONNELS');
    } else {
      console.log('❌ Endpoints critiques: PROBLÈMES DÉTECTÉS');
    }
    
    if (performanceTest) {
      console.log('✅ Performance: ACCEPTABLE');
    } else {
      console.log('❌ Performance: DÉGRADÉE');
    }
    
    if (prismaTest) {
      console.log('✅ Erreurs Prisma P6001: CORRIGÉES');
    } else {
      console.log('❌ Erreurs Prisma P6001: TOUJOURS PRÉSENTES');
    }
    
    console.log('');
    
    if (endpointsTest && performanceTest && prismaTest) {
      console.log('🎉 CORRECTION DU LOGIN: RÉUSSIE !');
      console.log('✅ L\'application est maintenant fonctionnelle');
      console.log('✅ Le problème Prisma P6001 est résolu');
      console.log('✅ Les APIs retournent des erreurs d\'authentification normales');
      console.log('');
      console.log('🔗 Application accessible sur: https://studio.evenzi.io');
    } else {
      console.log('⚠️  CORRECTION PARTIELLE');
      console.log('Certains problèmes persistent, vérification manuelle recommandée.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le test
if (require.main === module) {
  runLoginFixTest();
}

module.exports = { runLoginFixTest };
