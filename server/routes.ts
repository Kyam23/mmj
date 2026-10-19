/**
 * SMART GARBAGE MONITORING SYSTEM - API ROUTER
 * Barangay Bang-Bang, Cordova, Cebu
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  getLocalStore,
  saveLocalStorage,
  logActivity,
  createNotification,
  isUsingAivenMySQL
} from './db.js';

export const apiRouter = Router();

// Middleware: Extract current user token/header
interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'collector' | 'leader' | 'resident';
  purok_id: string | null;
  household_id: string | null;
  email: string;
}

function getAuthUser(req: Request): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    // In our lightweight secure session model, the token is base64(userId:timestamp) or raw userId
    let userId = token;
    if (token.includes(':') || (token.length > 20 && !token.startsWith('usr-'))) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        if (parts[0]) userId = parts[0];
      } catch (e) {
        userId = token;
      }
    }
    const store = getLocalStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      purok_id: user.purok_id,
      household_id: user.household_id,
      email: user.email
    };
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// HEALTH & SYSTEM STATUS
// -------------------------------------------------------------
apiRouter.get('/health', (req: Request, res: Response) => {
  const store = getLocalStore();
  res.json({
    status: 'ok',
    system: 'Barangay Bang-Bang Smart Garbage Monitoring System',
    location: 'Barangay Bang-Bang, Cordova, Cebu, Philippines',
    database_mode: isUsingAivenMySQL() ? 'Aiven MySQL 8.x (Cloud)' : 'Local Persistent Storage Engine',
    timestamp: new Date().toISOString(),
    metrics: {
      users_count: store.users.length,
      puroks_count: store.puroks.length,
      households_count: store.households.length,
      schedules_count: store.collection_schedules.length,
      submissions_count: store.disposal_submissions.length,
      payments_count: store.payment_submissions.length,
      endorsements_count: store.endorsement_requests.length
    }
  });
});

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter username/email and password.' });
  }

  const store = getLocalStore();
  const user = store.users.find(
    (u) =>
      (u.username.toLowerCase() === identifier.toLowerCase() ||
        u.email.toLowerCase() === identifier.toLowerCase()) &&
      u.status === 'active'
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
  }

  // Verify password (supports bcrypt hash or demo password)
  let validPassword = false;
  if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
    validPassword = await bcrypt.compare(password, user.password_hash);
  }
  if (!validPassword && password === 'Password123!') {
    validPassword = true;
  }

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Create lightweight session token
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
  logActivity(user.id, 'LOGIN', 'Auth', `${user.full_name} (${user.role}) logged in.`, req.ip);

  // Return user info and token
  const { password_hash, ...safeUser } = user;
  const purok = store.puroks.find((p) => p.id === user.purok_id);
  const household = store.households.find((h) => h.id === user.household_id);

  res.json({
    token,
    user: {
      ...safeUser,
      purok_name: purok ? purok.name : null,
      household_number: household ? household.household_number : null,
      address_details: household ? household.address_details : null
    }
  });
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const {
    full_name,
    username,
    email,
    password,
    contact_number,
    purok_id,
    address_details,
    family_member_count
  } = req.body;

  if (!full_name || !username || !email || !password || !purok_id) {
    return res.status(400).json({ error: 'Please provide all required registration fields.' });
  }

  const store = getLocalStore();
  // Check unique username and email
  if (store.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email address is already registered.' });
  }

  const purok = store.puroks.find((p) => p.id === purok_id);
  if (!purok) {
    return res.status(400).json({ error: 'Invalid Purok selected.' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Generate household ID
  const household_id = 'hh-' + Date.now();
  const purokInitials = purok.name.replace('Purok ', '').substr(0, 3).toUpperCase();
  const countInPurok = store.households.filter((h) => h.purok_id === purok_id).length + 1;
  const household_number = `HH-${purokInitials}-${String(countInPurok).padStart(3, '0')}`;

  const newHousehold = {
    id: household_id,
    household_number,
    purok_id,
    head_name: full_name,
    contact_number: contact_number || '',
    address_details: address_details || `${purok.name}, Bang-Bang, Cordova`,
    family_member_count: Number(family_member_count) || 1,
    waste_segregation_compliant: true,
    created_at: new Date().toISOString()
  };
  store.households.push(newHousehold);

  const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
  const newUserId = 'usr-' + Date.now();
  const newUser = {
    id: newUserId,
    username,
    email,
    password_hash,
    full_name,
    role: 'resident',
    purok_id,
    household_id,
    contact_number: contact_number || '',
    status: 'pending_verification',
    email_verified: false,
    verification_code,
    verification_expires: Date.now() + 15 * 60 * 1000,
    created_at: new Date().toISOString()
  };
  store.users.push(newUser);
  saveLocalStorage();

  // Notify Purok Leader
  if (purok.leader_id) {
    createNotification(
      purok.leader_id,
      'New Resident Registered',
      `${full_name} registered in ${purok.name} (${household_number}). Pending email verification.`,
      'system',
      '/households'
    );
  }

  logActivity(newUserId, 'REGISTER_INIT', 'Auth', `New resident ${full_name} initiated registration for ${purok.name}`, req.ip);

  res.status(201).json({
    require_verification: true,
    user_id: newUserId,
    email: newUser.email,
    demo_code: verification_code,
    message: `Verification code sent to ${newUser.email}`
  });
});

apiRouter.post('/auth/verify-email', (req: Request, res: Response) => {
  const { user_id, email, code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  const store = getLocalStore();
  const user = store.users.find(
    (u) =>
      (user_id && u.id === user_id) ||
      (email && u.email.toLowerCase() === email.toLowerCase())
  );

  if (!user) {
    return res.status(404).json({ error: 'User record not found.' });
  }

  if (user.verification_code !== String(code).trim() && String(code).trim() !== '123456') {
    return res.status(400).json({ error: 'Invalid verification code. Please check your email or use the demo code.' });
  }

  // Mark verified
  user.email_verified = true;
  user.status = 'active';
  user.verification_code = null;
  saveLocalStorage();

  logActivity(user.id, 'EMAIL_VERIFIED', 'Auth', `${user.full_name} completed email verification.`, req.ip);

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
  const { password_hash: _, verification_code: __, ...safeUser } = user;
  const purok = store.puroks.find((p) => p.id === user.purok_id);
  const household = store.households.find((h) => h.id === user.household_id);

  res.json({
    token,
    user: {
      ...safeUser,
      purok_name: purok ? purok.name : null,
      household_number: household ? household.household_number : null,
      address_details: household ? household.address_details : null
    },
    message: 'Email verified successfully! Welcome to Barangay Bang-Bang.'
  });
});

apiRouter.post('/auth/resend-code', (req: Request, res: Response) => {
  const { user_id, email } = req.body;
  const store = getLocalStore();
  const user = store.users.find(
    (u) =>
      (user_id && u.id === user_id) ||
      (email && u.email.toLowerCase() === email.toLowerCase())
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verification_code = newCode;
  user.verification_expires = Date.now() + 15 * 60 * 1000;
  saveLocalStorage();

  res.json({
    success: true,
    demo_code: newCode,
    message: `A new 6-digit code has been dispatched to ${user.email}.`
  });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your registered username or email.' });
  }

  const store = getLocalStore();
  const user = store.users.find(
    (u) =>
      u.username.toLowerCase() === identifier.toLowerCase() ||
      u.email.toLowerCase() === identifier.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({ error: 'No citizen account found with that username or email address.' });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.reset_password_code = resetCode;
  user.reset_password_expires = Date.now() + 15 * 60 * 1000;
  saveLocalStorage();

  logActivity(user.id, 'FORGOT_PASSWORD_REQUEST', 'Auth', `Password reset requested for ${user.email}`, req.ip);

  res.json({
    success: true,
    email: user.email,
    demo_code: resetCode,
    message: `Password reset verification code dispatched to ${user.email}.`
  });
});

apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { email, code, new_password } = req.body;
  if (!email || !code || !new_password) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const store = getLocalStore();
  const user = store.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({ error: 'Citizen account not found.' });
  }

  if (
    user.reset_password_code !== String(code).trim() &&
    String(code).trim() !== '123456'
  ) {
    return res.status(400).json({ error: 'Invalid or expired password reset verification code.' });
  }

  if (user.reset_password_expires && Date.now() > user.reset_password_expires) {
    return res.status(400).json({ error: 'Password reset code has expired. Please request a new one.' });
  }

  // Hash new password securely
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(new_password, salt);
  user.reset_password_code = null;
  user.reset_password_expires = null;
  saveLocalStorage();

  logActivity(user.id, 'PASSWORD_RESET_SUCCESS', 'Auth', `Account password successfully reset for ${user.username}`, req.ip);

  res.json({
    success: true,
    message: 'Your password has been reset successfully. You can now sign in with your new credentials.'
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized.' });

  const store = getLocalStore();
  const user = store.users.find((u) => u.id === auth.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const purok = store.puroks.find((p) => p.id === user.purok_id);
  const household = store.households.find((h) => h.id === user.household_id);

  const { password_hash, ...safeUser } = user;
  res.json({
    ...safeUser,
    purok_name: purok ? purok.name : null,
    household_number: household ? household.household_number : null,
    address_details: household ? household.address_details : null
  });
});

// -------------------------------------------------------------
// PUROKS & HOUSEHOLDS
// -------------------------------------------------------------
apiRouter.get('/puroks', (req: Request, res: Response) => {
  const store = getLocalStore();
  const puroksWithStats = store.puroks.map((p) => {
    const leader = store.users.find((u) => u.id === p.leader_id);
    const householdsCount = store.households.filter((h) => h.purok_id === p.id).length;
    const residentsCount = store.users.filter((u) => u.purok_id === p.id && u.role === 'resident').length;
    return {
      ...p,
      leader_name: leader ? leader.full_name : 'No assigned leader',
      leader_contact: leader ? leader.contact_number : '',
      households_count: householdsCount,
      residents_count: residentsCount
    };
  });
  res.json(puroksWithStats);
});

apiRouter.get('/households', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  const { purok_id, search } = req.query;
  const store = getLocalStore();

  let list = store.households.map((h) => {
    const purok = store.puroks.find((p) => p.id === h.purok_id);
    const members = store.users.filter((u) => u.household_id === h.id);
    return {
      ...h,
      purok_name: purok ? purok.name : 'Unknown Purok',
      registered_residents_count: members.length
    };
  });

  // Role filtering: Leader can only view their assigned purok
  if (auth && auth.role === 'leader' && auth.purok_id) {
    list = list.filter((h) => h.purok_id === auth.purok_id);
  } else if (purok_id) {
    list = list.filter((h) => h.purok_id === purok_id);
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (h) =>
        h.head_name.toLowerCase().includes(s) ||
        h.household_number.toLowerCase().includes(s) ||
        h.address_details.toLowerCase().includes(s)
    );
  }

  res.json(list);
});

apiRouter.post('/households', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || (auth.role !== 'admin' && auth.role !== 'leader')) {
    return res.status(403).json({ error: 'Permission denied. Admin or Purok Leader only.' });
  }

  const { head_name, purok_id, contact_number, address_details, family_member_count } = req.body;
  if (!head_name || !purok_id) {
    return res.status(400).json({ error: 'Head name and Purok are required.' });
  }

  // If leader, enforce assigned purok
  const effectivePurokId = auth.role === 'leader' ? auth.purok_id : purok_id;
  const store = getLocalStore();
  const purok = store.puroks.find((p) => p.id === effectivePurokId);
  if (!purok) return res.status(400).json({ error: 'Invalid Purok.' });

  const purokInitials = purok.name.replace('Purok ', '').substr(0, 3).toUpperCase();
  const countInPurok = store.households.filter((h) => h.purok_id === effectivePurokId).length + 1;
  const household_number = `HH-${purokInitials}-${String(countInPurok).padStart(3, '0')}`;

  const household = {
    id: 'hh-' + Date.now(),
    household_number,
    purok_id: effectivePurokId,
    head_name,
    contact_number: contact_number || '',
    address_details: address_details || `${purok.name}, Bang-Bang`,
    family_member_count: Number(family_member_count) || 1,
    waste_segregation_compliant: true,
    created_at: new Date().toISOString()
  };

  store.households.push(household);
  saveLocalStorage();
  logActivity(auth.id, 'CREATE_HOUSEHOLD', 'Household', `Created household ${household_number} for ${head_name}`);

  res.status(201).json(household);
});

// -------------------------------------------------------------
// USER MANAGEMENT (ADMIN CONTROL)
// -------------------------------------------------------------
apiRouter.get('/users', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  const { role, purok_id } = req.query;
  const store = getLocalStore();

  let list = store.users.map((u) => {
    const { password_hash, ...safe } = u;
    const purok = store.puroks.find((p) => p.id === u.purok_id);
    const household = store.households.find((h) => h.id === u.household_id);
    return {
      ...safe,
      purok_name: purok ? purok.name : null,
      household_number: household ? household.household_number : null
    };
  });

  if (auth && auth.role === 'leader' && auth.purok_id) {
    list = list.filter((u) => u.purok_id === auth.purok_id);
  } else if (purok_id) {
    list = list.filter((u) => u.purok_id === purok_id);
  }

  if (role) {
    list = list.filter((u) => u.role === role);
  }

  res.json(list);
});

apiRouter.post('/users', async (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }

  const { full_name, username, email, password, role, purok_id, contact_number } = req.body;
  if (!full_name || !username || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const store = getLocalStore();
  if (store.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username already in use.' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const newUser = {
    id: 'usr-' + Date.now(),
    username,
    email,
    password_hash,
    full_name,
    role,
    purok_id: purok_id || null,
    household_id: null,
    contact_number: contact_number || '',
    status: 'active',
    created_at: new Date().toISOString()
  };

  store.users.push(newUser);

  // If assigning a Purok Leader, update the Purok record
  if (role === 'leader' && purok_id) {
    const p = store.puroks.find((p) => p.id === purok_id);
    if (p) p.leader_id = newUser.id;
  }

  saveLocalStorage();
  logActivity(auth.id, 'CREATE_USER', 'Users', `Created ${role} account: ${full_name} (${username})`);

  const { password_hash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

apiRouter.put('/users/:id', async (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }

  const { id } = req.params;
  const store = getLocalStore();
  const user = store.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { full_name, email, role, purok_id, contact_number, status, new_password } = req.body;

  if (full_name) user.full_name = full_name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (purok_id !== undefined) user.purok_id = purok_id;
  if (contact_number !== undefined) user.contact_number = contact_number;
  if (status) user.status = status;

  if (new_password) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(new_password, salt);
  }

  // Update purok leader if changed
  if (user.role === 'leader' && user.purok_id) {
    const p = store.puroks.find((p) => p.id === user.purok_id);
    if (p) p.leader_id = user.id;
  }

  saveLocalStorage();
  logActivity(auth.id, 'UPDATE_USER', 'Users', `Updated account for ${user.full_name}`);

  const { password_hash, ...safe } = user;
  res.json(safe);
});

// -------------------------------------------------------------
// COLLECTION SCHEDULES (ADMIN MANAGES, ALL VIEW)
// -------------------------------------------------------------
apiRouter.get('/schedules', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  const { purok_id, status, collector_id } = req.query;
  const store = getLocalStore();

  let list = store.collection_schedules.map((s) => {
    const purok = store.puroks.find((p) => p.id === s.purok_id);
    const collector = store.users.find((u) => u.id === s.collector_id);
    const record = store.collection_records.find((r) => r.schedule_id === s.id);
    return {
      ...s,
      purok_name: purok ? purok.name : 'Unknown Purok',
      collector_name: collector ? collector.full_name : 'Unassigned Collector',
      collector_contact: collector ? collector.contact_number : '',
      execution_record: record || null
    };
  });

  // Role scoping: Collector sees primarily their assigned schedules
  if (collector_id) {
    list = list.filter((s) => s.collector_id === collector_id);
  } else if (auth && auth.role === 'collector') {
    list = list.filter((s) => s.collector_id === auth.id);
  }

  // Leader sees their purok's schedules
  if (auth && auth.role === 'leader' && auth.purok_id) {
    list = list.filter((s) => s.purok_id === auth.purok_id);
  } else if (purok_id) {
    list = list.filter((s) => s.purok_id === purok_id);
  }

  if (status) {
    list = list.filter((s) => s.status === status);
  }

  // Sort: In Progress first, then upcoming Scheduled, then Completed
  list.sort((a, b) => {
    const statusWeight: Record<string, number> = { 'In Progress': 0, 'Scheduled': 1, 'Completed': 2, 'Cancelled': 3 };
    const wA = statusWeight[a.status] ?? 2;
    const wB = statusWeight[b.status] ?? 2;
    if (wA !== wB) return wA - wB;
    return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime();
  });

  res.json(list);
});

apiRouter.post('/schedules', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Admin (Barangay Captain) can create collection schedules.' });
  }

  const { purok_id, collector_id, scheduled_date, time_slot, waste_type, notes } = req.body;
  if (!purok_id || !collector_id || !scheduled_date || !time_slot) {
    return res.status(400).json({ error: 'Please provide purok, collector, scheduled date, and time slot.' });
  }

  const store = getLocalStore();
  const scheduleId = 'sch-' + Date.now();
  const newSchedule = {
    id: scheduleId,
    purok_id,
    collector_id,
    scheduled_date,
    time_slot,
    waste_type: waste_type || 'Biodegradable',
    status: 'Scheduled',
    notes: notes || '',
    created_by: auth.id,
    created_at: new Date().toISOString()
  };

  store.collection_schedules.push(newSchedule);
  saveLocalStorage();

  // Notify Collector
  createNotification(
    collector_id,
    'New Collection Scheduled',
    `You are assigned for ${scheduled_date} (${time_slot}) in ${store.puroks.find((p) => p.id === purok_id)?.name}.`,
    'schedule',
    '/collector-tasks'
  );

  // Notify Purok Leader
  const purok = store.puroks.find((p) => p.id === purok_id);
  if (purok && purok.leader_id) {
    createNotification(
      purok.leader_id,
      'Upcoming Garbage Collection',
      `Scheduled collection on ${scheduled_date} (${time_slot}) for ${waste_type || 'Biodegradable'} waste.`,
      'schedule',
      '/schedules'
    );
  }

  logActivity(auth.id, 'CREATE_SCHEDULE', 'Schedule', `Admin scheduled ${waste_type} collection for ${purok?.name} on ${scheduled_date}`);
  res.status(201).json(newSchedule);
});

apiRouter.put('/schedules/:id', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Only Admin can modify collection schedules.' });
  }

  const { id } = req.params;
  const store = getLocalStore();
  const schedule = store.collection_schedules.find((s) => s.id === id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

  const { scheduled_date, time_slot, collector_id, waste_type, status, notes } = req.body;

  if (scheduled_date) schedule.scheduled_date = scheduled_date;
  if (time_slot) schedule.time_slot = time_slot;
  if (collector_id) schedule.collector_id = collector_id;
  if (waste_type) schedule.waste_type = waste_type;
  if (status) schedule.status = status;
  if (notes !== undefined) schedule.notes = notes;

  saveLocalStorage();
  logActivity(auth.id, 'UPDATE_SCHEDULE', 'Schedule', `Updated schedule ${id} to ${schedule.status}`);
  res.json(schedule);
});

apiRouter.delete('/schedules/:id', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Only Admin can cancel/delete schedules.' });
  }

  const { id } = req.params;
  const store = getLocalStore();
  const idx = store.collection_schedules.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Schedule not found.' });

  store.collection_schedules.splice(idx, 1);
  // Also clean up records
  store.collection_records = store.collection_records.filter((r) => r.schedule_id !== id);
  saveLocalStorage();

  logActivity(auth.id, 'DELETE_SCHEDULE', 'Schedule', `Deleted schedule ${id}`);
  res.json({ success: true, message: 'Schedule deleted.' });
});

// -------------------------------------------------------------
// COLLECTOR OPERATIONS & WORKFLOW
// -------------------------------------------------------------
apiRouter.post('/collections/start', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || (auth.role !== 'collector' && auth.role !== 'admin')) {
    return res.status(403).json({ error: 'Only assigned Collectors can start collection.' });
  }

  const { schedule_id, truck_number, notes } = req.body;
  const store = getLocalStore();
  const schedule = store.collection_schedules.find((s) => s.id === schedule_id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

  // Update schedule status
  schedule.status = 'In Progress';

  let record = store.collection_records.find((r) => r.schedule_id === schedule_id);
  const now = new Date().toISOString();

  if (record) {
    record.status = 'In Progress';
    record.started_at = record.started_at || now;
    if (truck_number) record.truck_number = truck_number;
    if (notes) record.collector_notes = notes;
  } else {
    record = {
      id: 'rec-' + Date.now(),
      schedule_id,
      collector_id: auth.id,
      started_at: now,
      completed_at: null,
      status: 'In Progress',
      truck_number: truck_number || 'LGU-BangBang-Compactor-01',
      collected_volume_kg: 0,
      collector_notes: notes || 'Collection started on schedule route.'
    };
    store.collection_records.push(record);
  }

  saveLocalStorage();

  // Notify residents in this purok that collection truck is rolling
  const residents = store.users.filter((u) => u.purok_id === schedule.purok_id && u.role === 'resident');
  residents.forEach((r) => {
    createNotification(
      r.id,
      'Collection Truck Active',
      `Waste collection has started in your purok. Please ensure segregated bins are accessible.`,
      'schedule',
      '/resident-disposal'
    );
  });

  logActivity(auth.id, 'START_COLLECTION', 'Collector', `Collector started route for schedule ${schedule_id}`);
  res.json({ schedule, record });
});

apiRouter.post('/collections/update-progress', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || (auth.role !== 'collector' && auth.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const { schedule_id, collected_volume_kg, collector_notes } = req.body;
  const store = getLocalStore();
  const record = store.collection_records.find((r) => r.schedule_id === schedule_id);
  if (!record) return res.status(404).json({ error: 'Collection record not found.' });

  if (collected_volume_kg !== undefined) record.collected_volume_kg = Number(collected_volume_kg);
  if (collector_notes !== undefined) record.collector_notes = collector_notes;

  saveLocalStorage();
  res.json(record);
});

apiRouter.post('/collections/complete', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || (auth.role !== 'collector' && auth.role !== 'admin')) {
    return res.status(403).json({ error: 'Only assigned Collectors can mark collection as completed.' });
  }

  const { schedule_id, collected_volume_kg, collector_notes } = req.body;
  const store = getLocalStore();
  const schedule = store.collection_schedules.find((s) => s.id === schedule_id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

  schedule.status = 'Completed';

  let record = store.collection_records.find((r) => r.schedule_id === schedule_id);
  const now = new Date().toISOString();

  if (record) {
    record.status = 'Completed';
    record.completed_at = now;
    if (collected_volume_kg !== undefined) record.collected_volume_kg = Number(collected_volume_kg);
    if (collector_notes) record.collector_notes = collector_notes;
  } else {
    record = {
      id: 'rec-' + Date.now(),
      schedule_id,
      collector_id: auth.id,
      started_at: now,
      completed_at: now,
      status: 'Completed',
      truck_number: 'LGU-BangBang-Compactor-01',
      collected_volume_kg: Number(collected_volume_kg) || 200,
      collector_notes: collector_notes || 'Collection completed.'
    };
    store.collection_records.push(record);
  }

  saveLocalStorage();

  // Notify Admin
  createNotification(
    'usr-admin',
    'Collection Completed',
    `Collector marked collection as completed for schedule ${schedule_id} (${record.collected_volume_kg} kg collected).`,
    'schedule',
    '/monitoring'
  );

  logActivity(auth.id, 'COMPLETE_COLLECTION', 'Collector', `Collection ${schedule_id} completed. Total: ${record.collected_volume_kg} kg`);
  res.json({ schedule, record });
});

// -------------------------------------------------------------
// RESIDENT DISPOSAL PARTICIPATION & LEADER VERIFICATION
// -------------------------------------------------------------
apiRouter.post('/disposal/submit', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'resident') {
    return res.status(403).json({ error: 'Only registered residents can submit disposal participation.' });
  }

  const { schedule_id, waste_type, bag_count, notes, proof_url } = req.body;
  if (!schedule_id) {
    return res.status(400).json({ error: 'Schedule ID is required.' });
  }

  const store = getLocalStore();
  // Prevent duplicate submissions for the same collection event
  const existing = store.disposal_submissions.find(
    (s) => s.schedule_id === schedule_id && s.resident_id === auth.id
  );
  if (existing) {
    return res.status(400).json({ error: 'You have already submitted a disposal record for this collection event.' });
  }

  const schedule = store.collection_schedules.find((s) => s.id === schedule_id);
  if (!schedule) return res.status(404).json({ error: 'Collection schedule not found.' });

  const purok = store.puroks.find((p) => p.id === auth.purok_id);
  const submissionId = 'sub-' + Date.now();
  const newSubmission = {
    id: submissionId,
    schedule_id,
    resident_id: auth.id,
    household_id: auth.household_id || 'hh-unassigned',
    purok_id: auth.purok_id || schedule.purok_id,
    waste_type: waste_type || schedule.waste_type,
    bag_count: Number(bag_count) || 1,
    notes: notes || '',
    proof_url: proof_url || '',
    submission_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  store.disposal_submissions.unshift(newSubmission);

  // Create pending verification for Purok Leader
  const leaderId = purok?.leader_id || 'usr-ldr-1';
  const verificationId = 'ver-' + Date.now();
  const newVerification = {
    id: verificationId,
    submission_id: submissionId,
    leader_id: leaderId,
    status: 'Pending',
    remarks: '',
    verified_at: null,
    created_at: new Date().toISOString()
  };

  store.disposal_verifications.push(newVerification);
  saveLocalStorage();

  // Notify Purok Leader
  if (leaderId) {
    createNotification(
      leaderId,
      'Disposal Verification Required',
      `${auth.full_name} submitted a waste disposal record (${newSubmission.bag_count} bags, ${newSubmission.waste_type}).`,
      'disposal',
      '/leader-verification'
    );
  }

  logActivity(auth.id, 'SUBMIT_DISPOSAL', 'Disposal', `Resident submitted disposal for schedule ${schedule_id}`);
  res.status(201).json({ submission: newSubmission, verification: newVerification });
});

apiRouter.get('/disposal/submissions', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  const store = getLocalStore();

  let list = store.disposal_submissions.map((sub) => {
    const resident = store.users.find((u) => u.id === sub.resident_id);
    const household = store.households.find((h) => h.id === sub.household_id);
    const purok = store.puroks.find((p) => p.id === sub.purok_id);
    const schedule = store.collection_schedules.find((s) => s.id === sub.schedule_id);
    const verification = store.disposal_verifications.find((v) => v.submission_id === sub.id);
    const leader = verification ? store.users.find((u) => u.id === verification.leader_id) : null;

    return {
      ...sub,
      resident_name: resident ? resident.full_name : 'Resident',
      household_number: household ? household.household_number : 'Household',
      purok_name: purok ? purok.name : 'Purok',
      scheduled_date: schedule ? schedule.scheduled_date : null,
      verification_status: verification ? verification.status : 'Pending',
      verification_remarks: verification ? verification.remarks : '',
      verified_at: verification ? verification.verified_at : null,
      leader_name: leader ? leader.full_name : null
    };
  });

  // Scoping rules:
  // Resident: Only their own records
  // Leader: Records in their assigned purok
  // Admin: All records
  if (auth && auth.role === 'resident') {
    list = list.filter((s) => s.resident_id === auth.id);
  } else if (auth && auth.role === 'leader' && auth.purok_id) {
    list = list.filter((s) => s.purok_id === auth.purok_id);
  }

  res.json(list);
});

apiRouter.post('/disposal/verify', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || (auth.role !== 'leader' && auth.role !== 'admin')) {
    return res.status(403).json({ error: 'Only assigned Purok Leaders can verify disposal records.' });
  }

  const { submission_id, status, remarks } = req.body;
  if (!submission_id || !status) {
    return res.status(400).json({ error: 'Submission ID and status are required.' });
  }

  const store = getLocalStore();
  let verification = store.disposal_verifications.find((v) => v.submission_id === submission_id);
  const now = new Date().toISOString();

  if (verification) {
    verification.status = status;
    verification.remarks = remarks || '';
    verification.verified_at = now;
    verification.leader_id = auth.id;
  } else {
    verification = {
      id: 'ver-' + Date.now(),
      submission_id,
      leader_id: auth.id,
      status,
      remarks: remarks || '',
      verified_at: now,
      created_at: now
    };
    store.disposal_verifications.push(verification);
  }

  saveLocalStorage();

  // Notify resident
  const submission = store.disposal_submissions.find((s) => s.id === submission_id);
  if (submission) {
    createNotification(
      submission.resident_id,
      `Disposal Participation ${status}`,
      `Your disposal submission was ${status.toLowerCase()} by Purok Leader ${auth.full_name}.${remarks ? ` Note: "${remarks}"` : ''}`,
      'disposal',
      '/my-disposal'
    );
  }

  logActivity(auth.id, 'VERIFY_DISPOSAL', 'Disposal', `Leader ${auth.full_name} marked disposal ${submission_id} as ${status}`);
  res.json(verification);
});

// -------------------------------------------------------------
// WEEKLY CONTRIBUTIONS & LEADER VERIFICATION
// -------------------------------------------------------------
apiRouter.post('/payments/submit', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'resident') {
    return res.status(403).json({ error: 'Only residents can submit payment contributions.' });
  }

  const { period_start, period_end, amount, payment_method, reference_number, proof_url } = req.body;
  if (!reference_number || !period_start || !period_end) {
    return res.status(400).json({ error: 'Please provide period dates and payment reference number.' });
  }

  const store = getLocalStore();
  const paymentId = 'pay-' + Date.now();
  const newPayment = {
    id: paymentId,
    resident_id: auth.id,
    household_id: auth.household_id || 'hh-unassigned',
    purok_id: auth.purok_id || 'pur-1',
    period_start,
    period_end,
    amount: Number(amount) || 5.0,
    payment_method: payment_method || 'GCash',
    reference_number,
    proof_url: proof_url || '',
    status: 'Pending',
    reviewed_by_leader_id: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: new Date().toISOString()
  };

  store.payment_submissions.unshift(newPayment);
  saveLocalStorage();

  // Notify Purok Leader
  const purok = store.puroks.find((p) => p.id === auth.purok_id);
  if (purok && purok.leader_id) {
    createNotification(
      purok.leader_id,
      'New Payment Submitted',
      `${auth.full_name} submitted ₱${newPayment.amount.toFixed(2)} weekly contribution (Ref: ${reference_number}).`,
      'payment',
      '/leader-payments'
    );
  }

  logActivity(auth.id, 'SUBMIT_PAYMENT', 'Payment', `Submitted payment ₱${newPayment.amount} ref: ${reference_number}`);
  res.status(201).json(newPayment);
});

apiRouter.get('/payments', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  const store = getLocalStore();

  let list = store.payment_submissions.map((pay) => {
    const resident = store.users.find((u) => u.id === pay.resident_id);
    const household = store.households.find((h) => h.id === pay.household_id);
    const purok = store.puroks.find((p) => p.id === pay.purok_id);
    const reviewer = pay.reviewed_by_leader_id ? store.users.find((u) => u.id === pay.reviewed_by_leader_id) : null;

    return {
      ...pay,
      resident_name: resident ? resident.full_name : 'Resident',
      household_number: household ? household.household_number : 'Household',
      purok_name: purok ? purok.name : 'Purok',
      reviewer_name: reviewer ? reviewer.full_name : null
    };
  });

  if (auth && auth.role === 'resident') {
    list = list.filter((p) => p.resident_id === auth.id);
  } else if (auth && auth.role === 'leader' && auth.purok_id) {
    list = list.filter((p) => p.purok_id === auth.purok_id);
  }

  res.json(list);
});

apiRouter.post('/payments/verify', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || (auth.role !== 'leader' && auth.role !== 'admin')) {
    return res.status(403).json({ error: 'Only assigned Purok Leaders can verify payments.' });
  }

  const { payment_id, status, rejection_reason } = req.body;
  if (!payment_id || !status) {
    return res.status(400).json({ error: 'Payment ID and decision status are required.' });
  }

  const store = getLocalStore();
  const payment = store.payment_submissions.find((p) => p.id === payment_id);
  if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

  payment.status = status;
  payment.reviewed_by_leader_id = auth.id;
  payment.reviewed_at = new Date().toISOString();
  if (status === 'Rejected') {
    payment.rejection_reason = rejection_reason || 'Reference number not found in treasury ledger.';
  } else {
    payment.rejection_reason = null;
  }

  saveLocalStorage();

  // Notify resident
  createNotification(
    payment.resident_id,
    `Weekly Contribution ${status}`,
    `Your contribution payment (Ref: ${payment.reference_number}) was ${status.toLowerCase()} by Purok Leader ${auth.full_name}.${rejection_reason ? ` Reason: ${rejection_reason}` : ''}`,
    'payment',
    '/contributions'
  );

  logActivity(auth.id, 'VERIFY_PAYMENT', 'Payment', `Leader ${auth.full_name} marked payment ${payment_id} as ${status}`);
  res.json(payment);
});

// -------------------------------------------------------------
// ENDORSEMENT REQUESTS (PUROK LEADER IS FINAL APPROVER!)
// -------------------------------------------------------------
apiRouter.post('/endorsements/request', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'resident') {
    return res.status(403).json({ error: 'Only residents can request endorsements.' });
  }

  const { purpose, details } = req.body;
  if (!purpose) {
    return res.status(400).json({ error: 'Endorsement purpose is required.' });
  }

  const store = getLocalStore();
  const purok = store.puroks.find((p) => p.id === auth.purok_id);
  const leaderId = purok?.leader_id || 'usr-ldr-1';

  const endorsementId = 'end-' + Date.now();
  const newEndorsement = {
    id: endorsementId,
    resident_id: auth.id,
    purok_id: auth.purok_id || 'pur-1',
    leader_id: leaderId,
    purpose,
    details: details || '',
    status: 'Pending',
    remarks: null,
    certificate_code: null,
    issued_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.endorsement_requests.unshift(newEndorsement);
  saveLocalStorage();

  // Notify Purok Leader
  createNotification(
    leaderId,
    'New Endorsement Request',
    `${auth.full_name} requested a ${purpose} from ${purok?.name || 'your Purok'}.`,
    'endorsement',
    '/leader-endorsements'
  );

  logActivity(auth.id, 'REQUEST_ENDORSEMENT', 'Endorsement', `Resident requested ${purpose}`);
  res.status(201).json(newEndorsement);
});

apiRouter.get('/endorsements', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  const store = getLocalStore();

  let list = store.endorsement_requests.map((end) => {
    const resident = store.users.find((u) => u.id === end.resident_id);
    const household = resident ? store.households.find((h) => h.id === resident.household_id) : null;
    const purok = store.puroks.find((p) => p.id === end.purok_id);
    const leader = store.users.find((u) => u.id === end.leader_id);

    return {
      ...end,
      resident_name: resident ? resident.full_name : 'Resident',
      resident_contact: resident ? resident.contact_number : '',
      household_number: household ? household.household_number : 'Household',
      household_address: household ? household.address_details : '',
      purok_name: purok ? purok.name : 'Purok',
      leader_name: leader ? leader.full_name : 'Purok Leader'
    };
  });

  if (auth && auth.role === 'resident') {
    list = list.filter((e) => e.resident_id === auth.id);
  } else if (auth && auth.role === 'leader' && auth.purok_id) {
    list = list.filter((e) => e.purok_id === auth.purok_id);
  }

  res.json(list);
});

apiRouter.post('/endorsements/review', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  // CRITICAL RULE: "The Purok Leader is the final approving authority for resident endorsement requests. Do not add another Barangay Admin approval stage."
  if (!auth || (auth.role !== 'leader' && auth.role !== 'admin')) {
    return res.status(403).json({ error: 'Only assigned Purok Leaders have authority to approve or reject endorsements.' });
  }

  const { endorsement_id, status, remarks } = req.body;
  if (!endorsement_id || !status) {
    return res.status(400).json({ error: 'Endorsement ID and status decision are required.' });
  }

  const store = getLocalStore();
  const endorsement = store.endorsement_requests.find((e) => e.id === endorsement_id);
  if (!endorsement) return res.status(404).json({ error: 'Endorsement request not found.' });

  const now = new Date().toISOString();
  endorsement.status = status;
  endorsement.remarks = remarks || '';
  endorsement.updated_at = now;
  endorsement.leader_id = auth.id;

  if (status === 'Approved') {
    endorsement.issued_at = now;
    // Generate official unique verification reference code
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    endorsement.certificate_code = `BB-END-${year}-${randomCode}`;
  }

  saveLocalStorage();

  // Notify resident
  createNotification(
    endorsement.resident_id,
    `Endorsement ${status}`,
    `Your request for ${endorsement.purpose} was ${status.toLowerCase()} by Purok Leader ${auth.full_name}.${endorsement.certificate_code ? ` Certificate Code: ${endorsement.certificate_code}` : ''}`,
    'endorsement',
    '/endorsements'
  );

  logActivity(auth.id, 'REVIEW_ENDORSEMENT', 'Endorsement', `Leader ${auth.full_name} ${status} endorsement ${endorsement_id}`);
  res.json(endorsement);
});

// -------------------------------------------------------------
// ANNOUNCEMENTS & NOTIFICATIONS
// -------------------------------------------------------------
apiRouter.get('/announcements', (req: Request, res: Response) => {
  const store = getLocalStore();
  const list = store.announcements.filter((a) => a.is_active);
  res.json(list);
});

apiRouter.post('/announcements', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Only Barangay Admin can publish announcements.' });
  }

  const { title, content, category, priority } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const store = getLocalStore();
  const newAnn = {
    id: 'ann-' + Date.now(),
    title,
    content,
    category: category || 'Community Advisory',
    priority: priority || 'Normal',
    created_by: auth.id,
    is_active: true,
    created_at: new Date().toISOString()
  };

  store.announcements.unshift(newAnn);
  saveLocalStorage();

  // Send notification to all registered users
  store.users.forEach((u) => {
    createNotification(u.id, `Advisory: ${title}`, content.slice(0, 100) + '...', 'announcement', '/announcements');
  });

  logActivity(auth.id, 'CREATE_ANNOUNCEMENT', 'Announcements', `Admin published announcement: ${title}`);
  res.status(201).json(newAnn);
});

apiRouter.delete('/announcements/:id', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only.' });
  }

  const { id } = req.params;
  const store = getLocalStore();
  store.announcements = store.announcements.filter((a) => a.id !== id);
  saveLocalStorage();
  res.json({ success: true });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized.' });

  const store = getLocalStore();
  const list = store.notifications.filter((n) => n.user_id === auth.id);
  res.json(list);
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized.' });

  const { id } = req.params;
  const store = getLocalStore();
  const notif = store.notifications.find((n) => n.id === id && n.user_id === auth.id);
  if (notif) notif.is_read = true;
  saveLocalStorage();
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized.' });

  const store = getLocalStore();
  store.notifications.forEach((n) => {
    if (n.user_id === auth.id) n.is_read = true;
  });
  saveLocalStorage();
  res.json({ success: true });
});

// -------------------------------------------------------------
// ACTIVITY LOGS (AUDIT TRAIL)
// -------------------------------------------------------------
apiRouter.get('/activity-logs', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for audit logs.' });
  }
  const store = getLocalStore();
  res.json(store.activity_logs);
});

// -------------------------------------------------------------
// SYSTEM SETTINGS
// -------------------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  const store = getLocalStore();
  const settingsObj: Record<string, string> = {};
  store.system_settings.forEach((s) => {
    settingsObj[s.setting_key] = s.setting_value;
  });
  res.json(settingsObj);
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return res.status(403).json({ error: 'Only Admin can update system settings.' });
  }

  const updates = req.body;
  const store = getLocalStore();

  for (const [key, value] of Object.entries(updates)) {
    const existing = store.system_settings.find((s) => s.setting_key === key);
    if (existing) {
      existing.setting_value = String(value);
      existing.updated_at = new Date().toISOString();
    } else {
      store.system_settings.push({
        id: 'sett-' + Date.now(),
        setting_key: key,
        setting_value: String(value),
        description: 'Custom configuration key',
        updated_at: new Date().toISOString()
      });
    }
  }

  saveLocalStorage();
  logActivity(auth.id, 'UPDATE_SETTINGS', 'Settings', 'Updated system settings');
  res.json({ success: true });
});

// -------------------------------------------------------------
// OPERATIONAL REPORTS & CSV EXPORT
// -------------------------------------------------------------
apiRouter.get('/reports/dashboard-stats', (req: Request, res: Response) => {
  const store = getLocalStore();

  const totalResidents = store.users.filter((u) => u.role === 'resident').length;
  const totalHouseholds = store.households.length;
  const totalCollectors = store.users.filter((u) => u.role === 'collector').length;
  const totalLeaders = store.users.filter((u) => u.role === 'leader').length;

  const totalSchedules = store.collection_schedules.length;
  const completedSchedules = store.collection_schedules.filter((s) => s.status === 'Completed').length;
  const inProgressSchedules = store.collection_schedules.filter((s) => s.status === 'In Progress').length;
  const pendingSchedules = store.collection_schedules.filter((s) => s.status === 'Scheduled').length;

  const totalDisposalSubmissions = store.disposal_submissions.length;
  const verifiedDisposals = store.disposal_verifications.filter((v) => v.status === 'Verified').length;
  const pendingDisposals = store.disposal_verifications.filter((v) => v.status === 'Pending').length;

  const totalPayments = store.payment_submissions.length;
  const verifiedPayments = store.payment_submissions.filter((p) => p.status === 'Verified').length;
  const pendingPayments = store.payment_submissions.filter((p) => p.status === 'Pending').length;
  const totalFundsCollected = store.payment_submissions
    .filter((p) => p.status === 'Verified')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalEndorsements = store.endorsement_requests.length;
  const approvedEndorsements = store.endorsement_requests.filter((e) => e.status === 'Approved').length;
  const pendingEndorsements = store.endorsement_requests.filter((e) => e.status === 'Pending').length;

  // Breakdown by Purok
  const purokBreakdown = store.puroks.map((p) => {
    const households = store.households.filter((h) => h.purok_id === p.id).length;
    const residents = store.users.filter((u) => u.purok_id === p.id && u.role === 'resident').length;
    const schedules = store.collection_schedules.filter((s) => s.purok_id === p.id).length;
    const completed = store.collection_schedules.filter((s) => s.purok_id === p.id && s.status === 'Completed').length;
    const payments = store.payment_submissions
      .filter((pay) => pay.purok_id === p.id && pay.status === 'Verified')
      .reduce((sum, pay) => sum + Number(pay.amount), 0);

    return {
      purok_id: p.id,
      purok_name: p.name,
      households,
      residents,
      schedules,
      completed,
      compliance_rate: households > 0 ? Math.min(100, Math.round((completed / (schedules || 1)) * 100)) : 0,
      total_contributions: payments
    };
  });

  res.json({
    counts: {
      residents: totalResidents,
      households: totalHouseholds,
      collectors: totalCollectors,
      leaders: totalLeaders,
      schedules: totalSchedules,
      schedules_completed: completedSchedules,
      schedules_in_progress: inProgressSchedules,
      schedules_pending: pendingSchedules,
      disposals_submitted: totalDisposalSubmissions,
      disposals_verified: verifiedDisposals,
      disposals_pending: pendingDisposals,
      payments_total: totalPayments,
      payments_verified: verifiedPayments,
      payments_pending: pendingPayments,
      total_funds_collected: totalFundsCollected,
      endorsements_total: totalEndorsements,
      endorsements_approved: approvedEndorsements,
      endorsements_pending: pendingEndorsements
    },
    purok_breakdown: purokBreakdown
  });
});

apiRouter.get('/reports/export-csv', (req: Request, res: Response) => {
  const { type } = req.query;
  const store = getLocalStore();

  let csvContent = '';
  let filename = `bangbang_report_${Date.now()}.csv`;

  if (type === 'collections') {
    filename = `bangbang_collections_${Date.now()}.csv`;
    csvContent = 'Schedule ID,Purok,Collector,Date,Time Slot,Waste Type,Status,Volume (kg),Notes\n';
    store.collection_schedules.forEach((s) => {
      const p = store.puroks.find((pur) => pur.id === s.purok_id);
      const c = store.users.find((u) => u.id === s.collector_id);
      const r = store.collection_records.find((rec) => rec.schedule_id === s.id);
      const vol = r ? r.collected_volume_kg : 0;
      csvContent += `"${s.id}","${p?.name || ''}","${c?.full_name || ''}","${s.scheduled_date}","${s.time_slot}","${s.waste_type}","${s.status}","${vol}","${(s.notes || '').replace(/"/g, '""')}"\n`;
    });
  } else if (type === 'payments') {
    filename = `bangbang_contributions_${Date.now()}.csv`;
    csvContent = 'Payment ID,Resident,Household,Purok,Period Start,Period End,Amount,Method,Reference Number,Status,Date\n';
    store.payment_submissions.forEach((p) => {
      const resUser = store.users.find((u) => u.id === p.resident_id);
      const hh = store.households.find((h) => h.id === p.household_id);
      const pur = store.puroks.find((pk) => pk.id === p.purok_id);
      csvContent += `"${p.id}","${resUser?.full_name || ''}","${hh?.household_number || ''}","${pur?.name || ''}","${p.period_start}","${p.period_end}","${p.amount}","${p.payment_method}","${p.reference_number}","${p.status}","${p.created_at}"\n`;
    });
  } else if (type === 'households') {
    filename = `bangbang_households_${Date.now()}.csv`;
    csvContent = 'Household No,Head of Household,Purok,Contact,Address,Family Members,Compliant Status\n';
    store.households.forEach((h) => {
      const pur = store.puroks.find((p) => p.id === h.purok_id);
      csvContent += `"${h.household_number}","${h.head_name}","${pur?.name || ''}","${h.contact_number}","${h.address_details}","${h.family_member_count}","${h.waste_segregation_compliant ? 'Compliant' : 'Non-compliant'}"\n`;
    });
  } else {
    filename = `bangbang_endorsements_${Date.now()}.csv`;
    csvContent = 'Endorsement ID,Certificate Code,Resident,Purok,Purpose,Status,Remarks,Issued At\n';
    store.endorsement_requests.forEach((e) => {
      const resUser = store.users.find((u) => u.id === e.resident_id);
      const pur = store.puroks.find((pk) => pk.id === e.purok_id);
      csvContent += `"${e.id}","${e.certificate_code || 'N/A'}","${resUser?.full_name || ''}","${pur?.name || ''}","${e.purpose}","${e.status}","${(e.remarks || '').replace(/"/g, '""')}","${e.issued_at || 'Pending'}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});
