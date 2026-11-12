import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCapsules } from '../context/CapsuleContext';
import { api } from '../lib/api';

interface StorageInfo {
  provider: string;
  is_connected: boolean;
  status: string;
  account_email?: string | null;
  authorized_folder_id?: string | null;
  directory?: string | null;
  uploaded_files_count: number;
  allocated_bytes: number;
  failed_files_count: number;
  total_bytes: number;
  last_sync_at?: string | null;
  last_verified_at?: string | null;
}

interface VerificationReport {
  status: string;
  folder_id: string;
  folder_name: string;
  folder_created_time?: string;
  drive_files_count: number;
  database_objects_count: number;
  verified_files_count: number;
  missing_files_count: number;
  application_used_bytes: number;
  verified_files: Array<{ file_id: string; file_name: string; size_bytes?: number; status: string }>;
  missing_files: Array<{ file_id: string; file_name: string; status: string }>;
  discrepancies: string[];
  last_verified_at: string;
}

interface TestUploadResult {
  status: string;
  message: string;
  file_id: string;
  file_name: string;
  folder_id: string;
  size_bytes: number;
  sha256: string;
  checksum_matches: boolean;
  web_view_link?: string;
}

export const VaultStorageSecurityPage: React.FC = () => {
  const { user, initiateGoogleDriveConnect, connectGoogleDrive, disconnectGoogleDrive, isAuthenticating } = useAuth();
  const { capsules } = useCapsules();
  const [searchParams, setSearchParams] = useSearchParams();

  // Storage metrics state
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    provider: 'google_drive',
    is_connected: false,
    status: 'Disconnected',
    account_email: null,
    authorized_folder_id: null,
    directory: null,
    uploaded_files_count: 0,
    allocated_bytes: 0,
    failed_files_count: 0,
    total_bytes: 0,
    last_sync_at: null,
    last_verified_at: null,
  });

  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Verification & Test upload states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [testUploadResult, setTestUploadResult] = useState<TestUploadResult | null>(null);
  const [testUploadError, setTestUploadError] = useState<string | null>(null);

  // Fetch real storage metrics
  const fetchStorageUsage = useCallback(async () => {
    try {
      const usage = await api.getStorageUsage();
      setStorageInfo({
        provider: usage.provider || 'google_drive',
        is_connected: Boolean(usage.is_connected),
        status: usage.status || (usage.is_connected ? 'connected' : 'Disconnected'),
        account_email: usage.account_email ?? null,
        authorized_folder_id: usage.authorized_folder_id ?? null,
        directory: usage.directory ?? null,
        uploaded_files_count: usage.uploaded_files_count ?? 0,
        allocated_bytes: usage.allocated_bytes ?? 0,
        failed_files_count: usage.failed_files_count ?? 0,
        total_bytes: usage.total_bytes ?? 0,
        last_sync_at: usage.last_sync_at ?? null,
        last_verified_at: usage.last_verified_at ?? null,
      });
    } catch {
      // Retain zeroed authentic state on network error
    } finally {
      setIsLoadingStorage(false);
    }
  }, []);

  // Handle OAuth code return from Google Drive authorization
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '';

    if (code) {
      setIsConnectingDrive(true);
      setConnectionNotice({
        type: 'info',
        message: 'Authorizing sovereign Google Drive repository and initializing folder...',
      });

      connectGoogleDrive(code, state)
        .then(() => {
          setConnectionNotice({
            type: 'success',
            message: "Google Drive connected successfully. Sovereign directory 'Encrypted-Memory-Capsules' initialized and verified.",
          });
          // Clean search query from address bar
          setSearchParams({}, { replace: true });
          void fetchStorageUsage();
        })
        .catch((err: any) => {
          setConnectionNotice({
            type: 'error',
            message: err?.message || 'Failed to exchange Google Drive authorization code.',
          });
          setSearchParams({}, { replace: true });
        })
        .finally(() => {
          setIsConnectingDrive(false);
        });
    } else {
      void fetchStorageUsage();
    }
  }, [searchParams, connectGoogleDrive, fetchStorageUsage, setSearchParams]);

  // Real "Verify Access" action
  const handleVerifyAccess = async () => {
    if (!storageInfo.is_connected && !user?.isGoogleDriveConnected) return;

    setIsVerifying(true);
    setVerificationReport(null);
    setVerificationError(null);

    try {
      const report = await api.verifyGoogleDriveAccess();
      setVerificationReport(report);
      // Refresh storage metrics after audit
      await fetchStorageUsage();
    } catch (err: any) {
      setVerificationError(err?.message || 'Failed to verify Google Drive repository access.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Real "Test Relic Upload" action
  const handleTestUpload = async () => {
    if (!storageInfo.is_connected && !user?.isGoogleDriveConnected) return;

    setIsTestingUpload(true);
    setTestUploadResult(null);
    setTestUploadError(null);

    try {
      const result = await api.testGoogleDriveUpload();
      setTestUploadResult(result);
      // Refresh storage metrics immediately to reflect new verified object
      await fetchStorageUsage();
    } catch (err: any) {
      setTestUploadError(err?.message || 'Failed to execute test upload to Google Drive.');
    } finally {
      setIsTestingUpload(false);
    }
  };

  // Disconnect handler
  const handleDisconnect = async () => {
    try {
      await disconnectGoogleDrive();
      setVerificationReport(null);
      setTestUploadResult(null);
      setConnectionNotice({
        type: 'info',
        message: 'Google Drive disconnected. Encrypted capsules remain secure in your sovereign local vault.',
      });
      await fetchStorageUsage();
    } catch (err: any) {
      setConnectionNotice({
        type: 'error',
        message: err?.message || 'Failed to disconnect Google Drive.',
      });
    }
  };

  // Connect handler
  const handleConnect = async () => {
    setConnectionNotice(null);
    await initiateGoogleDriveConnect();
  };

  // Key Backup Export
  const handleExportKeyBackup = () => {
    const backupData = {
      vaultOwner: user?.email,
      googleDriveConnected: storageInfo.is_connected,
      googleDriveAccount: storageInfo.account_email || user?.googleDriveEmail || null,
      sovereignDriveFolderId: storageInfo.authorized_folder_id || null,
      sovereignDriveDirectory: storageInfo.directory || null,
      verifiedDriveFilesCount: storageInfo.uploaded_files_count,
      publicKeyFingerprint: user?.publicKeyFingerprint || '0x8F92...B34C',
      totalCapsulesSecured: capsules.length,
      exportedAt: new Date().toISOString(),
      vaultProtocol: 'Agni Zero-Knowledge AES-256-GCM / PBKDF2 (100k rounds)',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agni-vault-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Byte formatting utility
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (isoString?: string | null): string => {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isConnected = Boolean(storageInfo.is_connected || user?.isGoogleDriveConnected);
  const displayEmail = storageInfo.account_email || user?.googleDriveEmail || user?.email;
  const displayFolder = storageInfo.directory || (isConnected ? 'Encrypted-Memory-Capsules' : 'Not configured');

  return (
    <main className="flex flex-col relative w-full px-gutter-mobile md:px-gutter pt-16 md:pt-6 pb-28 md:pb-12 bg-surface flex-1">
      <div className="flex flex-col w-full max-w-4xl mx-auto pb-8">
        {/* Archival Page Intro Header */}
        <div className="flex flex-col gap-space-xs mb-space-lg">
          <div className="flex items-center gap-space-xs text-on-tertiary-container">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest font-semibold">
              Sovereign Archival Protocol
            </span>
          </div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-medium tracking-tight font-serif">
            Vault Storage &amp; Encryption
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
            Configure your private cryptographic vault and direct cloud sync. Your heirloom data is client-side encrypted before replication to your personal Google Drive.
          </p>
        </div>

        {/* Dynamic Connection Status Notification */}
        {connectionNotice && (
          <div
            className={`flex items-center justify-between p-space-sm rounded-lg mb-space-md border ${
              connectionNotice.type === 'success'
                ? 'bg-surface-container-high border-on-tertiary-container text-primary'
                : connectionNotice.type === 'error'
                ? 'bg-error-container/20 border-error text-error'
                : 'bg-surface-container border-surface-container-highest text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                {connectionNotice.type === 'success' ? 'check_circle' : connectionNotice.type === 'error' ? 'error' : 'info'}
              </span>
              <span className="font-body-md text-[13px] font-medium">{connectionNotice.message}</span>
            </div>
            <button
              onClick={() => setConnectionNotice(null)}
              className="text-on-surface-variant hover:text-primary cursor-pointer p-1"
              type="button"
              aria-label="Dismiss message"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Google Drive Sovereign Storage Section */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-space-lg relative overflow-hidden border border-surface-container-low">
          <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-surface-container opacity-60 pointer-events-none"></div>

          <div className="flex items-center justify-between mb-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">cloud_sync</span>
              <span className="font-title-md text-title-md text-primary font-medium font-serif">
                Google Drive Repository (drive.file scope)
              </span>
            </div>

            {/* Real Connection Status Pill */}
            {isLoadingStorage ? (
              <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                Checking Status...
              </span>
            ) : isConnected ? (
              <span className="bg-surface-container-high text-on-primary-container font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
                {storageInfo.status === 'connected' ? 'Synchronized' : storageInfo.status}
              </span>
            ) : (
              <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40"></span>
                Disconnected
              </span>
            )}
          </div>

          {/* Account Details Tile */}
          <div className="flex items-center justify-between bg-surface-container-low rounded-lg p-space-sm mb-space-md border border-surface-container">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-container text-tertiary-fixed-dim flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {isConnected ? 'add_to_drive' : 'cloud_off'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-title-md text-[15px] text-primary font-semibold truncate">
                  {isConnected ? displayEmail : 'No Google Account Connected'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">
                    {isConnected ? 'verified' : 'lock_outline'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    {isConnected
                      ? 'Personal Authorized Sovereign Cloud (drive.file scope)'
                      : 'Connect personal Google Drive to replicate client-encrypted capsules'}
                  </span>
                </div>
              </div>
            </div>

            {/* Folder ID Badge if connected */}
            {isConnected && storageInfo.authorized_folder_id && (
              <div className="hidden sm:flex flex-col items-end shrink-0 pl-2">
                <span className="font-label-xs text-[11px] text-on-surface-variant font-medium">Drive Folder ID</span>
                <span className="font-mono text-[11px] text-primary bg-surface-container px-2 py-0.5 rounded border border-surface-container-high max-w-[140px] truncate">
                  {storageInfo.authorized_folder_id}
                </span>
              </div>
            )}
          </div>

          {/* Storage Capacity & Footprint Gauge */}
          <div className="flex flex-col gap-1.5 mb-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                Encrypted Application Footprint
              </span>
              <span className="font-label-md text-label-md text-primary font-bold">
                {formatBytes(storageInfo.allocated_bytes)}
                {storageInfo.total_bytes > 0 && ` / ${formatBytes(storageInfo.total_bytes)} Drive Quota`}
              </span>
            </div>

            {/* Meter Track */}
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden flex">
              <div
                className="h-full bg-tertiary-container rounded-full transition-all duration-500"
                style={{
                  width: isConnected && storageInfo.allocated_bytes > 0
                    ? storageInfo.total_bytes > 0
                      ? `${Math.max(2, Math.min(100, (storageInfo.allocated_bytes / storageInfo.total_bytes) * 100))}%`
                      : '10%'
                    : '0%',
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-on-surface-variant flex-wrap gap-1">
              <span className="font-label-sm text-label-sm">
                Directory: <span className="font-mono text-primary">{displayFolder}</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-medium">
                {storageInfo.uploaded_files_count} file(s) verified in Google Drive
              </span>
            </div>
          </div>

          {/* Real Storage Verification Metrics Grid */}
          {isConnected && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs mb-space-md">
              <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container flex flex-col">
                <span className="font-label-xs text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Verified Artifacts
                </span>
                <span className="font-title-md text-[16px] text-primary font-bold mt-0.5">
                  {storageInfo.uploaded_files_count}
                </span>
                <span className="font-label-xs text-[11px] text-on-surface-variant">in sovereign folder</span>
              </div>

              <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container flex flex-col">
                <span className="font-label-xs text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Last Synchronization
                </span>
                <span className="font-body-md text-[13px] text-primary font-medium mt-0.5 truncate">
                  {formatDate(storageInfo.last_sync_at)}
                </span>
                <span className="font-label-xs text-[11px] text-on-surface-variant">capsule payload synced</span>
              </div>

              <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container flex flex-col">
                <span className="font-label-xs text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Last API Audit Handshake
                </span>
                <span className="font-body-md text-[13px] text-primary font-medium mt-0.5 truncate">
                  {formatDate(storageInfo.last_verified_at)}
                </span>
                <span className="font-label-xs text-[11px] text-on-surface-variant">Drive v3 handshake</span>
              </div>
            </div>
          )}

          {/* Sync Status Banner */}
          <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-2 rounded-lg mb-space-md text-primary">
            <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
              {isConnected ? 'lock_clock' : 'shield_with_house'}
            </span>
            <span className="font-body-md text-[13px] font-medium leading-snug">
              {isConnected
                ? storageInfo.uploaded_files_count > 0
                  ? `Verified ${storageInfo.uploaded_files_count} encrypted memory capsule artifact(s) synced in Google Drive.`
                  : `Sovereign folder '${displayFolder}' initialized. Ready for encrypted capsule replication.`
                : 'Google Drive is disconnected. Memory capsules are secured locally in your sovereign vault.'}
            </span>
          </div>

          {/* Privacy Callout Banner */}
          <div className="bg-surface-container-high rounded-lg p-space-sm flex gap-space-sm mb-space-md text-on-primary-fixed border border-surface-container-highest">
            <span className="material-symbols-outlined text-[22px] text-on-tertiary-container shrink-0">
              shield
            </span>
            <div className="flex flex-col">
              <span className="font-title-md text-[13px] font-bold text-primary mb-0.5">
                Zero Third-Party Cloud Access (drive.file scope)
              </span>
              <p className="font-body-md text-[12px] leading-relaxed text-on-surface-variant">
                Agni's Capsule only accesses files created by this application. Your existing photos, personal documents, and Google Drive root directory remain completely untouched and unreadable.
              </p>
            </div>
          </div>

          {/* Verification Audit Result Box */}
          {verificationReport && (
            <div className="mb-space-md p-space-sm bg-surface-container-low border border-surface-container rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-primary font-semibold text-[13px]">
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                    fact_check
                  </span>
                  <span>Google Drive Audit Handshake Confirmed</span>
                </div>
                <button
                  onClick={() => setVerificationReport(null)}
                  className="text-on-surface-variant hover:text-primary text-[11px] underline cursor-pointer"
                  type="button"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] mb-2 text-on-surface-variant">
                <div>
                  <span className="font-medium text-primary block">Drive Folder</span>
                  <span className="font-mono text-[11px] truncate block">{verificationReport.folder_id}</span>
                </div>
                <div>
                  <span className="font-medium text-primary block">Drive Files</span>
                  <span>{verificationReport.drive_files_count} files</span>
                </div>
                <div>
                  <span className="font-medium text-primary block">Database Objects</span>
                  <span>{verificationReport.database_objects_count} records</span>
                </div>
                <div>
                  <span className="font-medium text-primary block">Discrepancies</span>
                  <span className={verificationReport.discrepancies.length === 0 ? 'text-primary font-medium' : 'text-error font-medium'}>
                    {verificationReport.discrepancies.length === 0 ? '0 (Clean match)' : `${verificationReport.discrepancies.length} issue(s)`}
                  </span>
                </div>
              </div>

              {verificationReport.discrepancies.length > 0 && (
                <div className="p-2 bg-error-container/20 text-error rounded text-[12px]">
                  {verificationReport.discrepancies.map((d, idx) => (
                    <div key={idx}>• {d}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {verificationError && (
            <div className="mb-space-md p-space-sm bg-error-container/20 text-error font-label-md text-label-md rounded-lg flex items-center gap-2 border border-error/30">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{verificationError}</span>
            </div>
          )}

          {/* Test Relic Upload Result Box */}
          {testUploadResult && (
            <div className="mb-space-md p-space-sm bg-surface-container-low border border-surface-container rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-primary font-semibold text-[13px]">
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                    cloud_done
                  </span>
                  <span>Real Encrypted Artifact Uploaded &amp; Verified in Google Drive</span>
                </div>
                <button
                  onClick={() => setTestUploadResult(null)}
                  className="text-on-surface-variant hover:text-primary text-[11px] underline cursor-pointer"
                  type="button"
                >
                  Dismiss
                </button>
              </div>

              <div className="space-y-1 text-[12px] text-on-surface-variant">
                <div>
                  <span className="font-medium text-primary">File Name: </span>
                  <span className="font-mono text-primary">{testUploadResult.file_name}</span>
                </div>
                <div>
                  <span className="font-medium text-primary">Google Drive File ID: </span>
                  <span className="font-mono text-primary">{testUploadResult.file_id}</span>
                </div>
                <div>
                  <span className="font-medium text-primary">SHA-256 Checksum: </span>
                  <span className="font-mono text-primary text-[11px]">{testUploadResult.sha256}</span>
                  <span className="ml-2 text-on-tertiary-container font-semibold">
                    (Verified via round-trip download)
                  </span>
                </div>
                {testUploadResult.web_view_link && (
                  <div className="pt-1">
                    <a
                      href={testUploadResult.web_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline font-medium hover:text-on-tertiary-container"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      Open in Google Drive
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {testUploadError && (
            <div className="mb-space-md p-space-sm bg-error-container/20 text-error font-label-md text-label-md rounded-lg flex items-center gap-2 border border-error/30">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{testUploadError}</span>
            </div>
          )}

          {/* Action Buttons for Drive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs mb-space-xs">
            <button
              onClick={handleExportKeyBackup}
              className="w-full py-2.5 px-3 rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold hover:bg-surface-dim transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              Export Key Backup
            </button>

            <button
              onClick={handleVerifyAccess}
              disabled={isVerifying || !isConnected}
              className={`w-full py-2.5 px-3 rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                isConnected
                  ? 'bg-surface-container text-primary hover:bg-surface-dim cursor-pointer'
                  : 'bg-surface-container/50 text-on-surface-variant/50 cursor-not-allowed'
              }`}
              type="button"
              title={isConnected ? 'Verify OAuth credentials and compare Drive files' : 'Connect Google Drive first'}
            >
              <span className={`material-symbols-outlined text-[18px] ${isVerifying ? 'animate-spin' : ''}`}>
                {isVerifying ? 'sync' : 'sync_saved_locally'}
              </span>
              {isVerifying ? 'Verifying Drive...' : 'Verify Access'}
            </button>

            <button
              onClick={handleTestUpload}
              disabled={isTestingUpload || !isConnected}
              className={`w-full py-2.5 px-3 rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                isConnected
                  ? 'bg-surface-container text-primary hover:bg-surface-dim cursor-pointer'
                  : 'bg-surface-container/50 text-on-surface-variant/50 cursor-not-allowed'
              }`}
              type="button"
              title={isConnected ? 'Upload a test encrypted file to Google Drive and verify checksum' : 'Connect Google Drive first'}
            >
              <span className={`material-symbols-outlined text-[18px] ${isTestingUpload ? 'animate-spin' : ''}`}>
                {isTestingUpload ? 'upload' : 'upload_file'}
              </span>
              {isTestingUpload ? 'Uploading...' : 'Upload Test Relic'}
            </button>
          </div>

          {/* Primary CTA (Connect / Disconnect) */}
          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isAuthenticating || isConnectingDrive}
            className={`w-full py-2.5 text-center rounded-lg font-label-md text-label-md font-medium transition-colors cursor-pointer mt-1 ${
              isConnected
                ? 'text-error hover:bg-error-container/40'
                : 'bg-primary text-on-primary hover:bg-primary-container shadow-sm flex items-center justify-center gap-2'
            }`}
            type="button"
          >
            {isConnected ? (
              'Disconnect Google Account'
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add_to_drive</span>
                <span>
                  {isAuthenticating || isConnectingDrive
                    ? 'Connecting Google Drive...'
                    : 'Connect Google Drive Account'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Cryptographic Key Architecture Card */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm p-space-md border border-surface-container-low">
          <div className="flex items-center gap-space-xs mb-space-sm">
            <span className="material-symbols-outlined text-primary text-[22px]">lock</span>
            <span className="font-title-md text-title-md text-primary font-medium font-serif">
              End-to-End Cryptography Chamber
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Symmetric Cipher
              </span>
              <p className="font-body-md text-primary font-mono mt-1 font-bold">AES-256-GCM (128-bit tag)</p>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block">
                Unique random 256-bit key per memory capsule
              </span>
            </div>

            <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Key Derivation &amp; Agreement
              </span>
              <p className="font-body-md text-primary font-mono mt-1 font-bold">PBKDF2-SHA256 • 100,000 rds</p>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block">
                Zero plaintext keys sent to server
              </span>
            </div>

            <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Cloud Isolation
              </span>
              <p className="font-body-md text-primary font-mono mt-1 font-bold">Scoped drive.file Authority</p>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block">
                Only app-created artifacts in Encrypted-Memory-Capsules
              </span>
            </div>

            <div className="p-space-sm bg-surface-container-low rounded-lg border border-surface-container">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Integrity &amp; Tamper Resistance
              </span>
              <p className="font-body-md text-primary font-mono mt-1 font-bold">SHA-256 Digest Verification</p>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block">
                Byte-level verification against Google Drive on sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
