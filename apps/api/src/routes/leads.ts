import { Hono } from 'hono';
import { z } from 'zod';
import { Env, Lead } from '../types';
import { verifySessionToken } from '../services/session.service';
import { validateAndNormalizeIndianPhone } from '../services/phone-validator.service';
import { calculateLeadScore } from '../services/lead-scorer.service';
import { syncLeadToGoogleSheet } from '../services/google-sheets.service';

export const leadsRouter = new Hono<{ Bindings: Env }>();

const leadSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  qualification: z.string().max(100).optional(),
  graduationYear: z.number().int().min(1990).max(2035).optional(),
  currentStatus: z.string().max(100).optional(),
  interestedCourse: z.string().max(100).optional(),
  careerGoal: z.string().max(250).optional(),
  preferredLocation: z.string().max(100).optional(),
  learningMode: z.string().max(50).optional(),
  callbackRequested: z.boolean().default(false),
  preferredCallbackTime: z.string().max(100).optional(),
  consentGiven: z.boolean().default(true),
  consentText: z.string().optional()
});

leadsRouter.post('/leads', async (c) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ status: 'error', message: 'Missing Authorization header' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const auth = await verifySessionToken(token, c.env.SESSION_SECRET);
  if (!auth.valid || !auth.sessionId) {
    return c.json({ status: 'error', message: 'Invalid or expired session token' }, 403);
  }

  const sessionId = auth.sessionId;

  const body = await c.req.json().catch(() => null);
  const parseResult = leadSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ status: 'error', errors: parseResult.error.format() }, 400);
  }

  const data = parseResult.data;

  // Phone number validation if provided or if callback is requested
  let validatedPhone: string | undefined = undefined;
  if (data.phoneNumber) {
    const phoneCheck = validateAndNormalizeIndianPhone(data.phoneNumber);
    if (!phoneCheck.isValid) {
      return c.json({ status: 'error', message: phoneCheck.error }, 422);
    }
    validatedPhone = phoneCheck.normalized;
  } else if (data.callbackRequested) {
    return c.json({ status: 'error', message: 'Phone number is required for an admissions callback request.' }, 422);
  }

  // Check if lead already exists for this session
  const existingLead = await c.env.DB.prepare(
    `SELECT * FROM leads WHERE session_id = ?`
  ).bind(sessionId).first<Lead>();

  const leadId = existingLead ? existingLead.id : crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Compute deterministic score
  const scoreResult = calculateLeadScore(
    {
      interested_course: data.interestedCourse || existingLead?.interested_course,
      qualification: data.qualification || existingLead?.qualification,
      graduation_year: data.graduationYear || existingLead?.graduation_year,
      phone_number: validatedPhone || existingLead?.phone_number,
      callback_requested: data.callbackRequested ? 1 : (existingLead?.callback_requested || 0)
    },
    {
      providedContact: !!(validatedPhone || existingLead?.phone_number)
    }
  );

  const updatedLead: Lead = {
    id: leadId,
    session_id: sessionId,
    full_name: data.fullName ?? existingLead?.full_name,
    phone_number: validatedPhone ?? existingLead?.phone_number,
    email: data.email ?? existingLead?.email,
    qualification: data.qualification ?? existingLead?.qualification,
    graduation_year: data.graduationYear ?? existingLead?.graduation_year,
    current_status: data.currentStatus ?? existingLead?.current_status,
    interested_course: data.interestedCourse ?? existingLead?.interested_course,
    career_goal: data.careerGoal ?? existingLead?.career_goal,
    preferred_location: data.preferredLocation ?? existingLead?.preferred_location,
    learning_mode: data.learningMode ?? existingLead?.learning_mode,
    callback_requested: data.callbackRequested ? 1 : (existingLead?.callback_requested || 0),
    preferred_callback_time: data.preferredCallbackTime ?? existingLead?.preferred_callback_time,
    lead_score: scoreResult.score,
    lead_tier: scoreResult.tier,
    status: scoreResult.score >= 50 ? 'qualified' : (existingLead?.status || 'new'),
    notes: existingLead?.notes,
    google_sheet_synced: 0,
    created_at: existingLead ? existingLead.created_at : now,
    updated_at: now
  };

  if (existingLead) {
    await c.env.DB.prepare(
      `UPDATE leads SET
        full_name = ?, phone_number = ?, email = ?, qualification = ?, graduation_year = ?,
        current_status = ?, interested_course = ?, career_goal = ?, preferred_location = ?,
        learning_mode = ?, callback_requested = ?, preferred_callback_time = ?,
        lead_score = ?, lead_tier = ?, status = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      updatedLead.full_name || null,
      updatedLead.phone_number || null,
      updatedLead.email || null,
      updatedLead.qualification || null,
      updatedLead.graduation_year || null,
      updatedLead.current_status || null,
      updatedLead.interested_course || null,
      updatedLead.career_goal || null,
      updatedLead.preferred_location || null,
      updatedLead.learning_mode || null,
      updatedLead.callback_requested,
      updatedLead.preferred_callback_time || null,
      updatedLead.lead_score,
      updatedLead.lead_tier,
      updatedLead.status,
      now,
      leadId
    ).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO leads (
        id, session_id, full_name, phone_number, email, qualification, graduation_year,
        current_status, interested_course, career_goal, preferred_location, learning_mode,
        callback_requested, preferred_callback_time, lead_score, lead_tier, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      leadId,
      sessionId,
      updatedLead.full_name || null,
      updatedLead.phone_number || null,
      updatedLead.email || null,
      updatedLead.qualification || null,
      updatedLead.graduation_year || null,
      updatedLead.current_status || null,
      updatedLead.interested_course || null,
      updatedLead.career_goal || null,
      updatedLead.preferred_location || null,
      updatedLead.learning_mode || null,
      updatedLead.callback_requested,
      updatedLead.preferred_callback_time || null,
      updatedLead.lead_score,
      updatedLead.lead_tier,
      updatedLead.status,
      now,
      now
    ).run();

    // Link lead_id back to session
    await c.env.DB.prepare(
      `UPDATE chat_sessions SET lead_id = ?, updated_at = ? WHERE id = ?`
    ).bind(leadId, now, sessionId).run();
  }

  // Record consent audit entry if callback requested
  if (data.consentGiven && data.callbackRequested) {
    const consentText = data.consentText || 'I consent to admissions contacting me regarding training programmes.';
    await c.env.DB.prepare(
      `INSERT INTO consent_records (id, lead_id, session_id, consent_type, granted, consent_text, created_at)
       VALUES (?, ?, ?, 'counselling_callback', 1, ?, ?)`
    ).bind(crypto.randomUUID(), leadId, sessionId, consentText, now).run();
  }

  // Record lead lifecycle event
  await c.env.DB.prepare(
    `INSERT INTO lead_events (id, lead_id, event_type, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(),
    leadId,
    data.callbackRequested ? 'callback_requested' : 'score_updated',
    JSON.stringify({ score: scoreResult.score, tier: scoreResult.tier, breakdown: scoreResult.breakdown }),
    now
  ).run();

  // Async dispatch to Google Sheets without blocking API response
  c.executionCtx.waitUntil(syncLeadToGoogleSheet(c.env, updatedLead));

  return c.json({
    status: 'success',
    data: {
      leadId: updatedLead.id,
      score: updatedLead.lead_score,
      tier: updatedLead.lead_tier,
      callbackRequested: updatedLead.callback_requested === 1
    }
  });
});

