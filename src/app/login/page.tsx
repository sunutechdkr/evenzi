"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from '@/components/ui/Logo';
import { 
  sanitizeRedirectUrl, 
  canUserAccessUrl, 
  getFinalRedirectUrl,
  logRedirectAttempt 
} from "@/lib/redirectValidation";

function LoginForm() {
  const [activeTab, setActiveTab] = useState<'magic-link' | 'admin'>('magic-link');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkStep, setMagicLinkStep] = useState<'email' | 'otp'>('email'); // Étape pour Magic Link
  const [eventName, setEventName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Récupérer et valider le callbackUrl depuis les query params
  const getCallbackUrl = (): string => {
    const callbackUrl = searchParams?.get('callbackUrl');
    
    if (!callbackUrl) {
      return '/dashboard'; // Fallback par défaut
    }
    
    try {
      const decodedUrl = decodeURIComponent(callbackUrl);
      
      // Nettoyer et valider l'URL
      const cleanUrl = sanitizeRedirectUrl(decodedUrl);
      
      return cleanUrl;
    } catch (error) {
      console.error('Error parsing callbackUrl:', error);
      return '/dashboard';
    }
  };

  // Fonction pour gérer la redirection après connexion
  const handlePostLoginRedirect = async (userRole?: string) => {
    const requestedUrl = getCallbackUrl();
    
    // Si on a le rôle de l'utilisateur, utiliser getFinalRedirectUrl
    if (userRole) {
      const finalUrl = getFinalRedirectUrl(requestedUrl, userRole);
      
      // Logger la tentative de redirection
      logRedirectAttempt(
        requestedUrl, 
        userRole, 
        canUserAccessUrl(finalUrl, userRole)
      );
      
      // Redirection sécurisée
      router.push(finalUrl);
      router.refresh();
    } else {
      // Si pas de rôle, rediriger vers l'URL demandée (sera validée par le middleware)
      router.push(requestedUrl);
      router.refresh();
    }
  };

  // Fonction pour gérer la connexion admin avec identifiants
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }
      
      // Attendre que la session soit mise à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Récupérer le rôle depuis la session ou attendre un peu plus
      let userRole = session?.user?.role;
      
      // Si pas encore disponible, faire une nouvelle tentative
      if (!userRole) {
        await new Promise(resolve => setTimeout(resolve, 500));
        userRole = session?.user?.role || 'USER';
      }
      
      // Rediriger vers l'URL de destination avec validation
      await handlePostLoginRedirect(userRole);
      
    } catch {
      setError("Une erreur s'est produite lors de la connexion");
      setLoading(false);
    }
  };

  // Fonction pour envoyer le code OTP
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
      setError("Veuillez saisir votre adresse email");
      setLoading(false);
      return;
    }

    try {
      // Essayer d'abord avec l'API participant OTP
      const participantResponse = await fetch('/api/auth/participant-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (participantResponse.ok) {
        const data = await participantResponse.json();
        setEventName(data.eventName);
        setSuccess(`Code envoyé ! Vérifiez votre boîte mail.`);
        setMagicLinkStep('otp');
        setLoading(false);
        return;
      }

      // Si participant non trouvé, essayer avec NextAuth Email Provider pour les utilisateurs normaux
      if (participantResponse.status === 404) {
        // Stocker l'email dans sessionStorage
        sessionStorage.setItem('verifyEmail', email);
        
        const result = await signIn('email', {
          email,
          redirect: false,
          callbackUrl: '/dashboard',
        });

        if (result?.error) {
          setError("Aucun compte trouvé avec cet email");
          setLoading(false);
          return;
        }
        
        // Si la requête est réussie, rediriger vers la page de vérification
        router.push('/auth/verify-request');
        return;
      }

      // Autres erreurs
      const errorData = await participantResponse.json();
      setError(errorData.error || "Erreur lors de l'envoi du code");
      setLoading(false);

    } catch (error) {
      setError("Une erreur s'est produite lors de l'envoi du code");
      console.error(error);
      setLoading(false);
    }
  };

  // Fonction pour vérifier le code OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!otpCode || otpCode.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/participant-verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Code validé ! Redirection en cours...");
        
        // Rediriger vers la page de connexion automatique
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        setError(data.error || "Code invalide ou expiré");
        setLoading(false);
      }

    } catch (error) {
      setError("Une erreur s'est produite lors de la vérification du code");
      console.error(error);
      setLoading(false);
    }
  };

  // Fonction pour revenir à l'étape email
  const handleBackToEmail = () => {
    setMagicLinkStep('email');
    setOtpCode("");
    setError("");
    setSuccess("");
  };

  // Fonction pour renvoyer le code
  const handleResendCode = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/auth/participant-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess("Nouveau code envoyé ! Vérifiez votre boîte mail.");
      } else {
        setError("Erreur lors du renvoi du code");
      }
    } catch {
      setError("Erreur lors du renvoi du code");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Theme Toggle */}
      <ThemeToggle className="absolute top-4 right-4 z-50" />
      
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#81B441]/30 to-[#81B441]/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-md"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-[#81B441]/20 to-[#81B441]/5 rounded-full translate-x-1/4 translate-y-1/4 blur-md"></div>
      <div className="absolute top-1/4 right-1/5 w-16 h-16 bg-gradient-to-br from-[#81B441]/15 to-[#81B441]/5 rounded-full blur-md"></div>
      
      {/* Animated stars background */}
      <div className="stars-container absolute inset-0 overflow-hidden opacity-60">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="star absolute rounded-full bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 5 + 5}s`,
            }}
          />
        ))}
      </div>
      
      <div className="w-full max-w-md px-8 py-10 bg-gray-800 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm relative z-10 transform transition-all duration-300 hover:shadow-[0_15px_25px_rgba(0,0,0,0.4)] border border-gray-700">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6 animate-fadeIn">
            <Logo width={150} height={40} color="white" />
          </div>
          <p className="text-gray-400">Connectez-vous à votre compte</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('magic-link')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'magic-link'
                ? 'text-[#81B441] border-b-2 border-[#81B441]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Participant
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'admin'
                ? 'text-[#81B441] border-b-2 border-[#81B441]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-300 border border-red-800 rounded-md text-sm animate-fadeIn">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/50 text-green-300 border border-green-800 rounded-md text-sm animate-fadeIn">
            {success}
          </div>
        )}

        {/* Magic Link Form */}
        {activeTab === 'magic-link' && (
          <>
            {/* Étape 1: Saisie de l'email */}
            {magicLinkStep === 'email' && (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
                <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
                  <label htmlFor="magic-email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent transition-all duration-200 placeholder-gray-500"
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#81B441] to-[#6a9635] hover:from-[#9ccd5b] hover:to-[#81B441] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#81B441] transition-all duration-200 transform hover:scale-[1.02] hover:shadow-[0_5px_15px_rgba(129,180,65,0.4)]"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </span>
                    ) : (
                      "Envoyer le code de connexion"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Étape 2: Saisie du code OTP */}
            {magicLinkStep === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-[#81B441]/20 rounded-full">
                      <svg className="w-8 h-8 text-[#81B441]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Code envoyé !</h3>
                    <p className="text-sm text-gray-400 mb-1">
                      Nous avons envoyé un code à 6 chiffres à
                    </p>
                    <p className="text-sm font-medium text-[#81B441]">{email}</p>
                    {eventName && (
                      <p className="text-xs text-gray-500 mt-2">
                        Événement: {eventName}
                      </p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
                    <label htmlFor="otp-code" className="block text-sm font-medium text-gray-300 mb-1">
                      Code de vérification
                    </label>
                    <input
                      id="otp-code"
                      type="text"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(value);
                      }}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent transition-all duration-200 placeholder-gray-500"
                      placeholder="000000"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Saisissez le code à 6 chiffres reçu par email
                    </p>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#81B441] to-[#6a9635] hover:from-[#9ccd5b] hover:to-[#81B441] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#81B441] transition-all duration-200 transform hover:scale-[1.02] hover:shadow-[0_5px_15px_rgba(129,180,65,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Vérification...
                        </span>
                      ) : (
                        "Vérifier le code"
                      )}
                    </button>
                  </div>
                </form>

                <div className="flex flex-col space-y-3 text-center">
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm text-[#81B441] hover:text-[#9ccd5b] transition-colors duration-200 disabled:opacity-50"
                  >
                    Renvoyer le code
                  </button>
                  
                  <button
                    onClick={handleBackToEmail}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  >
                    ← Modifier l&apos;adresse email
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-6">
          <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
                id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent transition-all duration-200 placeholder-gray-500"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#81B441] focus:border-transparent transition-all duration-200 placeholder-gray-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                  className="h-4 w-4 bg-gray-700 border-gray-600 text-[#81B441] focus:ring-[#81B441] rounded"
              />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Se souvenir de moi
              </label>
            </div>
              <a href="#" className="text-sm text-[#81B441] hover:text-[#9ccd5b] hover:underline transition-colors duration-200">
              Mot de passe oublié?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#81B441] to-[#6a9635] hover:from-[#9ccd5b] hover:to-[#81B441] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[#81B441] transition-all duration-200 transform hover:scale-[1.02] hover:shadow-[0_5px_15px_rgba(129,180,65,0.4)]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </div>
        </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Vous n&apos;avez pas de compte? 
            <a href="#" className="text-[#81B441] hover:text-[#9ccd5b] hover:underline ml-1 transition-colors duration-200">
              Contactez l&apos;administrateur.
            </a>
          </p>
        </div>
      </div>
      
      {/* Add CSS for animated stars */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        .star {
          animation: twinkle infinite;
        }
      `}</style>
    </div>
  );
} 

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
