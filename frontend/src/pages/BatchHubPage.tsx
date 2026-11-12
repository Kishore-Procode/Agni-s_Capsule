import React, { useState } from 'react';
import { mockBatchCommunity } from '../lib/mockData';
import { useCapsules } from '../context/CapsuleContext';
import { useAuth } from '../context/AuthContext';
import type { BatchMember } from '../types';

export const BatchHubPage: React.FC = () => {
  const { batch = mockBatchCommunity } = { batch: mockBatchCommunity };
  const { createAndSealCapsule, capsules } = useCapsules();
  const { user } = useAuth();

  const [isContributing, setIsContributing] = useState(false);
  const [contributionTitle, setContributionTitle] = useState('');
  const [contributionMessage, setContributionMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionTitle.trim() || !contributionMessage.trim()) return;

    await createAndSealCapsule({
      title: `[CSE '${user?.graduationYear ? String(user.graduationYear).slice(-2) : '27'}] ${contributionTitle}`,
      message: contributionMessage,
      type: 'batch',
      deliveryDate: `${user?.graduationYear || 2027}-06-15T10:00:00Z`,
      deliveryTime: '10:00 AM',
      timezone: 'Asia/Kolkata',
      recipients: [{ email: 'batch@university.edu', name: 'Batch Quorum' }],
      attachments: [],
      isBatch: true,
    });

    setContributionTitle('');
    setContributionMessage('');
    setIsContributing(false);
    setToastMessage('Contribution Armored & Added to Batch Ledger Quorum!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Ensure current user is in roster
  const memberList: BatchMember[] = React.useMemo(() => {
    if (!user) return batch.members;
    const existing = batch.members.find((m) => m.name.toLowerCase() === user.fullName.toLowerCase());
    if (existing) return batch.members;

    const currentMember: BatchMember = {
      id: user.id,
      name: user.fullName,
      rollNumber: '23BCE' + user.id.slice(-4).toUpperCase(),
      role: 'Cadet Contributor',
      initials: user.fullName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      enrolledAt: '2023-09-01',
      sealedCapsulesCount: capsules.filter((c) => c.isBatch).length,
    };
    return [currentMember, ...batch.members];
  }, [user, batch.members, capsules]);

  const departmentName = user?.department || batch.department;
  const graduationYear = user?.graduationYear || batch.graduationYear;

  return (
    <main className="relative pt-16 md:pt-4 w-full min-h-screen bg-surface px-gutter-mobile md:px-gutter pb-28 md:pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 z-50 flex items-center gap-space-sm p-space-sm bg-primary-container text-surface-container-lowest rounded-xl shadow-xl border border-tertiary-fixed-dim/30">
          <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">
              verified
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-label-md text-label-md text-surface-container-lowest leading-tight font-bold">
              Contribution Armored
            </span>
            <span className="font-label-sm text-label-sm text-surface-container-high truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full max-w-6xl mx-auto">
        {/* TOP COMMAND HUB BANNER & STATS */}
        <section className="relative w-full pt-space-md pb-space-lg">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg pb-space-lg">
            <div className="flex flex-col max-w-3xl">
              <div className="flex items-center gap-space-xs mb-space-xs">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary-container font-semibold">
                  {departmentName} • Batch of {graduationYear}
                </span>
              </div>
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight font-serif leading-[1.08] text-balance">
                Agni's Batch Capsule Ledger
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-sm leading-relaxed max-w-2xl">
                Preserving hackathons, midnight git commits, dorm debates, and future graduation promises until {graduationYear + 10} &amp; beyond. Sealed by decentralized peer quorum.
              </p>
            </div>

            {/* Action Ribbon */}
            <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-end">
              <button
                type="button"
                onClick={() => setIsContributing(true)}
                className="group relative px-space-md py-2.5 bg-primary text-on-primary rounded-lg font-title-md text-body-md shadow-md hover:bg-primary-container transition-all flex items-center gap-space-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                  verified
                </span>
                <span>Contribute Memory Artifact</span>
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim group-hover:scale-125 transition-transform"></span>
              </button>
            </div>
          </div>

          {/* Metric 4-Column Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Batch Guardians
                </span>
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-lg-mobile md:font-headline-lg text-primary font-bold">
                  {memberList.length}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">cadets</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-tertiary-container mt-1">
                Quorum verified
              </span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Batch Vaults
                </span>
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-lg-mobile md:font-headline-lg text-primary font-bold">
                  {capsules.filter((c) => c.isBatch).length || 38}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">vaults</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary mt-1">
                Zero-knowledge sealed
              </span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Convocation Horizon
                </span>
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                  hourglass_top
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-lg-mobile md:font-headline-lg text-primary font-bold">
                  {batch.daysRemaining}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">days</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-tertiary-container mt-1">
                Until epoch reveal
              </span>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-1">
                <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  Vault Quota
                </span>
                <span className="material-symbols-outlined text-[18px]">cloud</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-lg-mobile md:font-headline-lg text-primary font-bold">
                  {batch.storageAllocatedGb} GB
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  / {batch.storageMaxGb} GB
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary mt-1">
                Sovereign Google Drive
              </span>
            </div>
          </div>
        </section>

        {/* Contribute Dialog / Inline Drawer */}
        {isContributing && (
          <section className="mb-space-lg bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg border-2 border-tertiary-fixed-dim/60 shadow-lg">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  post_add
                </span>
                <h3 className="font-headline-md text-title-md text-primary font-serif">
                  Contribute to Batch of {graduationYear} Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsContributing(false)}
                className="text-on-surface-variant hover:text-primary text-sm font-semibold"
              >
                ✕ Cancel
              </button>
            </div>
            <form onSubmit={handleContribute} className="flex flex-col gap-space-sm">
              <div>
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                  Artifact Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midnight C-Lab Debugging Session / Hackathon Victory Dump"
                  value={contributionTitle}
                  onChange={(e) => setContributionTitle(e.target.value)}
                  className="w-full bg-surface-container-low p-2.5 rounded-lg border border-surface-container text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-on-tertiary-container/40"
                  required
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                  Memory Inscription
                </label>
                <textarea
                  rows={4}
                  placeholder="Share a thought, confession, inside joke, or future prophecy for our batch..."
                  value={contributionMessage}
                  onChange={(e) => setContributionMessage(e.target.value)}
                  className="w-full bg-surface-container-low p-2.5 rounded-lg border border-surface-container text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-on-tertiary-container/40 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary font-title-md text-body-md font-semibold rounded-lg shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                  lock
                </span>
                <span>Seal Memory in Batch Quorum</span>
              </button>
            </form>
          </section>
        )}

        {/* Class Members Roster Section */}
        <section className="mt-space-md bg-surface-container-lowest rounded-xl shadow-sm p-space-md md:p-space-lg border border-surface-container-low">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                Class Ledger Roster
              </span>
              <h3 className="font-headline-md text-headline-md text-primary font-serif">
                Registered Cadets &amp; Archivists
              </h3>
            </div>
            <span className="font-label-md text-label-md bg-surface-container px-2.5 py-1 rounded-full text-on-surface font-semibold">
              {memberList.length} Enrolled Online
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="border-b border-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-2.5 px-3">Cadet Name</th>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Sealed Capsules</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {memberList.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-container text-tertiary-fixed-dim font-bold text-xs flex items-center justify-center">
                        {member.initials}
                      </div>
                      <span className="font-semibold text-primary">{member.name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-secondary text-sm">
                      {member.rollNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-serif font-bold text-primary">
                      {member.sealedCapsulesCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};
