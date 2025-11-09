"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";

interface Sponsor {
  id: string;
  sponsor: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    level: string;
    visible: boolean;
    location?: string;
    email?: string;
    phone?: string;
    mobile?: string;
  };
  addedAt: string;
}

interface SessionSponsorsTabProps {
  sessionId: string;
  eventId: string;
}

const getLevelBadgeClass = (level: string) => {
  const classes: Record<string, string> = {
    PLATINUM: 'bg-gray-100 text-gray-800 border-gray-300',
    GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    SILVER: 'bg-gray-100 text-gray-600 border-gray-300',
    BRONZE: 'bg-orange-100 text-orange-800 border-orange-300',
    PARTNER: 'bg-blue-100 text-blue-800 border-blue-300',
    MEDIA: 'bg-purple-100 text-purple-800 border-purple-300',
    OTHER: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return classes[level] || classes.OTHER;
};

const getLevelText = (level: string) => {
  const levels: Record<string, string> = {
    PLATINUM: 'Platine',
    GOLD: 'Or',
    SILVER: 'Argent', 
    BRONZE: 'Bronze',
    PARTNER: 'Partenaire',
    MEDIA: 'Média',
    OTHER: 'Autre'
  };
  return levels[level] || level;
};

export function SessionSponsorsTab({ sessionId, eventId }: SessionSponsorsTabProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      if (!sessionId || !eventId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/events/${eventId}/sessions/${sessionId}/sponsors`);
        if (response.ok) {
          const data = await response.json();
          setSponsors(data);
        } else {
          console.error('Erreur lors du chargement des sponsors');
          setSponsors([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sponsors:', error);
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [sessionId, eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#81B441] border-r-transparent"></div>
        <span className="ml-3 text-gray-600">Chargement des sponsors...</span>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun sponsor</h3>
        <p className="text-sm text-gray-500">
          Cette session n&apos;est sponsorisée par aucune entreprise pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Sponsors de la session ({sponsors.length})
        </h3>
        <p className="text-sm text-gray-500">
          Entreprises et partenaires qui soutiennent cette session
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sponsors.map((item) => {
          const sponsor = item.sponsor;
          return (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {/* Logo */}
                {sponsor.logo ? (
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 truncate">{sponsor.name}</h4>
                    <Badge
                      className={`ml-2 ${getLevelBadgeClass(sponsor.level)} border`}
                    >
                      {getLevelText(sponsor.level)}
                    </Badge>
                  </div>

                  {sponsor.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {sponsor.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#81B441] hover:text-[#6fa030] hover:underline"
                      >
                        Site web →
                      </a>
                    )}
                    {sponsor.location && (
                      <span className="text-xs text-gray-500">
                        📍 {sponsor.location}
                      </span>
                    )}
                  </div>

                  {(sponsor.email || sponsor.phone) && (
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {sponsor.email && (
                        <div className="flex items-center">
                          <span className="mr-1">✉️</span>
                          <a
                            href={`mailto:${sponsor.email}`}
                            className="hover:text-[#81B441] hover:underline"
                          >
                            {sponsor.email}
                          </a>
                        </div>
                      )}
                      {sponsor.phone && (
                        <div className="flex items-center">
                          <span className="mr-1">📞</span>
                          <a
                            href={`tel:${sponsor.phone}`}
                            className="hover:text-[#81B441] hover:underline"
                          >
                            {sponsor.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

