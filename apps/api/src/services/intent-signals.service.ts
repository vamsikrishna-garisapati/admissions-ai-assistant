import { LeadSignals } from '../types';

/**
 * Lightweight keyword heuristics for lead scoring signals.
 * Deterministic — no LLM involvement.
 */
export function detectLeadSignals(message: string): LeadSignals {
  const text = message.toLowerCase();

  return {
    askedFees: /\b(fee|fees|cost|price|pricing|emi|instal+ment|tuition)\b/.test(text),
    askedUpcomingBatches:
      /\b(batch|batches|start date|starting|next intake|schedule|timings?)\b/.test(text),
    askedPlacements:
      /\b(placement|placements|job|jobs|hiring|career support|crpr|interview)\b/.test(text),
    expressedJoiningInterest:
      /\b(i want to join|want to enroll|want to enrol|ready to join|sign up|register|admission|admit me|i'?m interested in joining)\b/.test(
        text
      )
  };
}

export function mergeSignals(
  existing: LeadSignals = {},
  next: LeadSignals = {}
): LeadSignals {
  return {
    askedFees: existing.askedFees || next.askedFees,
    askedUpcomingBatches: existing.askedUpcomingBatches || next.askedUpcomingBatches,
    askedPlacements: existing.askedPlacements || next.askedPlacements,
    expressedJoiningInterest:
      existing.expressedJoiningInterest || next.expressedJoiningInterest,
    providedContact: existing.providedContact || next.providedContact
  };
}
