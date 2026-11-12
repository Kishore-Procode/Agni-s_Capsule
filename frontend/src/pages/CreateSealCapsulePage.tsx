import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCapsules } from '../context/CapsuleContext';
import { useAuth } from '../context/AuthContext';

export const CreateSealCapsulePage: React.FC = () => {
  const navigate = useNavigate();
  const { createAndSealCapsule, saveDraftCapsule } = useCapsules();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [deliveryTime, setDeliveryTime] = useState('10:00 AM');
  const [timezone] = useState('America/Los_Angeles');
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');
  const [isSealing, setIsSealing] = useState(false);
  const [isSealedComplete, setIsSealedComplete] = useState(false);
  const [attachments, setAttachments] = useState<
    { name: string; mimeType: string; sizeBytes: number; url: string }[]
  >([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate dynamic countdown numbers from chosen delivery date
  const targetTime = new Date(`${deliveryDate}T10:00:00Z`).getTime();
  const daysSealed = Math.max(1, Math.round((targetTime - Date.now()) / (1000 * 60 * 60 * 24)));
  const hoursSilent = daysSealed * 24;
  const springCycles = Math.max(1, Math.round(daysSealed / 365));

  const handleLoadSample = () => {
    setTitle(`Letter to the Class of ${user?.graduationYear || 2027} on our 10-Year Reunion`);
    setMessage(
      'Dear friends, as we sit in the quad during our senior spring, remember how terrifying and thrilling this felt. We packed 4 years into shoeboxes, cried during finals, and promised we would never drift. When this seal breaks in the future, I hope you look back at these memories with unconditional pride. Are we where we dreamed we would be?'
    );
    setRecipientEmail(user?.email || 'batch@university.edu');
    setAttachments([
      {
        name: 'Quad_sunset.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 3.4 * 1024 * 1024,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNqM5s_g5ld0ZPPhg_Uiopce67k4bS1_Oa4GSogmzpoRvLEbHI_B4cD8TE1tkM9Fg6oWHHv5v4HcrFYMz1vLCACz9HHIo480KYdoxvJ5O7R0V7IHL0I2F-BtUI2IXEh5oaRFaJv1dTBCrO9_wVAOzXM0Qx2LopVB3CjvFvguPmpKnECoCVXVcomsKD3QXFjpRbJJvOIL4kxCKtLs_mT_EdbTHnmpa3nJZ9mEFPe0DW',
      },
      {
        name: 'Grad_rehearsal.mov',
        mimeType: 'video/mp4',
        sizeBytes: 11.2 * 1024 * 1024,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT70H7-XPF3Lb3Ug9BfBQh2PhMUyZ6VrmtNzWWg9ZzcBNu4O-r8CVoTG8GxGnIr_x94-dxxiWl3V8_uGsYfXcF_-Mm5Rc9qOK9n-hEqf2h3CGaPpZshi2gUCBUeajo7bE-6nHd3M-0tBfo3iPH0WftRXlV1euzKeOVLKp7asMmOrfC10EOP88EvjGowBzD62r9xeUGVTUmmmEEwkG4tnfix4RBdw_fJzc3LpntMjDX',
      },
    ]);
    setValidationError(null);
  };

  const handleSeal = async () => {
    if (!title.trim() || !message.trim()) {
      setValidationError('Please enter both a title and personal message before sealing your capsule.');
      return;
    }

    setValidationError(null);
    setIsSealing(true);
    try {
      await createAndSealCapsule({
        title,
        message,
        type: 'personal',
        deliveryDate: `${deliveryDate}T10:00:00Z`,
        deliveryTime,
        timezone,
        recipients: recipientEmail ? [{ email: recipientEmail, name: recipientEmail.split('@')[0] }] : [],
        attachments,
        isBatch: false,
      });

      setIsSealedComplete(true);
      setTimeout(() => {
        navigate('/capsules');
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsSealing(false);
    }
  };

  const handleSaveDraft = () => {
    if (!title.trim() && !message.trim()) {
      navigate('/capsules');
      return;
    }
    saveDraftCapsule({
      title: title || 'Untitled Chronicle',
      message,
      type: 'personal',
      deliveryDate: `${deliveryDate}T10:00:00Z`,
    });
    navigate('/capsules');
  };

  return (
    <main className="flex flex-col relative w-full px-gutter-mobile md:px-gutter pt-16 md:pt-6 pb-28 md:pb-12 bg-surface flex-1">
      <div className="flex flex-col w-full max-w-4xl mx-auto pb-10">
        {/* Stepper / Archival Progression Ribbon */}
        <div className="w-full bg-surface-container-low px-gutter-mobile py-space-sm mb-space-md shadow-sm rounded-xl border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 opacity-70">
              <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-sm text-label-sm">
                ✓
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Type
              </span>
            </div>
            <div className="h-0.5 w-6 md:w-12 bg-surface-dim"></div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm shadow-sm">
                2
              </span>
              <span className="font-label-md text-label-md text-primary font-bold">
                Compose
              </span>
            </div>
            <div className="h-0.5 w-6 md:w-12 bg-surface-dim"></div>

            <div className="flex items-center gap-1.5 opacity-60">
              <span className="w-5 h-5 rounded-full bg-surface-dim text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                3
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">Release</span>
            </div>
            <div className="h-0.5 w-6 md:w-12 bg-surface-dim"></div>

            <div className="flex items-center gap-1.5 opacity-60">
              <span className="w-5 h-5 rounded-full bg-surface-dim text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                4
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">Seal</span>
            </div>
          </div>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mb-space-md p-space-sm bg-error-container text-on-error-container font-label-md text-label-md rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Capsule Context & Recipients Chips */}
        <div className="flex flex-col gap-space-sm mb-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-xs">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">school</span>
                Class of '{user?.graduationYear ? String(user.graduationYear).slice(-2) : '27'}
              </span>
              <span className="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">
                  verified_user
                </span>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-transparent border-b border-surface-dim focus:outline-none text-xs w-44 font-mono"
                  placeholder="recipient@university.edu"
                />
              </span>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1 text-xs bg-surface-container text-primary rounded-full hover:bg-surface-container-high font-medium border border-surface-container-highest cursor-pointer transition-colors"
            >
              ✨ Load Sample Senior Letter
            </button>
          </div>

          {/* Title Ledger Input */}
          <div className="relative bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-low">
            <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">
                history_edu
              </span>
              Chronicle Title
            </div>
            <input
              className="w-full bg-transparent font-headline-md text-headline-md text-primary focus:outline-none placeholder:text-outline-variant font-medium"
              placeholder="e.g. Letter to Myself on Convocation Day..."
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="h-0.5 w-full bg-surface-container mt-2"></div>
            <div className="flex justify-between items-center mt-2 text-on-surface-variant font-label-sm text-label-sm">
              <span>Author: {user?.fullName || user?.email || 'Cadet'}</span>
              <span className="text-on-tertiary-container font-semibold">
                Target: {new Date(deliveryDate).getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Distraction-Free Rich Manuscript Canvas */}
        <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-md sm:p-space-lg mb-space-md overflow-hidden border border-surface-container-low">
          <div className="absolute right-3 top-3 opacity-10 pointer-events-none select-none">
            <svg className="text-primary" fill="none" height="110" viewBox="0 0 100 100" width="110">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.5"></circle>
              <rect height="36" rx="2" stroke="currentColor" strokeWidth="2" width="50" x="25" y="32"></rect>
              <path d="M25 32 L50 52 L75 32" stroke="currentColor" strokeWidth="2"></path>
              <circle cx="50" cy="52" fill="currentColor" r="7"></circle>
              <path d="M50 18 L50 26 M50 74 L50 82 M18 50 L26 50 M74 50 L82 50" stroke="currentColor" strokeWidth="1.5"></path>
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-low px-space-sm py-1.5 rounded-lg">
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">format_quote</span>
                <span>Parchment Manuscript Mode</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
                AES-256-GCM Armored
              </div>
            </div>

            <div className="font-display-lg-mobile text-headline-lg-mobile text-primary font-serif leading-tight mb-space-sm">
              To who we were, and who we will become:
            </div>

            <textarea
              className="w-full bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none resize-none leading-relaxed tracking-normal min-h-[140px]"
              placeholder="Inscribe your memories, reflections, and predictions for the distant future..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {/* Visual Polaroid Attachment Previews (if attached) */}
            {attachments.length > 0 && (
              <div className="mt-space-md pt-space-sm bg-surface-container-low/50 p-space-sm rounded-xl border border-surface-container">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      collections_bookmark
                    </span>
                    Enclosed Relics ({attachments.length} Items)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="text-error hover:underline text-xs"
                  >
                    Clear Attachments
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-space-sm">
                  {attachments.map((att, i) => (
                    <div key={i} className="bg-surface-container-lowest p-1.5 rounded-lg shadow-sm flex flex-col gap-1 border border-surface-container-low">
                      <img
                        className="w-full h-28 object-cover rounded"
                        alt={att.name}
                        src={att.url}
                      />
                      <div className="flex items-center justify-between px-0.5">
                        <span className="font-label-sm text-label-sm text-on-surface truncate max-w-[120px]">
                          {att.name}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                          photo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Target & Cryptographic Locking Chamber */}
        <div className="bg-primary text-on-primary rounded-xl p-space-md shadow-lg mb-space-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-tertiary-fixed-dim/10 blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between mb-space-md">
            <div>
              <div className="flex items-center gap-1 font-label-sm text-label-sm tracking-widest uppercase text-tertiary-fixed-dim font-bold">
                <span className="material-symbols-outlined text-[14px]">lock_clock</span>
                Target Release Coordinates
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="bg-primary-container text-white text-sm font-serif px-2 py-1 rounded border border-tertiary-fixed-dim/30 focus:outline-none"
                />
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="bg-primary-container text-white text-xs px-2 py-1 rounded border border-tertiary-fixed-dim/30 focus:outline-none w-24"
                />
              </div>
            </div>

            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shadow-inner relative">
              <svg className="w-full h-full p-1" viewBox="0 0 36 36">
                <path
                  className="text-surface-tint"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                ></path>
                <path
                  className="text-tertiary-fixed-dim"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="100, 100"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                ></path>
              </svg>
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim absolute">
                hourglass_top
              </span>
            </div>
          </div>

          {/* Countdown Metric Strip */}
          <div className="grid grid-cols-3 gap-space-xs bg-primary-container/80 p-space-sm rounded-lg mb-space-sm text-center">
            <div className="flex flex-col">
              <span className="font-headline-md text-title-md font-bold text-tertiary-fixed">
                {daysSealed.toLocaleString()}
              </span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase">
                Days Sealed
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-title-md font-bold text-on-primary">
                {hoursSilent.toLocaleString()}
              </span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase">
                Hours Silent
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-title-md font-bold text-on-primary">
                {springCycles}
              </span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase">
                Annual Cycles
              </span>
            </div>
          </div>

          {/* Verification & Delivery Policies */}
          <div className="flex flex-col gap-1.5 pt-space-xs text-primary-fixed-dim font-label-md text-label-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                enhanced_encryption
              </span>
              <span className="text-on-primary truncate">
                AES-256 GCM Client-Side Vault Encryption
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                favorite
              </span>
              <span>Transactional background delivery engine armed</span>
            </div>
          </div>
        </div>

        {/* Primary Action & Sealing Trigger */}
        <div className="flex flex-col gap-space-sm items-center w-full mt-space-xs">
          <button
            type="button"
            onClick={handleSeal}
            disabled={isSealing}
            className="group relative w-full bg-tertiary-container hover:bg-tertiary text-on-tertiary p-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-space-sm overflow-hidden cursor-pointer"
          >
            {isSealing ? (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-[24px] text-tertiary-fixed">
                  progress_activity
                </span>
                <span className="font-title-md text-title-md text-tertiary-fixed font-bold">
                  Stamping Wax Seal &amp; Encrypting...
                </span>
              </div>
            ) : isSealedComplete ? (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-tertiary-fixed-dim">
                  lock
                </span>
                <span className="font-title-md text-title-md text-tertiary-fixed font-bold">
                  Sealed until {new Date(deliveryDate).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-title-md text-title-md font-bold tracking-tight text-tertiary-fixed">
                    Seal Capsule in Time
                  </span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container">
                    Arm cryptographic lock until {new Date(deliveryDate).getFullYear()}
                  </span>
                </div>
                <span className="material-symbols-outlined ml-auto text-[22px] text-tertiary-fixed-dim group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>

          {/* Sub Actions */}
          <div className="flex items-center justify-between w-full px-2 pt-1">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              Save Draft to Vault
            </button>
            <button
              type="button"
              onClick={() => navigate('/capsules')}
              className="font-label-md text-label-md text-error hover:opacity-80 transition-opacity cursor-pointer"
            >
              Discard Chronicle
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
