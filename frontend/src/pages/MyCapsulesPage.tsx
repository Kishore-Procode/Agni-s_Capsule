import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCapsules } from '../context/CapsuleContext';
import { useAuth } from '../context/AuthContext';
import { timeUntil } from '../lib/utils';

export const MyCapsulesPage: React.FC = () => {
  const { capsules } = useCapsules();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'all' | 'scheduled' | 'delivered' | 'received' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userEmail = user?.email || 'cadet@university.edu';

  const filteredCapsules = capsules.filter((c) => {
    if (activeCategory === 'scheduled' && c.status !== 'scheduled') return false;
    if (activeCategory === 'delivered' && c.status !== 'delivered' && c.status !== 'opened') return false;
    if (activeCategory === 'drafts' && c.status !== 'draft') return false;
    if (activeCategory === 'received' && c.senderEmail === userEmail) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        (c.cipherFingerprint && c.cipherFingerprint.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <main className="flex flex-col relative w-full px-gutter-mobile md:px-gutter pt-16 md:pt-6 pb-28 md:pb-12 bg-surface flex-1">
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        {/* Header Corridor */}
        <div className="flex flex-col gap-space-sm pt-space-xs pb-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">
                local_post_office
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-semibold">
                Archival Collection
              </span>
            </div>
            <span className="font-label-md text-label-md text-on-primary-container bg-surface-container-high px-2.5 py-0.5 rounded-full font-semibold">
              {capsules.length} Preserved
            </span>
          </div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight font-serif">
            My Capsules
          </h2>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-space-xs -mx-gutter-mobile px-gutter-mobile md:mx-0 md:px-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>All</span>
            <span className="opacity-70 text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {capsules.length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory('scheduled')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'scheduled'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>Scheduled</span>
            <span className="opacity-70 text-[10px] bg-on-surface-variant/10 px-1.5 py-0.2 rounded-full">
              {capsules.filter((c) => c.status === 'scheduled').length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory('delivered')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'delivered'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>Delivered</span>
            <span className="opacity-70 text-[10px] bg-on-surface-variant/10 px-1.5 py-0.2 rounded-full">
              {capsules.filter((c) => c.status === 'delivered' || c.status === 'opened').length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory('received')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'received'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>Received</span>
            <span className="opacity-70 text-[10px] bg-on-surface-variant/10 px-1.5 py-0.2 rounded-full">
              {capsules.filter((c) => c.senderEmail !== userEmail).length}
            </span>
          </button>
          <button
            onClick={() => setActiveCategory('drafts')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'drafts'
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
            }`}
          >
            <span>Drafts</span>
            <span className="opacity-70 text-[10px] bg-on-surface-variant/10 px-1.5 py-0.2 rounded-full">
              {capsules.filter((c) => c.status === 'draft').length}
            </span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-space-xs mt-space-sm">
          <div className="relative w-full flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-on-surface-variant/70">
              search
            </span>
            <input
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-on-tertiary-container/30 transition-all border border-surface-container-low"
              placeholder="Search memoirs, tags, or ciphers..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              aria-label="Audio Search"
              className="absolute right-3 text-on-surface-variant/70 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
          </div>
        </div>

        {/* Envelope Card Stack OR Empty State */}
        <div className="flex flex-col gap-space-md mt-space-md">
          {filteredCapsules.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-surface-container-lowest rounded-xl border border-dashed border-surface-container gap-3 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-surface-container-low text-on-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">inventory_2</span>
              </div>
              <h3 className="font-headline-md text-title-md text-primary font-serif">
                No Capsules Found in this Ledger
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                {activeCategory === 'all'
                  ? 'Your time vault has no capsules yet. Inscribe a personal memory or future message to send across time.'
                  : `No capsules match the '${activeCategory}' ledger filter.`}
              </p>
              <Link
                to="/capsules/new"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Seal a New Capsule</span>
              </Link>
            </div>
          ) : (
            filteredCapsules.map((capsule) => (
              <Link
                key={capsule.id}
                to={capsule.status === 'delivered' || capsule.status === 'opened' ? `/capsules/${capsule.id}/read` : `/capsules/new`}
                className="group relative w-full rounded-xl bg-surface-container-lowest shadow-md overflow-hidden transition-all hover:shadow-lg border border-surface-container-low"
              >
                {/* Folded Envelope Flap Visual */}
                <div className="relative w-full h-8 bg-surface-container-high overflow-hidden flex items-center justify-center">
                  <svg
                    className="w-full h-full text-surface-container-lowest"
                    fill="currentColor"
                    preserveAspectRatio="none"
                    viewBox="0 0 360 28"
                  >
                    <path d="M0,0 L180,24 L360,0 L360,28 L0,28 Z" opacity="0.95"></path>
                  </svg>
                  <div className="absolute top-1 w-6 h-6 rounded-full bg-surface-container-low flex items-center justify-center shadow-xs">
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        capsule.status === 'opened' || capsule.status === 'delivered'
                          ? 'text-on-tertiary-container'
                          : 'text-tertiary-fixed-dim'
                      }`}
                    >
                      {capsule.status === 'opened' ? 'mark_email_read' : 'lock'}
                    </span>
                  </div>
                </div>

                <div className="p-4 pt-2 flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          capsule.status === 'scheduled'
                            ? 'bg-tertiary-fixed-dim animate-pulse'
                            : capsule.status === 'opened'
                            ? 'bg-secondary'
                            : 'bg-on-tertiary-container'
                        }`}
                      ></span>
                      <span className="font-label-sm text-label-sm uppercase text-on-tertiary-container tracking-wider font-bold">
                        {capsule.status === 'scheduled'
                          ? 'Sealed & Locked'
                          : capsule.status === 'opened'
                          ? 'Decrypted & Read'
                          : capsule.status === 'delivered'
                          ? 'Delivered • Ready to Unseal'
                          : 'Draft in Progress'}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      ID: #{capsule.id.substring(0, 10).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline-md text-headline-md text-primary leading-tight font-serif group-hover:text-primary-container transition-colors">
                      {capsule.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-on-surface-variant font-body-md text-body-md">
                      <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                        hourglass_bottom
                      </span>
                      <span>
                        Delivering {new Date(capsule.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        <span className="text-on-surface-variant/70 font-label-md text-label-md">
                          ({timeUntil(capsule.deliveryDate)})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Optional Attachment Preview Image */}
                  {capsule.attachments[0]?.url && (
                    <div className="w-full h-28 rounded-lg overflow-hidden relative shadow-sm">
                      <img
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        alt={capsule.title}
                        src={capsule.attachments[0].url}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent flex items-end p-2.5">
                        <span className="font-label-sm text-label-sm text-on-primary tracking-wide font-mono">
                          {capsule.cipherAlgorithm || 'AES-256'} Key #{capsule.cipherFingerprint || '882B'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Meta Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold">
                      #{capsule.type.toUpperCase()}
                    </span>
                    {capsule.recipients.length > 0 && (
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">group</span>
                        {capsule.recipients.length} Recipient{capsule.recipients.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {capsule.attachments.length > 0 && (
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">attachment</span>
                        {capsule.attachments.length} Enclosure{capsule.attachments.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
};
