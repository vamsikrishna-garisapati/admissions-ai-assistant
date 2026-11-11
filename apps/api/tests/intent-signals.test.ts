import { describe, it, expect } from 'vitest';
import { detectLeadSignals, mergeSignals } from '../src/services/intent-signals.service';

describe('intent-signals.service', () => {
  it('detects fee, batch, placement, and joining signals', () => {
    expect(detectLeadSignals('What are the course fees?').askedFees).toBe(true);
    expect(detectLeadSignals('When is the next batch starting?').askedUpcomingBatches).toBe(
      true
    );
    expect(detectLeadSignals('Do you provide placement support?').askedPlacements).toBe(
      true
    );
    expect(detectLeadSignals('I want to join the Python course').expressedJoiningInterest).toBe(
      true
    );
  });

  it('returns empty signals for unrelated questions', () => {
    const signals = detectLeadSignals('Hello there');
    expect(signals.askedFees).toBe(false);
    expect(signals.askedUpcomingBatches).toBe(false);
    expect(signals.askedPlacements).toBe(false);
    expect(signals.expressedJoiningInterest).toBe(false);
  });

  it('mergeSignals ORs boolean flags', () => {
    const merged = mergeSignals(
      { askedFees: true },
      { askedPlacements: true, askedFees: false }
    );
    expect(merged.askedFees).toBe(true);
    expect(merged.askedPlacements).toBe(true);
  });
});
