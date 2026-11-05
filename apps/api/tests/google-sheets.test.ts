import { describe, it, expect } from 'vitest';
import { formatLeadForSheet } from '../src/services/google-sheets.service';
import { Lead } from '../src/types';

describe('Google Sheets Service', () => {
  it('formats lead record properly into sheet payload', () => {
    const mockLead: Lead = {
      id: 'lead_123',
      session_id: 'sess_456',
      full_name: 'Rahul Sharma',
      phone_number: '9849012345',
      email: 'rahul@example.com',
      qualification: 'B.Tech CSE',
      graduation_year: 2024,
      current_status: 'Fresher',
      interested_course: 'Full Stack Python',
      callback_requested: 1,
      preferred_callback_time: 'Evening 5 PM',
      lead_score: 85,
      lead_tier: 'High intent',
      status: 'qualified',
      google_sheet_synced: 0,
      created_at: 1730000000,
      updated_at: 1730000000
    };

    const formatted = formatLeadForSheet(mockLead);

    expect(formatted.leadId).toBe('lead_123');
    expect(formatted.fullName).toBe('Rahul Sharma');
    expect(formatted.phoneNumber).toBe('9849012345');
    expect(formatted.callbackRequested).toBe(true);
    expect(formatted.leadScore).toBe(85);
    expect(formatted.leadTier).toBe('High intent');
    expect(formatted.timestamp).toBeDefined();
  });
});

