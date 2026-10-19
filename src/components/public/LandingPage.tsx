/**
 * Public Landing Page with Integrated Login UI, Registration Form, and Email Verification
 * Barangay Bang-Bang, Cordova, Cebu, Philippines
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  CalendarDays,
  Home,
  Users,
  Receipt,
  FileCheck2,
  CheckCircle2,
  Megaphone,
  ArrowRight,
  Lock,
  UserPlus,
  LogIn,
  AlertCircle,
  Clock,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { CollectionSchedule, Announcement, Purok, UserRole } from '../../types';
import { api } from '../../services/api';
import { EmailVerificationModal } from '../auth/EmailVerificationModal';

interface Props {
  onEnterApp: () => void;
  onOpenForgotPassword?: () => void;
}

export const LandingPage: React.FC<Props> = ({ onEnterApp, onOpenForgotPassword }) => {
  const { user, login, register, switchRoleDemo, loading } = useAuth();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const sealImg = '/src/assets/images/bangbang_barangay_seal_1792417995677.jpg';
  const heroImg = '/src/assets/images/bangbang_waste_hero_1792417996689.jpg';

  // Public Data State
  const [schedules, setSchedules] = useState<CollectionSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [puroks, setPuroks] = useState<Purok[]>([]);

  // Auth Card Tab: 'login' | 'register'
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regPurokId, setRegPurokId] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regFamilyMembers, setRegFamilyMembers] = useState('3');
  const [regError, setRegError] = useState<string | null>(null);

  // Email Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyUserId, setVerifyUserId] = useState('');
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('');
  const [verifyDemoCode, setVerifyDemoCode] = useState('');

  useEffect(() => {
    async function loadPublicData() {
      try {
        const [schedData, annData, purData] = await Promise.all([
          api.getSchedules().catch(() => [] as CollectionSchedule[]),
          api.getAnnouncements().catch(() => [] as Announcement[]),
          api.getPuroks().catch(() => [] as Purok[])
        ]);
        setSchedules(schedData);
        setAnnouncements(annData);
        setPuroks(purData);
        if (purData.length > 0 && !regPurokId) setRegPurokId(purData[0].id);
      } catch (err) {
        console.error('Failed to load public portal data:', err);
      }
    }
    loadPublicData();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await login(loginIdentifier, loginPassword);
      showToast({
        type: 'success',
        title: 'Sign In Successful',
        message: 'Welcome back to Barangay Bang-Bang Garbage Monitoring System.'
      });
      onEnterApp();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    try {
      const res = await register({
        full_name: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
        contact_number: regContact,
        purok_id: regPurokId,
        address_details: regAddress,
        family_member_count: Number(regFamilyMembers) || 1
      });

      if (res?.require_verification && res.user_id && res.email) {
        setVerifyUserId(res.user_id);
        setVerifyEmailAddr(res.email);
        setVerifyDemoCode(res.demo_code || '749201');
        setVerifyModalOpen(true);
      } else {
        showToast({
          type: 'success',
          title: 'Household Registered',
          message: 'Welcome to Barangay Bang-Bang Smart Waste System.'
        });
        onEnterApp();
      }
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    await switchRoleDemo(role);
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-['Public_Sans',sans-serif] transition-colors">
      {/* 1. TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8 transition-colors">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={sealImg}
            alt="Barangay Bang-Bang Crest"
            className="w-10 h-10 rounded-full object-cover border border-emerald-300 dark:border-emerald-700/60 shadow-2xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight block leading-tight">
              Barangay Bang-Bang
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">
              Cordova, Cebu · Solid Waste Management
            </span>
          </div>
        </div>

        {/* Zone 2: Clean single-line links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          <a href="#about" className="hover:text-emerald-900 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">
            About System
          </a>
          <a href="#puroks" className="hover:text-emerald-900 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">
            7 Puroks
          </a>
          <a href="#schedules" className="hover:text-emerald-900 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">
            Collection Schedules
          </a>
          <a href="#announcements" className="hover:text-emerald-900 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">
            Barangay Advisories
          </a>
          <a href="#auth-section" className="hover:text-emerald-900 dark:hover:text-emerald-400 transition-colors whitespace-nowrap">
            Portal Access
          </a>
        </nav>

        {/* Zone 3: Primary Action & Dark Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600 hover:text-neutral-900 transition-transform hover:-rotate-12" />
            )}
          </button>

          {user ? (
            <button
              onClick={onEnterApp}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a
              href="#auth-section"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              Sign In / Register
            </a>
          )}
        </div>
      </header>

      {/* 2. HERO SPLIT SECTION WITH INTEGRATED AUTH UI */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white py-12 lg:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Vision & Mission */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 border border-emerald-600/40 rounded-full text-xs font-semibold text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Official Waste Monitoring Platform · Cordova, Cebu</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-tight text-white">
              Cleaner, Smarter, Sustainable Barangay Bang-Bang
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
              An integrated municipal platform for Barangay Captain Artemio Degamo, 7 Purok Leaders, assigned garbage collectors, and registered households. Schedule collection trucks, inspect segregation compliance, audit ₱5.00 weekly fees, and issue certified purok endorsements.
            </p>

            {/* Quick Fast-Role Evaluation Strip */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider block mb-2">
                Evaluator 1-Click Role Switcher:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickRole('admin')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Captain (Admin)
                </button>
                <button
                  onClick={() => handleQuickRole('collector')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Collector (Danilo)
                </button>
                <button
                  onClick={() => handleQuickRole('leader')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Purok Leader (Rolando)
                </button>
                <button
                  onClick={() => handleQuickRole('resident')}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Resident (Maria)
                </button>
              </div>
            </div>

            {/* Key Value Points */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-800/60 max-w-lg">
              <div>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white block">7</span>
                <span className="text-[11px] text-emerald-200">Bang-Bang Puroks</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white block">₱5.00</span>
                <span className="text-[11px] text-emerald-200">Weekly Eco-Fee</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white block">100%</span>
                <span className="text-[11px] text-emerald-200">Segregation Law</span>
              </div>
            </div>
          </div>

          {/* Right Column: Integrated Login & Registration Form Card */}
          <div className="lg:col-span-5" id="auth-section">
            <div className="bg-white text-neutral-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-neutral-200">
              {/* Tab Selector */}
              <div className="flex p-1 bg-neutral-100 rounded-xl mb-5">
                <button
                  onClick={() => setAuthTab('login')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'login'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => setAuthTab('register')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'register'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register Household
                </button>
              </div>

              {/* LOGIN TAB */}
              {authTab === 'login' && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
                      Sign In to Your Account
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      For Residents, Purok Leaders, Collectors, and Captain.
                    </p>
                  </div>

                  {loginError && (
                    <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-1">
                        Username or Email
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="captain.degamo or email@example.com"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-neutral-900 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-neutral-700 font-semibold">
                          Password
                        </label>
                        {onOpenForgotPassword && (
                          <button
                            type="button"
                            onClick={onOpenForgotPassword}
                            className="text-[11px] text-emerald-800 font-medium hover:underline"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full p-2.5 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-neutral-900 outline-none"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        Default seed password: <code>Password123!</code>
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Dashboard</span>
                    </button>
                  </form>

                  <div className="mt-4 pt-3 border-t border-neutral-100 text-center text-xs text-neutral-500">
                    <span>Don't have an account? </span>
                    <button
                      onClick={() => setAuthTab('register')}
                      className="text-emerald-800 font-bold hover:underline"
                    >
                      Register your household
                    </button>
                  </div>
                </div>
              )}

              {/* REGISTER TAB WITH EMAIL VERIFICATION INTEGRATION */}
              {authTab === 'register' && (
                <div>
                  <div className="mb-3">
                    <h2 className="text-lg font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
                      Register Bang-Bang Household
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      New resident registration requires 6-digit email verification.
                    </p>
                  </div>

                  {regError && (
                    <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-neutral-700 font-semibold mb-0.5">
                        Head of Household Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Maria Clara Deatras"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-700 font-semibold mb-0.5">Username</label>
                        <input
                          type="text"
                          required
                          placeholder="maria.clara"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-700 font-semibold mb-0.5">Contact Number</label>
                        <input
                          type="text"
                          placeholder="0917-000-0000"
                          value={regContact}
                          onChange={(e) => setRegContact(e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-0.5">
                        Email Address (Requires Verification)
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="maria@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-700 font-semibold mb-0.5">Purok in Bang-Bang</label>
                        <select
                          value={regPurokId}
                          onChange={(e) => setRegPurokId(e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                          required
                        >
                          {puroks.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-700 font-semibold mb-0.5">Family Members</label>
                        <input
                          type="number"
                          min="1"
                          value={regFamilyMembers}
                          onChange={(e) => setRegFamilyMembers(e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-0.5">Sitio / House Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Sitio Seaside, near Mangga Chapel"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-0.5">Create Password</label>
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white text-neutral-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Proceed to Email Verification</span>
                    </button>
                  </form>

                  <div className="mt-3 pt-2 border-t border-neutral-100 text-center text-xs text-neutral-500">
                    <span>Already registered? </span>
                    <button
                      onClick={() => setAuthTab('login')}
                      className="text-emerald-800 font-bold hover:underline"
                    >
                      Sign In here
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE SYSTEM WORKFLOWS SECTION */}
      <section id="about" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800 block mb-1">
            Standard Operating Procedures
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
            How Garbage Monitoring Operates in Bang-Bang
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Designed to comply strictly with Republic Act 9003 (Ecological Solid Waste Management Act) and local Cordova ordinances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1.5">Collection Dispatch</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Barangay Captain schedules compactor routes. Collectors start routes, log volumes in kg, and record completion timestamps.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1.5">Disposal Verification</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Residents log segregated waste bags set out at their gate. The assigned Purok Leader inspects and verifies participation.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1.5">Weekly Contribution</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Each household contributes ₱5.00/week for fuel maintenance and sweepers via GCash, Maya, or cash confirmed by the Leader.
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1.5">Purok Endorsement</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Purok Leader has final approval authority to issue official printable waste compliance clearances with security reference codes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 7 PUROKS DIRECTORY */}
      <section id="puroks" className="py-14 px-4 sm:px-8 bg-neutral-100/70 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800 block mb-1">
                Territorial Coverage
              </span>
              <h2 className="text-2xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
                7 Puroks of Barangay Bang-Bang
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Each Purok is led by an assigned Leader who oversees local household waste compliance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {puroks.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-neutral-900">{p.name}</h3>
                  <span className="text-[10px] font-mono font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {p.households_count || 1} Households
                  </span>
                </div>
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-3">
                  {p.description}
                </p>
                <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 space-y-1">
                  <div>
                    <span className="font-semibold text-neutral-700">Collection Days: </span>
                    {p.target_collection_days}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700">Purok Leader: </span>
                    {p.leader_name || 'Rolando Cabigas'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LIVE PUBLIC COLLECTION SCHEDULES */}
      <section id="schedules" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800 block mb-1">
              Public Schedule Board
            </span>
            <h2 className="text-2xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Garbage Collection Timetable
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Official truck routes dispatched by Barangay Captain Artemio Degamo.
            </p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80 text-neutral-500 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Purok Sector</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Waste Stream</th>
                  <th className="py-3 px-4">Assigned Collector</th>
                  <th className="py-3 px-4 text-right">Route Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/70">
                    <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">{s.scheduled_date}</td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900">{s.purok_name}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-600">{s.time_slot}</td>
                    <td className="py-3.5 px-4 text-emerald-900 font-semibold">{s.waste_type}</td>
                    <td className="py-3.5 px-4 text-neutral-700">{s.collector_name}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          s.status === 'In Progress'
                            ? 'text-sky-800 bg-sky-50 border-sky-200 animate-pulse'
                            : s.status === 'Completed'
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. BARANGAY ADVISORIES & ANNOUNCEMENTS */}
      <section id="announcements" className="py-14 px-4 sm:px-8 bg-neutral-100/70 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-800 block mb-1">
              Public Advisories
            </span>
            <h2 className="text-2xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Barangay Bang-Bang Bulletins
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Official solid waste policies, typhoon adjustments, and eco-initiatives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs hover:border-neutral-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-900">
                      {ann.category}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 leading-snug">{ann.title}</h3>
                  <p className="mt-2 text-xs text-neutral-600 leading-relaxed line-clamp-4">
                    {ann.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>Author: Barangay Captain</span>
                  <span>Priority: {ann.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-neutral-900 text-neutral-300 py-12 px-4 sm:px-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <img
                src={sealImg}
                alt="Barangay Bang-Bang"
                className="w-8 h-8 rounded-full object-cover border border-emerald-500"
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                Barangay Bang-Bang, Cordova, Cebu
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed max-w-md">
              Official Smart Garbage Monitoring and Solid Waste Accountability System. Supporting Republic Act 9003 for ecological conservation of Cordova coastal communities.
            </p>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-2">
              Barangay Hall
            </span>
            <p className="text-neutral-400 leading-relaxed">
              Barangay Bang-Bang Hall<br />
              Municipality of Cordova, Province of Cebu<br />
              Hotline: (032) 496-8120 / +63 917 849 2031
            </p>
          </div>

          <div>
            <span className="font-bold text-white uppercase tracking-wider block mb-2">
              Quick Links
            </span>
            <ul className="space-y-1.5 text-neutral-400">
              <li><a href="#about" className="hover:text-white">How It Works</a></li>
              <li><a href="#puroks" className="hover:text-white">Purok Leaders</a></li>
              <li><a href="#schedules" className="hover:text-white">Truck Schedules</a></li>
              <li><a href="#auth-section" className="hover:text-white">Resident Portal</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-neutral-800 text-[11px] text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Barangay Bang-Bang, Cordova, Cebu. BS Information Technology Capstone Project.</span>
          <span>Republic Act 9003 · Ecological Solid Waste Management</span>
        </div>
      </footer>

      {/* 8. EMAIL VERIFICATION MODAL */}
      <EmailVerificationModal
        isOpen={verifyModalOpen}
        userId={verifyUserId}
        email={verifyEmailAddr}
        demoCode={verifyDemoCode}
        onClose={() => setVerifyModalOpen(false)}
        onVerified={() => {
          setVerifyModalOpen(false);
          onEnterApp();
        }}
      />
    </div>
  );
};
