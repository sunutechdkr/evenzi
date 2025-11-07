"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HomeIcon, ArrowLeftIcon, UserPlusIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// États possibles du formulaire
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// Interface pour les erreurs de champ
interface FieldErrors {
  [key: string]: string;
}

export default function AddParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [participant, setParticipant] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
    type: 'PARTICIPANT',
    ticketId: ''
  });
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Fonction pour récupérer les billets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch(`/api/public/events/${params.id}/tickets`);
      if (response.ok) {
        const data = await response.json();
        const availableTickets = (data.tickets || []).filter(
          ticket => ticket.status === 'ACTIVE' && ticket.visibility === 'VISIBLE'
        );
        setTickets(availableTickets);
        
        // Sélectionner automatiquement le premier billet disponible
        if (availableTickets.length > 0) {
          setParticipant(prev => ({
            ...prev,
            ticketId: availableTickets[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des billets:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Charger les billets au montage du composant
  useEffect(() => {
    fetchTickets();
  }, [params.id]);

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    const errors: FieldErrors = {};
    let isValid = true;

    if (!participant.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
      isValid = false;
    }

    if (!participant.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
      isValid = false;
    }

    if (!participant.email.trim()) {
      errors.email = 'L\'email est requis';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
      errors.email = 'Format d\'email invalide';
      isValid = false;
    }

    if (!participant.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
      isValid = false;
    }

    if (!participant.ticketId.trim()) {
      errors.ticketId = 'Veuillez sélectionner un billet';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Effacer l'erreur lorsqu'un champ est modifié
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    
    setParticipant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si le formulaire est valide
    if (!isFormValid()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setFormStatus('loading');
    
    try {
      // Préparer les données en incluant tous les champs du formulaire
      const payloadData = {
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        phone: participant.phone,
        jobTitle: participant.jobTitle,
        company: participant.company,
        type: participant.type,
        ticketId: participant.ticketId,
      };
      
      // Appeler l&apos;API pour créer un participant
      const response = await fetch(`/api/events/${params.id}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du participant');
      }
      
      // Afficher le succès
      setFormStatus('success');
      toast.success('Participant ajouté avec succès');
      
      // Rediriger après un délai pour montrer l'animation de succès
      setTimeout(() => {
        router.push(`/dashboard/events/${params.id}/participants`);
      }, 1500);
      
    } catch (error) {
      console.error('Erreur:', error);
      setFormStatus('error');
      toast.error('Erreur lors de l&apos;ajout du participant');
      
      // Réinitialiser le statut après un délai
      setTimeout(() => {
        setFormStatus('idle');
      }, 3000);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setParticipant({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      company: '',
      type: 'PARTICIPANT',
      ticketId: ''
    });
    setFieldErrors({});
    setFormStatus('idle');
  };

  // Afficher une notification pour les champs additionnels
  useEffect(() => {
    if (participant.jobTitle || participant.company) {
      toast('Note: Les champs Fonction et Entreprise sont maintenant stockés dans la base de données.', 
        { duration: 5000, id: 'fields-info' });
    }
  }, []);

  return (
    <div className="dashboard-container">
      <EventSidebar eventId={params.id} />
      <div className="dashboard-content">
        <main className="dashboard-main">
          {/* Breadcrumb Navigation */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Accueil
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <Link href={`/dashboard/events/${params.id}/participants`} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Participants
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-sm font-medium text-gray-700">Ajouter</span>
                </div>
              </li>
            </ol>
          </nav>
          
          {/* En-tête de la page */}
          <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-full mr-4">
                <UserPlusIcon className="h-7 w-7 text-[#81B441]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ajouter un participant</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Créez un nouveau participant pour votre événement
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/events/${params.id}/participants`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Retour aux participants</span>
            </Link>
          </div>
          
          {/* État de succès */}
          {formStatus === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-lg flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-green-800">Participant ajouté avec succès!</h3>
                <p className="text-green-700 mt-1">
                  Redirection automatique vers la liste des participants...
                </p>
                <div className="mt-3 flex space-x-3">
                  <button 
                    onClick={resetForm}
                    className="text-sm font-medium text-green-700 hover:text-green-900"
                  >
                    Ajouter un autre participant
                  </button>
                  <Link 
                    href={`/dashboard/events/${params.id}/participants`}
                    className="text-sm font-medium text-green-700 hover:text-green-900"
                  >
                    Voir la liste des participants
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* État d'erreur */}
          {formStatus === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg flex items-center">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-red-800">Erreur lors de l&apos;ajout du participant</h3>
                <p className="text-red-700 mt-1">
                  Veuillez vérifier les informations et réessayer.
                </p>
              </div>
            </div>
          )}
          
          {/* Formulaire d'ajout */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-8 p-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Les champs marqués d&apos;un <span className="text-red-500 font-medium">*</span> sont obligatoires.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Informations personnelles */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Informations personnelles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prénom */}
                  <div className="form-group">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={participant.firstName}
                        onChange={handleInputChange}
                        required
                        className={`block w-full px-4 py-3 border ${
                          fieldErrors.firstName 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-[#81B441] focus:border-[#81B441]'
                        } rounded-lg transition-colors`}
                        placeholder="Prénom du participant"
                      />
                      {fieldErrors.firstName && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600" id="firstName-error">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  
                  {/* Nom */}
                  <div className="form-group">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={participant.lastName}
                        onChange={handleInputChange}
                        required
                        className={`block w-full px-4 py-3 border ${
                          fieldErrors.lastName 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-[#81B441] focus:border-[#81B441]'
                        } rounded-lg transition-colors`}
                        placeholder="Nom du participant"
                      />
                      {fieldErrors.lastName && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600" id="lastName-error">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Coordonnées */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Coordonnées
                </h2>
                <div className="space-y-6">
                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={participant.email}
                        onChange={handleInputChange}
                        required
                        className={`block w-full pl-10 pr-4 py-3 border ${
                          fieldErrors.email 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-[#81B441] focus:border-[#81B441]'
                        } rounded-lg transition-colors`}
                        placeholder="email@exemple.com"
                      />
                      {fieldErrors.email && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600" id="email-error">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Téléphone */}
                    <div className="form-group">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={participant.phone}
                          onChange={handleInputChange}
                          required
                          className={`block w-full pl-10 pr-4 py-3 border ${
                            fieldErrors.phone 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-[#81B441] focus:border-[#81B441]'
                          } rounded-lg transition-colors`}
                          placeholder="+221 XX XXX XX XX"
                        />
                        {fieldErrors.phone && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.phone && (
                        <p className="mt-1 text-sm text-red-600" id="phone-error">
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>
                    
                    {/* Type */}
                    <div className="form-group">
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <select
                          id="type"
                          name="type"
                          value={participant.type}
                          onChange={handleInputChange}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#81B441] focus:border-[#81B441] transition-colors appearance-none bg-none"
                        >
                          <option value="PARTICIPANT">Participant</option>
                          <option value="SPEAKER">Intervenant</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Informations professionnelles */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Informations professionnelles (optionnelles)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fonction */}
                  <div className="form-group">
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Fonction
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={participant.jobTitle}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#81B441] focus:border-[#81B441] transition-colors"
                        placeholder="Directeur, Manager, etc."
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                    </p>
                  </div>
                  
                  {/* Entreprise */}
                  <div className="form-group">
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l&apos;entreprise
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={participant.company}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#81B441] focus:border-[#81B441] transition-colors"
                        placeholder="Nom de la société"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href={`/dashboard/events/${params.id}/participants`}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#81B441] hover:bg-[#72a139] text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B441] flex items-center"
                  disabled={formStatus === 'loading' || formStatus === 'success'}
                >
                  {formStatus === 'loading' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Ajouter le participant
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
} 