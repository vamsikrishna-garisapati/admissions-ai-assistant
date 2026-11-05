import { Lead, LeadSignals, LeadTier } from '../types';

export interface ScoreResult {
  score: number;
  tier: LeadTier;
  breakdown: Record<string, number>;
}

/**
 * Deterministic Lead Scoring Engine
 * Implements PRD Section 12 rule-based scoring with zero LLM hallucination.
 */
export function calculateLeadScore(
  lead: Partial<Lead>,
  signals: LeadSignals = {}
): ScoreResult {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // 1. Course specificity (+10)
  if (lead.interested_course && lead.interested_course.trim().length > 0) {
    score += 10;
    breakdown['specific_course'] = 10;
  }

  // 2. Education details shared (+10)
  if (lead.qualification || lead.graduation_year) {
    score += 10;
    breakdown['education_details'] = 10;
  }

  // 3. Asked about fees (+10)
  if (signals.askedFees) {
    score += 10;
    breakdown['asked_fees'] = 10;
  }

  // 4. Asked about upcoming batches (+15)
  if (signals.askedUpcomingBatches) {
    score += 15;
    breakdown['asked_batches'] = 15;
  }

  // 5. Asked about placement support (+10)
  if (signals.askedPlacements) {
    score += 10;
    breakdown['asked_placements'] = 10;
  }

  // 6. Expressed joining interest (+20)
  if (signals.expressedJoiningInterest) {
    score += 20;
    breakdown['expressed_joining_interest'] = 20;
  }

  // 7. Requested counselling / callback (+20)
  if (lead.callback_requested === 1) {
    score += 20;
    breakdown['requested_counselling'] = 20;
  }

  // 8. Provided contact number (+5)
  if (lead.phone_number && lead.phone_number.trim().length >= 10) {
    score += 5;
    breakdown['provided_contact'] = 5;
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine classification tier
  let tier: LeadTier = 'Low intent';
  if (finalScore >= 75) {
    tier = 'High intent';
  } else if (finalScore >= 50) {
    tier = 'Interested';
  } else if (finalScore >= 25) {
    tier = 'Exploring';
  }

  return {
    score: finalScore,
    tier,
    breakdown
  };
}

