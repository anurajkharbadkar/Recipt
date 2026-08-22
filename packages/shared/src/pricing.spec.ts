import { resolvePlanFeatures, formatPlanLimit, PRICING_PLANS } from './index';
import { SubscriptionPlan } from './index';

describe('formatPlanLimit', () => {
  it('renders -1 as unlimited', () => {
    expect(formatPlanLimit(-1, 'Collectors')).toBe('Unlimited Collectors');
  });

  it('renders a positive number as a cap', () => {
    expect(formatPlanLimit(10, 'Collectors')).toBe('Up to 10 Collectors');
  });

  it('renders 0 as a cap, not unlimited — only -1 means unlimited', () => {
    expect(formatPlanLimit(0, 'Collectors')).toBe('Up to 0 Collectors');
  });
});

describe('resolvePlanFeatures', () => {
  // Regression coverage for the real bug this function was written to fix:
  // a higher tier's value for a shared capability (e.g. collector count)
  // used to just get appended after the lower tier's, so the cumulative
  // comparison-table view for Standard would show "Up to 5 Collectors" and
  // "Up to 10 Collectors" side by side — contradictory, since only one is
  // actually true. Every `key`-bearing feature must appear exactly once in
  // the resolved list, holding the *highest tier's* value.

  it('supersedes a lower tier\'s value for the same key instead of stacking both', () => {
    const standard = resolvePlanFeatures(SubscriptionPlan.STANDARD);
    const standardPlan = PRICING_PLANS.find((p) => p.id === SubscriptionPlan.STANDARD)!;
    const freePlan = PRICING_PLANS.find((p) => p.id === SubscriptionPlan.FREE)!;

    const collectorFeatures = standard.filter((f) => f.key === 'collectors');
    expect(collectorFeatures).toHaveLength(1);
    expect(collectorFeatures[0].label).toBe(
      standardPlan.features.find((f) => f.key === 'collectors')!.label,
    );
    // Free's "Up to 5 Collectors" must not survive alongside Standard's own value.
    expect(collectorFeatures[0].label).not.toBe(
      freePlan.features.find((f) => f.key === 'collectors')!.label,
    );

    const festivalFeatures = standard.filter((f) => f.key === 'activeFestivals');
    expect(festivalFeatures).toHaveLength(1);
    expect(festivalFeatures[0].label).toBe(
      standardPlan.features.find((f) => f.key === 'activeFestivals')!.label,
    );
  });

  it('inherits an ancestor tier\'s features that the requested tier never overrides', () => {
    const standard = resolvePlanFeatures(SubscriptionPlan.STANDARD);
    // Standard's own `features` list has no 'reports' entry — it should
    // still surface here, inherited all the way from Free Trial (via Basic).
    expect(standard.some((f) => f.key === 'reports')).toBe(true);
    // Basic's own override of 'receipts' (raised from Free's limit) should
    // carry through to Standard rather than Free's original value.
    const basicPlan = PRICING_PLANS.find((p) => p.id === SubscriptionPlan.BASIC)!;
    const receiptFeature = standard.find((f) => f.key === 'receipts');
    expect(receiptFeature?.label).toBe(basicPlan.features.find((f) => f.key === 'receipts')!.label);
  });

  it('keeps every keyless feature — nothing to supersede, so no dedup applies', () => {
    const free = resolvePlanFeatures(SubscriptionPlan.FREE);
    expect(free.filter((f) => !f.key).map((f) => f.label)).toContain('No Payment Needed to Start');
  });

  it('returns the base tier\'s own feature list unchanged (nothing to inherit)', () => {
    const free = resolvePlanFeatures(SubscriptionPlan.FREE);
    const freePlan = PRICING_PLANS.find((p) => p.id === SubscriptionPlan.FREE)!;
    expect(free).toEqual(freePlan.features);
  });

  it('returns an empty list for an unknown plan id', () => {
    expect(resolvePlanFeatures('NOT_A_REAL_PLAN' as SubscriptionPlan)).toEqual([]);
  });

  // Regression coverage for a real bug found while reworking Free Trial
  // into a 7-day "full Premium access" window (2026-08-22): Free Trial's
  // collector/campaign limits used to be numerically identical to Basic's,
  // so Basic's own `features` list safely left those two keys unset and
  // inherited Free Trial's bullets via includesFrom. The moment Free
  // Trial's numbers changed to match Premium instead, Basic's resolved
  // feature list would have silently inherited "Unlimited Collectors" too
  // — a real, false claim about what a paid ₹499 Basic subscription
  // actually gets — unless Basic declares its own explicit values.
  it("Basic's resolved collector/campaign limits are its own, not Free Trial's promotional ones", () => {
    const basic = resolvePlanFeatures(SubscriptionPlan.BASIC);
    const basicPlan = PRICING_PLANS.find((p) => p.id === SubscriptionPlan.BASIC)!;
    const freePlan = PRICING_PLANS.find((p) => p.id === SubscriptionPlan.FREE)!;

    const collectorFeature = basic.find((f) => f.key === 'collectors');
    expect(collectorFeature?.label).toBe(basicPlan.features.find((f) => f.key === 'collectors')!.label);
    expect(collectorFeature?.label).not.toBe(freePlan.features.find((f) => f.key === 'collectors')!.label);

    const festivalFeature = basic.find((f) => f.key === 'activeFestivals');
    expect(festivalFeature?.label).toBe(basicPlan.features.find((f) => f.key === 'activeFestivals')!.label);
    expect(festivalFeature?.label).not.toBe(freePlan.features.find((f) => f.key === 'activeFestivals')!.label);
  });
});
