'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Headphones,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SupportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simuler l'envoi (dans une vraie app, appeler une API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Votre message a été envoyé ! Nous vous répondrons sous 24h.');
      setForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-[#81B441]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Titre de la page */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-[#81B441]/10 rounded-full">
              <Headphones className="h-10 w-10 text-[#81B441]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Centre de Support
          </h1>
          <p className="text-lg text-gray-600">
            Notre équipe est là pour vous aider
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Moyens de contact */}
          <Card className="border-2 border-gray-100">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600 text-sm mb-3">
                Réponse sous 24h
              </p>
              <a 
                href="mailto:support@evenzi.io"
                className="text-[#81B441] hover:underline font-medium"
              >
                support@evenzi.io
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600 text-sm mb-3">
                Lun-Ven 9h-18h
              </p>
              <a 
                href="tel:+33123456789"
                className="text-[#81B441] hover:underline font-medium"
              >
                +33 1 23 45 67 89
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Live</h3>
              <p className="text-gray-600 text-sm mb-3">
                Disponible 24/7
              </p>
              <button className="text-[#81B441] hover:underline font-medium">
                Démarrer un chat
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire de contact */}
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Send className="h-6 w-6 mr-2 text-[#81B441]" />
              Envoyer un message
            </CardTitle>
            <CardDescription>
              Décrivez votre problème et nous vous répondrons rapidement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="jean.dupont@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Problème de connexion"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Décrivez votre problème en détail..."
                  rows={6}
                  required
                  className="resize-none"
                />
              </div>

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#81B441] hover:bg-[#6a9636] py-6 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <Card className="mt-6 border-2 border-[#81B441]/20 bg-[#81B441]/5">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-700 mb-4">
              Consultez notre <button onClick={() => router.push('/faq')} className="text-[#81B441] font-semibold hover:underline">FAQ</button> pour des réponses rapides aux questions courantes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

