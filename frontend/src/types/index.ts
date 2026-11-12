export type CapsuleStatus = 'draft' | 'scheduled' | 'delivered' | 'opened' | 'acknowledged';

export type CapsuleType = 
  | 'personal'
  | 'friend'
  | 'batch'
  | 'birthday'
  | 'graduation'
  | 'anniversary'
  | 'milestone';

export interface CapsuleRecipient {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  status: 'pending' | 'delivered' | 'opened' | 'acknowledged';
  notificationAccepted?: boolean;
  acknowledgedAt?: string;
}

export interface CapsuleAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export interface EncryptedKeyEnvelope {
  recipientId: string;
  recipientPublicKeyFingerprint: string;
  encryptedKeyBase64: string;
  algorithm: string;
}

export interface Capsule {
  id: string;
  title: string;
  message: string; // Plaintext when decrypted, or cipher in encrypted view
  ciphertextBase64?: string;
  ivBase64?: string;
  status: CapsuleStatus;
  type: CapsuleType;
  createdAt: string;
  deliveryDate: string; // ISO string
  deliveryTime: string; // e.g. "10:00 AM"
  timezone: string; // e.g. "America/Los_Angeles", "Asia/Kolkata"
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  recipients: CapsuleRecipient[];
  attachments: CapsuleAttachment[];
  keyEnvelopes?: EncryptedKeyEnvelope[];
  isBatch?: boolean;
  batchId?: string;
  batchName?: string;
  cipherAlgorithm?: string;
  cipherFingerprint?: string;
  driveSynced?: boolean;
  driveFolder?: string;
}

export interface NotificationItem {
  id: string;
  type: 'delivery' | 'reminder' | 'acknowledgement' | 'system';
  title: string;
  subtitle?: string;
  message: string;
  capsuleId?: string;
  timestamp: string;
  isRead: boolean;
  imageUrl?: string;
  meta?: {
    attempt?: number;
    maxAttempts?: number;
    cipher?: string;
    actionLabel?: string;
  };
}

export interface MilestoneItem {
  id: string;
  year: number;
  dateStr: string;
  remainingText: string;
  title: string;
  description: string;
  category: 'batch' | 'personal' | 'alumni';
  status: 'past' | 'present' | 'future';
  badgeText: string;
  cipher?: string;
  contributors?: { name: string; initials: string; avatar?: string }[];
  isLocked: boolean;
}

export interface BatchCommunity {
  id: string;
  name: string;
  department: string;
  graduationYear: number;
  convocationDate: string;
  daysRemaining: number;
  totalMembers: number;
  groupVaultsCount: number;
  storageAllocatedGb: number;
  storageMaxGb: number;
  epochId: string;
  members: BatchMember[];
  flagshipCapsule: {
    id: string;
    title: string;
    quote: string;
    unlockEpoch: string;
    timeRemaining: string;
    hash: string;
    contributorsCount: number;
    contributorsAvatars: string[];
    audioUrl?: string;
  };
}

export interface BatchMember {
  id: string;
  name: string;
  rollNumber: string;
  role: 'Cadet Contributor' | 'Class Guardian' | 'Archivist';
  avatar?: string;
  initials: string;
  enrolledAt: string;
  sealedCapsulesCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  department?: string;
  graduationYear?: number;
  isGoogleDriveConnected: boolean;
  googleDriveEmail?: string;
  googleDriveAllocatedBytes: number;
  googleDriveTotalBytes: number;
  publicKeyFingerprint?: string;
}

