import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from '../src/services/lead-scorer.service';

describe('Lead Scorer Service (PRD Section 12)', () => {
  it('assigns 0 points and Low intent tier to empty lead', () => {
    const res = calculateLeadScore({});
    expect(res.score).toBe(0);
    expect(res.tier).toBe('Low intent');
  });

  it('assigns Exploring tier (25-49) when student asks fees and course', () => {
    const res = calculateLeadScore(
      { interested_course: 'Full Stack Python' }, // +10
      { askedFees: true } // +10
    );
    expect(res.score).toBe(20);
    expect(res.tier).toBe('Low intent');

    const res2 = calculateLeadScore(
      { interested_course: 'Full Stack Python', qualification: 'B.Tech' }, // +10, +10
      { askedFees: true } // +10
    );
    expect(res2.score).toBe(30);
    expect(res2.tier).toBe('Exploring');
  });

  it('assigns Interested tier (50-74) when education, batches, and placements are explored', () => {
    const res = calculateLeadScore(
      {
        interested_course: 'MERN Stack', // 10
        qualification: 'MCA',            // 10
        phone_number: '9849012345'       // 5
      },
      {
        askedUpcomingBatches: true,      // 15
        askedPlacements: true            // 10
      }
    );
    // 10 + 10 + 5 + 15 + 10 = 50
    expect(res.score).toBe(50);
    expect(res.tier).toBe('Interested');
  });

  it('assigns High intent tier (>=75) when counselling is requested and joining interest expressed', () => {
    const res = calculateLeadScore(
      {
        interested_course: 'Full Stack Python', // 10
        qualification: 'B.Tech 2025',           // 10
        phone_number: '9849012345',             // 5
        callback_requested: 1                   // 20
      },
      {
        expressedJoiningInterest: true,         // 20
        askedUpcomingBatches: true              // 15
      }
    );
    // 10 + 10 + 5 + 20 + 20 + 15 = 80
    expect(res.score).toBe(80);
    expect(res.tier).toBe('High intent');
  });

  it('caps maximum score at 100', () => {
    const res = calculateLeadScore(
      {
        interested_course: 'Full Stack Python', // 10
        qualification: 'B.Tech',                // 10
        phone_number: '9849012345',             // 5
        callback_requested: 1                   // 20
      },
      {
        askedFees: true,                        // 10
        askedUpcomingBatches: true,             // 15
        askedPlacements: true,                  // 10
        expressedJoiningInterest: true          // 20
      }
    );
    // 10 + 10 + 5 + 20 + 10 + 15 + 10 + 20 = 100
    expect(res.score).toBe(100);
    expect(res.tier).toBe('High intent');
  });
});
