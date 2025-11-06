"use client";

import { XMarkIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { NotificationList } from '@/components/notifications/NotificationList';
import { ParticipantNotificationList } from '@/components/notifications/ParticipantNotificationList';
import { useSession } from 'next-auth/react';

/**
 * Composant NotificationPanel - Panneau de notifications pour Admin
 */
export function AdminNotificationPanel({ 
  show, 
  onClose,
  eventId 
}: { 
  show: boolean, 
  onClose: () => void,
  eventId?: string 
}) {
  const { data: session } = useSession();
  
  if (!session?.user?.id) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {show && (
        <div 
          className="fixed inset-0 bg-black/30 z-30" 
          onClick={onClose}
        ></div>
      )}
      
      {/* Panneau latéral */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-[#212529] shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <NotificationList userId={session.user.id} eventId={eventId} />
          </div>
          
          <div className="p-4 border-t border-white/10">
            <button className="w-full bg-[#81B441]/20 hover:bg-[#81B441]/30 text-[#81B441] font-medium py-2 rounded transition-colors flex justify-center items-center">
              <span>Voir toutes les notifications</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Composant ParticipantNotificationPanel - Panneau de notifications pour Participants
 */
export function ParticipantNotificationPanel({ 
  show, 
  onClose,
  eventId 
}: { 
  show: boolean, 
  onClose: () => void,
  eventId?: string 
}) {
  const { data: session } = useSession();
  
  if (!session?.user?.id) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {show && (
        <div 
          className="fixed inset-0 bg-black/30 z-30" 
          onClick={onClose}
        ></div>
      )}
      
      {/* Panneau latéral */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <ParticipantNotificationList 
              userId={session.user.id} 
              eventId={eventId}
            />
          </div>
          
          <div className="p-4 border-t border-gray-700">
            <button className="w-full bg-[#81B441]/20 hover:bg-[#81B441]/30 text-[#81B441] font-medium py-2 rounded transition-colors flex justify-center items-center">
              <span>Voir toutes les notifications</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

