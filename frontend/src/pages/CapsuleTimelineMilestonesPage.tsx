import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockMilestones } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { useCapsules } from '../context/CapsuleContext';
import { timeUntil } from '../lib/utils';
import type { MilestoneItem } from '../types';

export const CapsuleTimelineMilestonesPage: React.FC = () => {
  const { user } = useAuth();
  const { capsules } = useCapsules();
  const [activeFilter, setActiveFilter] = useState<'all' | 'batch' | 'personal' | 'alumni'>('all');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const isDemoAccount = user?.email === 'elena.rostova@gmail.com';

  // Build user-specific milestones
  const allMilestones: MilestoneItem[] = isDemoAccount
    ? mockMilestones
    : [
        // Batch Convocation Milestone
        {
          id: 'm-convocation',
          year: user?.graduationYear || 2027,
          dateStr: `June 15, ${user?.graduationYear || 2027}`,
          remainingText: 'Institutional Landmark',
          title: `Convocation Ceremony & Graduation Revelations (${user?.graduationYear || 2027})`,
          description: `All batch vaults and group memories will unlock when the convocation bell rings.`,
          category: 'batch' as const,
          status: 'future' as const,
          badgeText: 'Convocation Epoch',
          cipher: '0x2027...CSE',
          contributors: [{ name: user?.fullName || 'Cadet', initials: 'ME' }],
          isLocked: true,
        },
        // Real user capsules
        ...capsules.map((c) => ({
          id: c.id,
          year: new Date(c.deliveryDate).getFullYear(),
          dateStr: new Date(c.deliveryDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          remainingText: timeUntil(c.deliveryDate),
          title: c.title,
          description: c.message || 'Encrypted time capsule locked in sovereign vault.',
          category: (c.isBatch ? 'batch' : 'personal') as MilestoneItem['category'],
          status: (c.status === 'scheduled' ? 'future' : 'past') as MilestoneItem['status'],
          badgeText: c.status === 'scheduled' ? 'Sealed & Locked' : 'Delivered & Opened',
          cipher: c.cipherFingerprint || '0x8F92...B3',
          isLocked: c.status === 'scheduled',
        })),
      ].sort((a, b) => a.year - b.year);

  const filteredMilestones = allMilestones.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.category === activeFilter;
  });

  const scrollToMilestone = (id: string) => {
    setSelectedMilestoneId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const cohortName = user?.graduationYear ? `Class of ${user.graduationYear}` : 'CSE 2027';

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 md:pt-6 pb-28 md:pb-12 bg-surface">
      <div className="flex flex-col w-full max-w-4xl mx-auto px-gutter-mobile md:px-0 space-y-space-lg pb-10">
        {/* Header Corridor */}
        <section className="flex flex-col space-y-space-xs pt-space-md">
          <div className="flex items-center space-x-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary-container bg-tertiary-fixed/30 px-2.5 py-0.5 rounded font-bold">
              Temporal Chronology
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-semibold">
              {allMilestones.length} Milestones Plotted
            </span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight font-serif">
            Journey of {cohortName}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            A vertical chronological ledger connecting freshman memories, upcoming convocation, and future revelations.
          </p>

          {/* Ledger Filter Bar */}
          <div className="flex items-center gap-space-xs overflow-x-auto py-2 no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              All Milestones ({allMilestones.length})
            </button>
            <button
              onClick={() => setActiveFilter('batch')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all cursor-pointer ${
                activeFilter === 'batch'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Batch Milestones
            </button>
            <button
              onClick={() => setActiveFilter('personal')}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-sm transition-all cursor-pointer ${
                activeFilter === 'personal'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Personal Vault
            </button>
          </div>
        </section>

        {/* Epoch Scrubber Bar */}
        {allMilestones.length > 0 && (
          <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                  tune
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                  Epoch Scrubber
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                {allMilestones[0].year} — {allMilestones[allMilestones.length - 1].year}
              </span>
            </div>

            <div className="relative flex items-center justify-between px-2 pt-2">
              <div className="absolute left-4 right-4 h-0.5 bg-outline-variant/30 top-1/2 -translate-y-1/2"></div>
              {allMilestones.slice(0, 6).map((node) => (
                <button
                  key={node.id}
                  onClick={() => scrollToMilestone(node.id)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center transition-transform group-hover:scale-125 ${
                    selectedMilestoneId === node.id
                      ? 'bg-tertiary-fixed-dim ring-2 ring-primary shadow-sm'
                      : 'bg-surface-container-highest'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  </span>
                  <span className="font-label-sm text-label-sm mt-1.5 text-on-surface-variant group-hover:text-primary font-semibold">
                    '{String(node.year).slice(-2)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Vertical Timeline Spine Corridors */}
        <section className="relative flex flex-col space-y-space-lg pb-space-xl">
          <div className="absolute left-4 top-2 bottom-6 w-0.5 border-l-2 border-dotted border-primary/20 pointer-events-none"></div>

          {filteredMilestones.map((milestone) => (
            <article
              key={milestone.id}
              id={milestone.id}
              className={`relative pl-10 transition-all ${
                selectedMilestoneId === milestone.id ? 'scale-[1.01]' : ''
              }`}
            >
              {/* Timeline Pin Node */}
              <div
                className={`absolute left-2.5 top-5 w-3.5 h-3.5 rounded-full -translate-x-1/2 flex items-center justify-center ${
                  milestone.status === 'past'
                    ? 'bg-primary ring-4 ring-surface'
                    : milestone.status === 'present'
                    ? 'bg-tertiary-fixed-dim ring-4 ring-tertiary-fixed/30 animate-pulse'
                    : 'bg-surface-container-highest ring-4 ring-surface'
                }`}
              ></div>

              {/* Milestone Card */}
              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low flex flex-col gap-space-xs hover:border-surface-container-high transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold">
                    {milestone.dateStr}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm font-semibold ${
                      milestone.status === 'past'
                        ? 'text-on-surface-variant'
                        : 'text-on-tertiary-container'
                    }`}
                  >
                    {milestone.remainingText}
                  </span>
                </div>

                <h3 className="font-headline-md text-headline-md text-primary font-serif font-medium mt-1">
                  {milestone.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {milestone.description}
                </p>

                <div className="flex items-center justify-between pt-space-xs mt-1 border-t border-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">
                      {milestone.isLocked ? 'lock' : 'lock_open'}
                    </span>
                    <span>{milestone.cipher || 'AES-256-GCM'}</span>
                  </div>
                  <span className="uppercase tracking-wider font-semibold">
                    #{milestone.category.toUpperCase()}
                  </span>
                </div>
              </div>
            </article>
          ))}

          {!isDemoAccount && capsules.length === 0 && (
            <div className="pl-10">
              <div className="p-6 rounded-xl bg-surface-container-low border border-dashed border-surface-container flex flex-col items-center text-center gap-2">
                <span className="material-symbols-outlined text-[28px] text-on-tertiary-container">
                  timeline
                </span>
                <h4 className="font-title-md text-title-md text-primary font-serif font-medium">
                  Chart Your Personal Chronology
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  Seal future capsules with milestone dates to see them charted along your collegiate journey.
                </p>
                <Link
                  to="/capsules/new"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>Seal First Milestone</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
