import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle, connectGoogleDrive } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const code = searchParams.get('code');
  const state = searchParams.get('state') || '';
  const purpose = searchParams.get('purpose') || (state.includes('drive') ? 'drive' : 'login');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (oauthError) {
      setStatus('error');
      setErrorMessage(`Google OAuth Error: ${oauthError}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('Missing OAuth authorization code in callback URL.');
      return;
    }

    let isMounted = true;

    const processOAuth = async () => {
      try {
        // Step progression simulation for tactile feel
        if (isMounted) setCurrentStep(1); // Verifying OpenID Token
        await new Promise((r) => setTimeout(r, 400));

        if (isMounted) setCurrentStep(2); // Sovereign Drive / Session Exchange
        if (purpose === 'drive') {
          await connectGoogleDrive(code, state);
        } else {
          await loginWithGoogle(code, state);
        }

        if (isMounted) {
          setCurrentStep(3); // Sovereign Vault Sealed
          setStatus('success');
          setTimeout(() => {
            if (purpose === 'drive') {
              navigate('/vault');
            } else {
              navigate('/');
            }
          }, 800);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to exchange authorization tokens with Google.');
        }
      }
    };

    processOAuth();

    return () => {
      isMounted = false;
    };
  }, [code, state, purpose, oauthError, navigate, loginWithGoogle, connectGoogleDrive]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-gutter-mobile">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg border border-surface-container-low text-center relative overflow-hidden">
        {/* Archival ambient glow */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-secondary-fixed/40 rounded-full blur-2xl pointer-events-none"></div>

        {status === 'processing' && (
          <div className="flex flex-col items-center relative z-10 py-space-md">
            {/* Tactile Wax Seal Spinning Ring */}
            <div className="relative w-20 h-20 mb-space-md flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-surface-container border-t-tertiary-fixed-dim animate-spin"></div>
              <div className="w-14 h-14 rounded-full bg-primary-container text-tertiary-fixed-dim flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[28px] animate-pulse">
                  history_edu
                </span>
              </div>
            </div>

            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary-container font-semibold">
              Cryptographic Attestation
            </span>
            <h1 className="font-display-lg-mobile text-title-lg text-primary font-serif tracking-tight mt-1 mb-2">
              {purpose === 'drive' ? 'Linking Sovereign Drive' : 'Authorizing Time Vault'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mb-space-lg">
              Securing Google OAuth 2.0 cryptographic tokens and verifying client-side encryption keys...
            </p>

            {/* Step Checkpoints */}
            <div className="w-full bg-surface-container-low rounded-xl p-space-sm border border-surface-container flex flex-col gap-2 text-left font-body-md text-[13px]">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                  {currentStep > 1 ? 'check_circle' : 'radio_button_checked'}
                </span>
                <span>1. Google Identity Verified (OpenID Connect)</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                  {currentStep > 2 ? 'check_circle' : currentStep === 2 ? 'sync' : 'radio_button_unchecked'}
                </span>
                <span>2. Exchanging Sovereign Authorization Tokens</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">
                  {currentStep === 3 ? 'verified' : 'radio_button_unchecked'}
                </span>
                <span>3. Readying AES-256-GCM Memory Chamber</span>
              </div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center relative z-10 py-space-md">
            <div className="w-16 h-16 rounded-full bg-surface-container-high text-on-tertiary-container flex items-center justify-center shadow-md mb-space-sm">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary-container font-semibold">
              Attestation Complete
            </span>
            <h1 className="font-display-lg-mobile text-headline-sm text-primary font-serif tracking-tight mt-1 mb-2">
              Access Granted
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Vault seal recognized. Opening your archive...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center relative z-10 py-space-md">
            <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-md mb-space-sm">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-error font-semibold">
              Attestation Failed
            </span>
            <h1 className="font-display-lg-mobile text-title-lg text-primary font-serif tracking-tight mt-1 mb-2">
              Authentication Incomplete
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
              {errorMessage || 'Unable to authenticate with Google.'}
            </p>

            <div className="flex flex-col gap-2 w-full">
              <Link
                to="/auth"
                className="w-full py-2.5 bg-primary text-on-primary font-title-md text-body-md rounded-lg shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Return to Access Chamber</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

