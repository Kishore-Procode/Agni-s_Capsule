import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, initiateGoogleLogin, isAuthenticating, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      if (isRegistering) {
        await register({
          email,
          password,
          full_name: fullName || email.split('@')[0].replace(/[._]/g, ' '),
        });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch {
      // error is set in the auth context
    }
  };

  const handleGoogleSignIn = async () => {
    await initiateGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-gutter-mobile">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg border border-surface-container-low relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-secondary-fixed/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center mb-space-lg relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-tertiary-fixed-dim shadow-md mb-space-sm">
            <span className="material-symbols-outlined text-[32px]">history_edu</span>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-tertiary-container font-semibold">
            Institutional Cryptographic Access
          </span>
          <h1 className="font-display-lg-mobile text-headline-lg-mobile text-primary font-serif tracking-tight mt-1">
            Agni's Capsule
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
            Sign in or register with your email and password, or continue with Google when it is configured.
          </p>
        </div>

        {authError && (
          <div className="mb-space-md p-space-sm bg-error-container text-on-error-container font-label-md text-label-md rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{authError}</span>
          </div>
        )}

        <div className="flex flex-col gap-space-md relative z-10">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full py-3 px-4 bg-surface-container-lowest hover:bg-surface-container-low border border-surface-container-high rounded-xl shadow-sm text-primary font-title-md text-body-md flex items-center justify-center gap-3 transition-all cursor-pointer group active:scale-[0.99]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="font-semibold text-primary group-hover:text-primary-container">
              {isAuthenticating ? 'Authorizing with Google...' : 'Continue with Google'}
            </span>
          </button>

          <div className="flex items-center gap-space-sm my-1">
            <div className="h-[1px] flex-1 bg-surface-container"></div>
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              or use email
            </span>
            <div className="h-[1px] flex-1 bg-surface-container"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-space-sm">
            {isRegistering && (
              <div>
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2.5 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-on-tertiary-container"
                />
              </div>
            )}

            <div>
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cadet@university.edu"
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-on-tertiary-container"
              />
            </div>

            <div>
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1 font-semibold">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface border border-surface-container focus:outline-none focus:ring-1 focus:ring-on-tertiary-container"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-primary text-on-primary font-title-md text-body-md rounded-lg shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim">
                {isAuthenticating ? 'progress_activity' : 'key'}
              </span>
              <span>{isAuthenticating ? 'Unlocking Vault...' : isRegistering ? 'Create Account' : 'Access My Capsule Vault'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsRegistering((curr) => !curr)}
            className="text-sm text-primary underline"
          >
            {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};
