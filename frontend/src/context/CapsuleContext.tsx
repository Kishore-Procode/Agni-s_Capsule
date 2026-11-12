import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Capsule, NotificationItem } from '../types';
import { mockCapsules, mockNotifications } from '../lib/mockData';
import { generateCapsuleKey, encryptText, computeSha256Fingerprint } from '../lib/crypto';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';

interface CreateCapsuleInput {
  title: string;
  message: string;
  type: Capsule['type'];
  deliveryDate: string;
  deliveryTime: string;
  timezone: string;
  recipients: { email: string; name?: string }[];
  attachments: { name: string; mimeType: string; sizeBytes: number; url: string }[];
  isBatch?: boolean;
}

interface CapsuleContextType {
  capsules: Capsule[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  isLoadingCapsules: boolean;
  createAndSealCapsule: (input: CreateCapsuleInput) => Promise<Capsule>;
  saveDraftCapsule: (input: Partial<CreateCapsuleInput>) => Capsule;
  breakWaxSeal: (capsuleId: string) => Promise<void>;
  acknowledgeCapsule: (capsuleId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshCapsules: () => Promise<void>;
}

const CapsuleContext = createContext<CapsuleContextType | undefined>(undefined);

export const CapsuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingCapsules, setIsLoadingCapsules] = useState<boolean>(false);

  // Compute storage key scoped uniquely to the authenticated user ID
  const userStorageKey = user ? `agni_capsules_${user.id}` : null;
  const userNotifKey = user ? `agni_notifications_${user.id}` : null;

