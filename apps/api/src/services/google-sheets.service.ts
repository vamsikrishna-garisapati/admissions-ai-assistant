import { Env, Lead } from '../types';

export interface GoogleSheetLeadPayload {
  leadId: string;
  sessionId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  qualification: string;
  graduationYear: string;
  currentStatus: string;
  interestedCourse: string;
  callbackRequested: boolean;
  preferredCallbackTime: string;
  leadScore: number;
  leadTier: string;
  status: string;
  timestamp: string;
}

/**
 * Format lead into clean Google Sheets row payload
 */
export function formatLeadForSheet(lead: Lead): GoogleSheetLeadPayload {
  return {
    leadId: lead.id,
    sessionId: lead.session_id,
    fullName: lead.full_name || 'Anonymous Prospect',
    phoneNumber: lead.phone_number || 'N/A',
    email: lead.email || '',
    qualification: lead.qualification || '',
    graduationYear: lead.graduation_year ? String(lead.graduation_year) : '',
    currentStatus: lead.current_status || '',
    interestedCourse: lead.interested_course || 'General Enquiry',
    callbackRequested: lead.callback_requested === 1,
    preferredCallbackTime: lead.preferred_callback_time || 'Anytime',
    leadScore: lead.lead_score,
    leadTier: lead.lead_tier,
    status: lead.status,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };
}

/**
 * Dispatch lead to Google Sheets Webhook via non-blocking HTTP POST
 */
export async function syncLeadToGoogleSheet(env: Env, lead: Lead): Promise<boolean> {
  const webhookUrl = env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.trim() === '') {
    // Webhook not configured; skip silently
    return false;
  }

  try {
    const payload = formatLeadForSheet(lead);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // Mark as synced in D1
      await env.DB.prepare(
        `UPDATE leads SET google_sheet_synced = 1, updated_at = unixepoch() WHERE id = ?`
      ).bind(lead.id).run();

      // Log event
      await env.DB.prepare(
        `INSERT INTO lead_events (id, lead_id, event_type, payload_json, created_at)
         VALUES (?, ?, 'synced', ?, unixepoch())`
      ).bind(crypto.randomUUID(), lead.id, JSON.stringify({ target: 'google_sheets', status: 'success' })).run();

      return true;
    } else {
      console.error(`Google Sheets webhook failed: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Failed to sync lead to Google Sheet:', error);
    return false;
  }
}
