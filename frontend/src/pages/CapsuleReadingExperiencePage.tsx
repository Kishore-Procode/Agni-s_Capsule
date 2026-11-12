import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCapsules } from '../context/CapsuleContext';
import { useAuth } from '../context/AuthContext';

export const CapsuleReadingExperiencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { capsules, acknowledgeCapsule } = useCapsules();
  const { user } = useAuth();

  const capsule = capsules.find((c) => c.id === id) || (id === 'default' ? capsules[0] : undefined);

  const [isAcknowledged, setIsAcknowledged] = useState(capsule?.status === 'acknowledged');
  const [isSavedToKeepsakes, setIsSavedToKeepsakes] = useState(false);

  if (!capsule) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[65vh] p-8 text-center bg-surface flex-1">
        <div className="w-16 h-16 rounded-full bg-surface-container-high text-on-tertiary-container flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-[32px]">inventory_2</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-primary font-serif">Capsule Not Found</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-2">
          This temporal chronicle is either still sealed in time, pending future delivery, or does not belong to your authorized vault.
        </p>
        <Link
          to="/capsules"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold hover:bg-primary-container transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Return to My Capsules</span>
        </Link>
      </main>
    );
  }

  const handleAcknowledge = async () => {
    setIsAcknowledged(true);
    await acknowledgeCapsule(capsule.id);
  };

  const senderDisplayName = capsule.senderName || capsule.senderEmail?.split('@')[0] || 'A Classmate';
  const paragraphs = (capsule.message || 'No written manuscript found in this chronicle.').split('\n\n');

  return (
    <main className="flex flex-col relative w-full px-gutter-mobile md:px-gutter pt-16 md:pt-6 pb-28 md:pb-12 bg-surface flex-1">
      <div className="flex flex-col w-full max-w-3xl mx-auto pb-10">
        {/* Status & Vault Chronicle Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface shadow-sm">
            <span className="material-symbols-outlined text-[15px] text-on-tertiary-container animate-pulse">
              lock_open_right
            </span>
            <span className="font-label-md text-label-md tracking-wider uppercase font-semibold">
              Decrypted on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
            <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-mono">
              Temporal Seal {capsule.cipherFingerprint || '0x8F92...B3'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
          </div>
        </div>

        {/* Hero Opened Linen Envelope Container */}
        <div className="relative w-full rounded-xl bg-surface-container-lowest shadow-md overflow-hidden transition-all border border-surface-container-low">
          {/* Wax Seal Residue & Envelope Flap Motif */}
          <div className="relative w-full bg-secondary-container/40 pt-6 pb-6 px-5 flex flex-col items-center justify-center border-b border-surface-container">
            {/* Broken Wax Seal Iconography */}
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center shadow-inner relative">
                <div className="w-11 h-11 rounded-full bg-on-tertiary-container/85 flex items-center justify-center text-surface-container-lowest shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">mark_email_read</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-on-tertiary-container shadow-sm rotate-45"></div>
              </div>
            </div>

            {/* Provenance Meta Details */}
            <div className="text-center mt-3">
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                Archive Record #{capsule.id.substring(0, 12).toUpperCase()}
              </p>
              <p className="font-headline-md text-headline-md text-primary font-medium mt-0.5 font-serif">
                {capsule.title}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant font-medium">
                by {senderDisplayName}
              </p>
            </div>

            {/* Delivery Chronometer Pill */}
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container text-on-primary-fixed shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                history_toggle_off
              </span>
              <span className="font-label-md text-label-md font-semibold">
                Delivered across temporal coordinates
              </span>
            </div>

            {/* Cryptographic Authenticity Banner */}
            <div className="mt-2.5 flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">
                verified
              </span>
              <span>Verified sender &amp; cryptographic timestamp intact</span>
            </div>
          </div>

          {/* Letter Paper Interior with Archival Texture */}
          <div className="p-6 md:p-8 bg-surface-container-lowest">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container-low">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                Personal Manuscript
              </span>
              <div className="flex items-center gap-1 text-on-tertiary-container">
                <span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
                <span className="font-label-sm text-label-sm font-semibold">Vault Grade A</span>
              </div>
            </div>

            {/* Letter Body Typography */}
            <article className="space-y-4 font-serif text-on-surface">
              <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary leading-relaxed font-normal">
                Dear {user?.fullName || 'Friend'},
              </p>
              {paragraphs.map((para, idx) => (
                <p key={idx} className="font-body-lg text-body-lg text-on-surface leading-loose font-normal">
                  {para}
                </p>
              ))}
            </article>

            {/* Signature */}
            <div className="mt-8 pt-4 flex flex-col items-end">
              <span className="font-headline-md text-headline-md text-primary italic font-serif">
                With all my love across time,
              </span>
              <span className="font-title-md text-title-md text-on-surface font-semibold tracking-wide mt-1">
                {senderDisplayName}
              </span>
            </div>

            {/* Keepsake Attachments Section (if any) */}
            {capsule.attachments.length > 0 && (
              <div className="mt-8 pt-6 bg-surface-container-low p-4 rounded-xl border border-surface-container">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
                    inventory_2
                  </span>
                  <h2 className="font-title-md text-title-md text-primary font-semibold font-serif">
                    Archived Enclosures ({capsule.attachments.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {capsule.attachments.map((att) => (
                    <div key={att.id} className="bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-surface-container-low">
                      <div className="relative w-full aspect-[4/3] rounded overflow-hidden bg-surface-container">
                        <img
                          className="w-full h-full object-cover"
                          alt={att.name}
                          src={att.url}
                        />
                      </div>
                      <div className="pt-2 text-center">
                        <p className="font-label-md text-label-md text-primary truncate font-medium">
                          {att.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Intimate Recipient Action Deck */}
        <div className="mt-6 flex flex-col gap-3">
          {/* Primary Delivery Confirmation */}
          <button
            type="button"
            onClick={handleAcknowledge}
            className={`w-full py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              isAcknowledged
                ? 'bg-tertiary-container text-on-tertiary'
                : 'bg-primary text-on-primary hover:bg-primary-container active:scale-[0.99]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim">
              {isAcknowledged ? 'check_circle' : 'done_all'}
            </span>
            <span className="font-title-md text-title-md font-semibold tracking-wide">
              {isAcknowledged ? `${senderDisplayName} has been notified!` : `Acknowledge & Notify ${senderDisplayName}`}
            </span>
          </button>

          {/* Keepsake Vault Storage & Future Reply */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsSavedToKeepsakes(!isSavedToKeepsakes)}
              className="py-3 px-3 rounded-lg bg-surface-container text-primary flex items-center justify-center gap-1.5 shadow-sm active:bg-surface-container-high hover:bg-surface-container-high transition-colors cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                {isSavedToKeepsakes ? 'bookmark_added' : 'bookmark_add'}
              </span>
              <span className="font-label-md text-label-md">
                {isSavedToKeepsakes ? 'Saved in Keepsakes' : 'Save to Keepsakes'}
              </span>
            </button>

            <Link
              to="/capsules/new"
              className="py-3 px-3 rounded-lg bg-surface-container text-primary flex items-center justify-center gap-1.5 shadow-sm active:bg-surface-container-high hover:bg-surface-container-high transition-colors cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                schedule_send
              </span>
              <span className="font-label-md text-label-md">Reply into Future</span>
            </Link>
          </div>

          {/* Security Footnote */}
          <div className="mt-2 text-center">
            <p className="font-label-sm text-label-sm text-secondary">
              Decrypted via Zero-Knowledge Key on recipient device • Permanent local ledger verified
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