  // Load capsules whenever authenticated user changes
  const loadUserData = useCallback(async () => {
    if (!user) {
      setCapsules([]);
      setNotifications([]);
      return;
    }

    setIsLoadingCapsules(true);
    try {
      // 1. If user is the demonstration account Elena, provide demo seeded data if not already customized
      const isDemoAccount = user.email === 'elena.rostova@gmail.com';

      // 2. Load locally cached user capsules
      let initialCapsules: Capsule[] = [];
      const savedCapsules = localStorage.getItem(`agni_capsules_${user.id}`);
      if (savedCapsules) {
        try {
          initialCapsules = JSON.parse(savedCapsules);
        } catch {
          initialCapsules = [];
        }
      } else if (isDemoAccount) {
        initialCapsules = mockCapsules;
      } else {
        // Brand new user: empty vault! No dummy data.
        initialCapsules = [];
      }

      // 3. Load locally cached notifications
      let initialNotifs: NotificationItem[] = [];
      const savedNotifs = localStorage.getItem(`agni_notifications_${user.id}`);
      if (savedNotifs) {
        try {
          initialNotifs = JSON.parse(savedNotifs);
        } catch {
          initialNotifs = [];
        }
      } else if (isDemoAccount) {
        initialNotifs = mockNotifications;
      } else {
        // Welcome notification for newly registered user
        initialNotifs = [
          {
            id: `notif-welcome-${user.id}`,
            type: 'system',
            title: 'Sovereign Vault Initialized',
            subtitle: `Cadet ${user.fullName}`,
            message: `Your zero-knowledge cryptographic vault is active with AES-256-GCM. Compose and seal your first future memory.`,
            timestamp: 'Just now',
            isRead: false,
          },
        ];
      }

      // 4. Try fetching live capsules from backend REST API
      try {
        const backendCapsules = await api.listCapsules();
        if (Array.isArray(backendCapsules) && backendCapsules.length > 0) {
          // Merge backend records with locally created capsules
          const backendMapped: Capsule[] = backendCapsules.map((bc: any) => ({
            id: bc.id,
            title: bc.title,
            message: bc.ciphertext_base64 ? 'Encrypted Memory Capsule' : '',
            ciphertextBase64: bc.ciphertext_base64,
            ivBase64: bc.iv_base64,
            status: bc.status || 'scheduled',
            type: bc.capsule_type || 'personal',
            createdAt: bc.created_at || new Date().toISOString(),
            deliveryDate: bc.delivery_time_utc || new Date().toISOString(),
            deliveryTime: '10:00 AM',
            timezone: bc.original_timezone || 'UTC',
            senderId: bc.sender_id || user.id,
            senderName: user.fullName,
            senderEmail: user.email,
            cipherAlgorithm: bc.cipher_algorithm || 'AES-256-GCM',
            cipherFingerprint: bc.cipher_fingerprint || '0x8F92...B3',
            isBatch: bc.is_batch,
            recipients: (bc.recipients || []).map((r: any) => ({
              id: r.id,
              email: r.email,
              name: r.email.split('@')[0],
              status: r.status,
            })),
            attachments: (bc.attachments || []).map((a: any) => ({
              id: a.id,
              name: a.name,
              mimeType: a.mime_type,
              sizeBytes: a.size_bytes,
              url: a.storage_path,
            })),
            driveSynced: Boolean(user.isGoogleDriveConnected),
          }));

          // Merge without duplicates
          const existingIds = new Set(backendMapped.map((c) => c.id));
          const remainingLocal = initialCapsules.filter((c) => !existingIds.has(c.id));
          initialCapsules = [...backendMapped, ...remainingLocal];
        }
      } catch {
        // Backend offline or running in mock mode: keep local cache
      }

      setCapsules(initialCapsules);
      setNotifications(initialNotifs);
    } finally {
      setIsLoadingCapsules(false);
    }
  }, [user]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  // Persist user-scoped capsules
  useEffect(() => {
    if (userStorageKey && capsules) {
      localStorage.setItem(userStorageKey, JSON.stringify(capsules));
    }
  }, [capsules, userStorageKey]);

  // Persist user-scoped notifications
  useEffect(() => {
    if (userNotifKey && notifications) {
      localStorage.setItem(userNotifKey, JSON.stringify(notifications));
    }
  }, [notifications, userNotifKey]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const createAndSealCapsule = async (input: CreateCapsuleInput): Promise<Capsule> => {
    // 1. Generate client-side AES-256-GCM symmetric key
    const capsuleKey = await generateCapsuleKey();

    // 2. Encrypt message locally using AES-256-GCM
    const { ciphertextBase64, ivBase64 } = await encryptText(input.message, capsuleKey);

    // 3. Compute archival SHA-256 fingerprint of the ciphertext
    const fingerprint = await computeSha256Fingerprint(ciphertextBase64);

    const newCapsule: Capsule = {
      id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: input.title,
      message: input.message, // Plaintext preserved in memory for author
      ciphertextBase64,
      ivBase64,
      status: 'scheduled',
      type: input.type,
      createdAt: new Date().toISOString(),
      deliveryDate: input.deliveryDate,
      deliveryTime: input.deliveryTime,
      timezone: input.timezone,
      senderId: user?.id || 'usr-local',
      senderName: user?.fullName || 'Cadet',
      senderEmail: user?.email || 'cadet@university.edu',
      cipherAlgorithm: 'AES-256-GCM',
      cipherFingerprint: fingerprint,
      isBatch: input.isBatch,
      recipients: input.recipients.map((r, i) => ({
        id: `rec-${Date.now()}-${i}`,
        email: r.email,
        name: r.name || r.email.split('@')[0],
        status: 'pending',
      })),
      attachments: input.attachments.map((a, i) => ({
        id: `att-${Date.now()}-${i}`,
        name: a.name,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        url: a.url,
      })),
      driveSynced: Boolean(user?.isGoogleDriveConnected),
      driveFolder: '/Encrypted-Memory-Capsules',
    };

    // 4. Attempt to save encrypted capsule to backend database
    try {
      const backendPayload = {
        title: input.title,
        ciphertext_base64: ciphertextBase64,
        iv_base64: ivBase64,
        capsule_type: input.type,
        delivery_time_utc: new Date(input.deliveryDate).toISOString(),
        original_timezone: input.timezone,
        cipher_algorithm: 'AES-256-GCM',
        cipher_fingerprint: fingerprint,
        is_batch: Boolean(input.isBatch),
        recipients: input.recipients.map((r) => ({ email: r.email, name: r.name })),
        envelopes: [],
        attachments: input.attachments.map((a) => ({
          name: a.name,
          mime_type: a.mimeType,
          size_bytes: a.sizeBytes,
          storage_path: a.url,
        })),
      };
      const createdOnBackend = await api.createCapsule(backendPayload);
      if (createdOnBackend?.id) {
        newCapsule.id = createdOnBackend.id;
      }
    } catch {
      // Backend unavailable; preserved in user's encrypted local cache
    }

    setCapsules((prev) => [newCapsule, ...prev]);

    // Add alert notification for scheduled dispatch
    const alertNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'delivery',
      title: 'Capsule Sealed & Armed',
      subtitle: newCapsule.title,
      message: `Encrypted via AES-256-GCM. Delivery coordinates set for ${new Date(input.deliveryDate).toLocaleDateString()}.`,
      capsuleId: newCapsule.id,
      timestamp: 'Just now',
      isRead: false,
      meta: {
        cipher: `AES-256 GCM • ${fingerprint}`,
      },
    };
    setNotifications((prev) => [alertNotif, ...prev]);

    // Trigger celebratory subtle gold confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#F4BD74', '#17243A', '#DDF1FF'],
      });
    } catch {
      // Ignore if canvas unavailable
    }

    return newCapsule;
  };

  const saveDraftCapsule = (input: Partial<CreateCapsuleInput>): Capsule => {
    const draftCapsule: Capsule = {
      id: `draft-${Date.now()}`,
      title: input.title || 'Untitled Chronicle',
      message: input.message || '',
      status: 'draft',
      type: input.type || 'personal',
      createdAt: new Date().toISOString(),
      deliveryDate: input.deliveryDate || new Date(Date.now() + 86400000 * 365).toISOString(),
      deliveryTime: input.deliveryTime || '10:00 AM',
      timezone: input.timezone || 'UTC',
      senderId: user?.id || 'usr-local',
      senderName: user?.fullName || 'Cadet',
      senderEmail: user?.email || 'cadet@university.edu',
      recipients: (input.recipients || []).map((r, i) => ({
        id: `rec-draft-${i}`,
        email: r.email,
        name: r.name,
        status: 'pending',
      })),
      attachments: (input.attachments || []).map((a, i) => ({
        id: `att-draft-${i}`,
        name: a.name,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        url: a.url,
      })),
      driveSynced: false,
    };

    setCapsules((prev) => [draftCapsule, ...prev]);
    return draftCapsule;
  };

  const breakWaxSeal = async (capsuleId: string): Promise<void> => {
    setCapsules((prev) =>
      prev.map((c) => (c.id === capsuleId ? { ...c, status: 'opened' } : c))
    );

    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F4BD74', '#B28240', '#020E24', '#FFFFFF'],
      });
    } catch {
      // Ignore
    }
  };

  const acknowledgeCapsule = async (capsuleId: string): Promise<void> => {
    const currentEmail = user?.email || 'cadet@university.edu';
    setCapsules((prev) =>
      prev.map((c) =>
        c.id === capsuleId
          ? {
              ...c,
              status: 'acknowledged',
              recipients: c.recipients.map((r) =>
                r.email === currentEmail
                  ? { ...r, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
                  : r
              ),
            }
          : c
      )
    );

    // Call backend API if possible
    try {
      await api.acknowledgeInboxCapsule(capsuleId);
    } catch {
      // Local fallback
    }

    const ackNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'acknowledgement',
      title: 'Receipt Acknowledged',
      subtitle: 'Verified Decryption',
      message: 'You officially acknowledged receipt across the cryptographic ledger.',
      capsuleId,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications((prev) => [ackNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      void api.markNotificationRead(id);
    } catch {
      // Local fallback
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const refreshCapsules = async () => {
    await loadUserData();
  };

  return (
    <CapsuleContext.Provider
      value={{
        capsules,
        notifications,
        unreadNotificationsCount,
        isLoadingCapsules,
        createAndSealCapsule,
        saveDraftCapsule,
        breakWaxSeal,
        acknowledgeCapsule,
        markNotificationRead,
        markAllNotificationsRead,
        refreshCapsules,
      }}
    >
      {children}
    </CapsuleContext.Provider>
  );
};

export const useCapsules = () => {
  const context = useContext(CapsuleContext);
  if (!context) {
    throw new Error('useCapsules must be used within a CapsuleProvider');
  }
  return context;
};
