/**
 * Email Verification Modal
 * 6-digit OTP code verification for resident registration
 * Barangay Bang-Bang, Cordova, Cebu
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Props {
  isOpen: boolean;
  userId: string;
  email: string;
  demoCode?: string;
  onClose: () => void;
  onVerified: () => void;
}

export const EmailVerificationModal: React.FC<Props> = ({
  isOpen,
  userId,
  email,
  demoCode = '749201',
  onClose,
  onVerified
}) => {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const { showToast } = useToast();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [currentDemoCode, setCurrentDemoCode] = useState(demoCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (demoCode) setCurrentDemoCode(demoCode);
  }, [demoCode]);

  useEffect(() => {
    if (!isOpen) return;
    setDigits(['', '', '', '', '', '']);
    setError(null);
    setResendCooldown(45);
    setCanResend(false);

    // Auto focus first input
    setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 100);

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric characters
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Move to next input if filled
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (char && index === 5 && newDigits.every((d) => d !== '')) {
      handleComplete(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...digits];
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i];
    }
    setDigits(newDigits);
    if (paste.length === 6) {
      handleComplete(paste);
    } else {
      inputsRef.current[Math.min(5, paste.length)]?.focus();
    }
  };

  const handleComplete = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      await verifyEmail(userId, email, code);
      showToast({
        type: 'success',
        title: 'Account Activated',
        message: 'Your email address has been verified successfully. Welcome to Barangay Bang-Bang!',
        duration: 7000
      });
      onVerified();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    handleComplete(code);
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const newCode = await resendVerificationCode(userId, email);
      setCurrentDemoCode(newCode);
      setCanResend(false);
      setResendCooldown(45);
      showToast({
        type: 'info',
        title: 'Code Dispatched',
        message: `A new 6-digit verification code has been dispatched to ${email}.`,
        duration: 5000
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const quickFillDemo = () => {
    const chars = currentDemoCode.split('').slice(0, 6);
    setDigits(chars);
    handleComplete(currentDemoCode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100/80 text-emerald-900 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Verify Your Email
              </h2>
              <p className="text-xs text-neutral-500">Barangay Bang-Bang Citizen Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-neutral-600 leading-relaxed">
            We have dispatched a 6-digit citizen verification code to:
          </p>
          <p className="text-sm font-bold text-neutral-900 mt-1 font-mono bg-neutral-100 py-1 px-3 rounded-lg inline-block">
            {email}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Please enter the OTP code below to activate your household account.
          </p>
        </div>

        {/* Demo Fast-Fill Helper Chip */}
        {currentDemoCode && (
          <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Simulator OTP Code
              </span>
              <span className="text-base font-mono font-extrabold text-emerald-950 tracking-widest">
                {currentDemoCode}
              </span>
            </div>
            <button
              type="button"
              onClick={quickFillDemo}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-2xs transition-colors"
            >
              1-Click Auto Fill
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-5">
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all shadow-2xs"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-neutral-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verifying Citizen Code...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Activate Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Didn't receive the code?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Code
            </button>
          ) : (
            <span className="font-mono text-neutral-400">Resend in {resendCooldown}s</span>
          )}
        </div>
      </div>
    </div>
  );
};
