import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCapsules } from '../context/CapsuleContext';
import { useAuth } from '../context/AuthContext';
import { timeUntil } from '../lib/utils';

export const OverviewDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { capsules, breakWaxSeal } = useCapsules();
  const { user } = useAuth();
  const [isOpeningSeal, setIsOpeningSeal] = useState(false);

  // Check for any delivered capsule awaiting the user's touch
  const deliveredCapsule = capsules.find((c) => c.status === 'delivered');

  const handleBreakSeal = async (capsuleId: string) => {
    setIsOpeningSeal(true);
    await breakWaxSeal(capsuleId);
    setTimeout(() => {
      navigate(`/capsules/${capsuleId}/read`);
    }, 700);
  };

  // Real-time metric calculations
  const currentYear = new Date().getFullYear();
  const sealedCapsules = capsules.filter((c) => c.status === 'scheduled');
  const sealedCount = sealedCapsules.length;
  const arrivingThisYear = capsules.filter(
    (c) => c.status === 'scheduled' && new Date(c.deliveryDate).getFullYear() === currentYear
  ).length;
  const unopenedCount = capsules.filter((c) => c.status === 'delivered').length;
  const totalAttachments = capsules.reduce((acc, c) => acc + (c.attachments?.length || 0), 0);

  // Horizon map grouped by actual delivery years
  const horizonCounts = {
    [currentYear]: capsules.filter((c) => new Date(c.deliveryDate).getFullYear() === currentYear).length,
    [currentYear + 1]: capsules.filter((c) => new Date(c.deliveryDate).getFullYear() === currentYear + 1).length,
    [currentYear + 2]: capsules.filter((c) => new Date(c.deliveryDate).getFullYear() === currentYear + 2).length,
    later: capsules.filter((c) => new Date(c.deliveryDate).getFullYear() > currentYear + 2).length,
  };

  // User display name
  const firstName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Cadet';

  return (
    <main className="flex flex-col relative w-full px-gutter-mobile md:px-gutter pt-16 md:pt-6 pb-28 md:pb-12 bg-surface flex-1">
      <div className="flex flex-col w-full max-w-5xl mx-auto gap-space-lg">
        {/* Archival Welcome Ledger Banner */}
        <section className="relative w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm overflow-hidden border border-surface-container-low">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-secondary-fixed/30 pointer-events-none blur-xl"></div>
          <div className="relative z-10 flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                history_edu
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                Archival Ledger • Est. 2024
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary tracking-tight leading-snug">
              Welcome back, {firstName}.
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {sealedCount > 0
                ? `You have ${sealedCount} memory capsule${sealedCount > 1 ? 's' : ''} safely sealed in time, quietly awaiting their moment of reveal.`
                : 'Your sovereign vault is initialized and protected with AES-256-GCM. Inscribe your first future memory.'}
            </p>
          </div>
        </section>

        {/* Highlight Banner: Delivered Capsule OR Empty State Callout */}
        {deliveredCapsule ? (
          <section className="relative w-full rounded-xl bg-primary-container text-on-primary p-space-md shadow-md overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none text-surface">
              <span className="material-symbols-outlined text-[130px]">mail</span>
            </div>
            <div className="relative z-10 flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                    Unlocked &amp; Ready
                  </span>
                  <span className="text-on-primary-container font-label-sm text-label-sm">
                    • Delivered
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed-dim/20 flex items-center justify-center text-tertiary-fixed-dim">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-md text-headline-md text-surface font-medium leading-snug">
                  {deliveredCapsule.title}
                </h3>
                <p className="font-body-md text-body-md text-on-primary-container">
                  From {deliveredCapsule.senderName || deliveredCapsule.senderEmail} — Ready for unsealing.
                </p>
              </div>

              {/* Action Footer with Wax Seal Metaphor */}
              <div className="pt-space-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                    key
                  </span>
                  <span className="font-label-sm text-label-sm text-on-primary-container tracking-wider uppercase font-mono">
                    Cipher AES-256 Verified
                  </span>
                </div>
                <button
                  onClick={() => handleBreakSeal(deliveredCapsule.id)}
                  disabled={isOpeningSeal}
                  className="group flex items-center gap-space-xs px-4 py-2 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed shadow-sm active:scale-95 hover:bg-tertiary-fixed transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-fixed">
                    {isOpeningSeal ? 'hourglass_empty' : 'lock_open_right'}
                  </span>
                  <span className="font-label-md text-label-md font-semibold">
                    {isOpeningSeal ? 'Vault Opening...' : 'Break Wax Seal'}
                  </span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative w-full rounded-xl bg-primary-container text-on-primary p-space-md shadow-md overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none text-surface">
              <span className="material-symbols-outlined text-[130px]">history_edu</span>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                    Sovereign Vault Armed
                  </span>
                  <span className="text-on-primary-container font-label-sm text-label-sm">
                    • AES-256-GCM
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-surface font-medium mt-1">
                  Your Vault is Awaiting Its First Memory
                </h3>
                <p className="font-body-md text-body-md text-on-primary-container max-w-xl">
                  No unsealed capsules currently waiting. Inscribe a personal future letter, celebrate graduation, or seal messages with classmates.
                </p>
              </div>
              <Link
                to="/capsules/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed font-label-md text-label-md font-semibold hover:bg-tertiary-fixed transition-all shadow-sm active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Seal First Capsule</span>
              </Link>
            </div>
          </section>
        )}

        {/* Key Metric Vault Counters (2x2 on Mobile, 4-col on Desktop) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-space-sm w-full">
          {/* Metric 1: Sealed */}
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Sealed Capsules
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                inventory_2
              </span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-1.5">
              <span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-medium">
                {sealedCount}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">vaulted</span>
            </div>
            <div className="mt-space-xs flex items-center gap-1 text-on-tertiary-container">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              <span className="font-label-sm text-label-sm">
                {sealedCount > 0 ? `${sealedCount} active timelines` : 'Ready to receive'}
              </span>
            </div>
          </div>

          {/* Metric 2: Arriving This Year */}
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low shadow-sm border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Arriving {currentYear}
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                notifications_active
              </span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-1.5">
              <span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-medium">
                {arrivingThisYear}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">milestones</span>
            </div>
            <div className="mt-space-xs flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[12px]">event_upcoming</span>
              <span className="font-label-sm text-label-sm">
                {arrivingThisYear > 0 ? `${arrivingThisYear} scheduled this year` : 'None due this year'}
              </span>
            </div>
          </div>

          {/* Metric 3: Unopened Deliveries */}
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low shadow-sm border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Unopened
              </span>
              <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">
                mark_email_unread
              </span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-1.5">
              <span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-medium">
                {unopenedCount}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">delivered</span>
            </div>
            <div className="mt-space-xs flex items-center gap-1 text-on-tertiary-container">
              <span className="material-symbols-outlined text-[12px]">lock_open</span>
              <span className="font-label-sm text-label-sm">
                {unopenedCount > 0 ? 'Awaiting your touch' : 'All seals opened'}
              </span>
            </div>
          </div>

          {/* Metric 4: Encrypted Status */}
          <div className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Vault Security
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                shield
              </span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-1.5">
              <span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-medium">
                {user?.isGoogleDriveConnected ? '100%' : 'Active'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {user?.isGoogleDriveConnected ? 'synced' : 'local'}
              </span>
            </div>
            <div className="mt-space-xs flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[12px]">
                {user?.isGoogleDriveConnected ? 'cloud_done' : 'lock'}
              </span>
              <span className="font-label-sm text-label-sm">
                {user?.isGoogleDriveConnected ? 'Google Drive Sovereign' : 'AES-256 Zero-Knowledge'}
              </span>
            </div>
          </div>
        </section>

        {/* Visual Keepsake Vignette */}
        <section className="relative w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm overflow-hidden flex flex-col gap-space-sm border border-surface-container-low">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                Vault Keeper Snapshot
              </span>
              <h4 className="font-headline-md text-title-md text-primary font-serif">
                Stationery Artifacts &amp; Enclosures
              </h4>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">
              photo_library
            </span>
          </div>
          <div className="relative w-full h-44 rounded-lg overflow-hidden">
            <img
              className="w-full h-full object-cover"
              alt="Archival stationery, vintage fountain pen, amber beeswax seal stamped with crescent moon"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmEfq4zuB6cbneYLH3lGo9yXWOEj4CJFUFhmN4VKFTqZDbOPRQCNIdxZWRUrBzPKEACJJKMnTnLhFFIVRsrW6tpl5WIuBu-WmSyNVK7pQgRfw9M8VFAOmvGuu2A1g3mp941Bs2M00xS5oHCZCeGaVZ_hAau8P_RIM3Pi_PhbqBGAPBCFN8b1ZkHlObfuYf7z_4-hgAyqdtlQrGGTe2vD94dOSqEPtq8Yci_ZC4QpYa"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent flex items-end p-space-sm">
              <span className="font-label-sm text-label-sm text-surface tracking-wide">
                {totalAttachments > 0
                  ? `${totalAttachments} Attached Audio Notes, Polaroids & Enclosures in Zero-Knowledge Vault`
                  : 'Zero-Knowledge Archival Vault Armed • Attach voice notes, polaroids, and documents'}
              </span>
            </div>
          </div>
        </section>

        {/* Upcoming Journey Timeline */}
        <section className="flex flex-col gap-space-sm w-full">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                hourglass_bottom
              </span>
              <h3 className="font-headline-md text-headline-md text-primary font-serif">
                Upcoming Milestones
              </h3>
            </div>
            <Link
              to="/timeline"
              className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider hover:underline font-semibold"
            >
              Full Chronology &rarr;
            </Link>
          </div>

          <div className="flex flex-col gap-space-sm">
            {/* Real User Scheduled Milestones */}
            {sealedCapsules.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="relative flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm gap-space-xs border border-surface-container-low hover:border-tertiary-fixed-dim/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                    Delivers {new Date(item.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                    {timeUntil(item.deliveryDate)}
                  </span>
                </div>
                <h4 className="font-headline-md text-title-md text-primary font-medium mt-1">
                  {item.title}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                  {item.message || 'Encrypted capsule preserved in sovereign storage.'}
                </p>
                <div className="flex items-center justify-between pt-space-xs mt-1 text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">encrypted</span>
                    <span className="font-label-sm text-label-sm">
                      {item.isBatch ? 'Batch Quorum' : 'Personal Vault'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                    lock_clock
                  </span>
                </div>
              </div>
            ))}

            {/* Academic Cohort Convocation Milestone */}
            <div className="relative flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm gap-space-xs border border-surface-container-low hover:border-tertiary-fixed-dim/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                  Convocation Day • June 15, {user?.graduationYear || 2027}
                </span>
                <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                  Institutional Landmark
                </span>
              </div>
              <h4 className="font-headline-md text-title-md text-primary font-medium mt-1">
                Class Convocation &amp; Commencement
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                Degree conferral ceremony, cohort diploma presentation, and time-capsule unsealing.
              </p>
              <div className="flex items-center justify-between pt-space-xs mt-1 text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">school</span>
                  <span className="font-label-sm text-label-sm">
                    {user?.department || 'Dept. of Computer Science & Engineering'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                  event_seat
                </span>
              </div>
            </div>

            {sealedCapsules.length === 0 && (
              <div className="p-space-md rounded-xl bg-surface-container-low border border-dashed border-surface-container flex flex-col items-center text-center gap-2">
                <span className="material-symbols-outlined text-[28px] text-on-tertiary-container">
                  add_alarm
                </span>
                <span className="font-title-md text-title-md text-primary font-medium">
                  No Personal Capsules Scheduled Yet
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  Schedule a future delivery date to see your personal milestones charted along the timeline.
                </p>
                <Link
                  to="/capsules/new"
                  className="mt-1 font-label-md text-label-md text-on-tertiary-container font-bold hover:underline"
                >
                  + Create Future Capsule
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Memory Calendar Snapshot (Horizon Map) */}
        <section className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface-container-low shadow-sm border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
              <h3 className="font-headline-md text-title-md text-primary font-serif">
                Sealed Milestone Horizon
              </h3>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Across Epochs</span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-space-xs text-center">
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-lowest shadow-xs">
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-bold">
                {currentYear}
              </span>
              <span className="font-headline-md text-headline-md text-primary mt-1">
                {horizonCounts[currentYear]}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Capsules</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-lowest shadow-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                {currentYear + 1}
              </span>
              <span className="font-headline-md text-headline-md text-primary mt-1">
                {horizonCounts[currentYear + 1]}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Capsules</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-lowest shadow-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                {currentYear + 2}
              </span>
              <span className="font-headline-md text-headline-md text-primary mt-1">
                {horizonCounts[currentYear + 2]}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Capsules</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-surface-container-lowest shadow-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">Later</span>
              <span className="font-headline-md text-headline-md text-primary mt-1">
                {horizonCounts.later}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Heirlooms</span>
            </div>
          </div>
        </section>

        {/* Quick Action: Draft a Capsule CTA with Wax Seal Trigger */}
        <section className="relative w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm overflow-hidden flex items-center justify-between border border-surface-container-low">
          <div className="flex flex-col max-w-[70%]">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-tertiary-container font-semibold">
              New Chronicle
            </span>
            <h3 className="font-headline-md text-title-md text-primary font-medium mt-0.5">
              Draft a Capsule
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-snug mt-1">
              Pen a thought, lock a memory, or schedule a future revelation today.
            </p>
          </div>
          <Link
            to="/capsules/new"
            aria-label="Compose memory capsule"
            className="relative w-16 h-16 rounded-full bg-primary-container text-tertiary-fixed-dim shadow-md flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
          >
            <div className="absolute inset-1 rounded-full border border-tertiary-fixed-dim/30 pointer-events-none"></div>
            <span className="material-symbols-outlined text-[24px]">edit_note</span>
            <span className="font-label-sm text-[8px] uppercase tracking-tighter mt-0.5 font-bold">
              Seal
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
};
