import type { FormLogicComparator, FormLogicRule } from '@/types/hrModules';

// Pure conditional-visibility evaluator. Single source of truth used identically by the builder
// (to flag logic rules referencing deleted questions — see FormOutline.tsx) and the fill-form page
// (to actually hide/show questions live as answers change — see FillFormClient.tsx), so the two can
// never drift into disagreeing about what's visible.

/** Compares an answer against a rule's comparison value for the given comparator. */
export function matchesComparator(comparator: FormLogicComparator, answer: unknown, comparisonValue: unknown): boolean {
  const answerText = Array.isArray(answer) ? answer.join(', ') : String(answer ?? '');
  switch (comparator) {
    case 'equals':
      return Array.isArray(answer) ? answer.includes(comparisonValue) : answer === comparisonValue;
    case 'not_equals':
      return !(Array.isArray(answer) ? answer.includes(comparisonValue) : answer === comparisonValue);
    case 'contains':
      return answerText.toLowerCase().includes(String(comparisonValue ?? '').toLowerCase());
    case 'greater_than':
      return Number(answer) > Number(comparisonValue);
    case 'less_than':
      return Number(answer) < Number(comparisonValue);
    case 'is_empty':
      return answer == null || answerText.trim() === '' || (Array.isArray(answer) && answer.length === 0);
    case 'is_not_empty':
      return !(answer == null || answerText.trim() === '' || (Array.isArray(answer) && answer.length === 0));
    default:
      return true;
  }
}

/**
 * Resolves whether `questionId` should be visible given the full list of a form's logic rules and
 * the current answers map (keyed by question id).
 *
 * - A question with no rules targeting it is always visible.
 * - Each targeting rule's match result is inverted when `action === 'hide'` (matching means hide,
 *   so visibility is `!matched`).
 * - Combinator resolution is per target question: if ANY rule targeting that question has
 *   `combinator: 'any'`, visibility is true if ANY rule's (already-inverted) result is true;
 *   otherwise ALL rules targeting it must pass (the common case, and the default when only one
 *   rule targets the question).
 */
export function isQuestionVisible(
  questionId: number,
  rules: FormLogicRule[],
  answers: Record<number, unknown>,
): boolean {
  const targeting = rules.filter((r) => r.targetQuestionId === questionId);
  if (targeting.length === 0) return true;

  const results = targeting.map((r) => {
    const matched = matchesComparator(r.comparator, answers[r.sourceQuestionId], r.comparisonValue);
    return r.action === 'hide' ? !matched : matched;
  });

  const anyRule = targeting.some((r) => r.combinator === 'any');
  return anyRule ? results.some(Boolean) : results.every(Boolean);
}

/** Logic rules whose target or source question no longer exists — surfaced as builder warnings. */
export function findBrokenLogicRules(rules: FormLogicRule[], validQuestionIds: Set<number>): FormLogicRule[] {
  return rules.filter((r) => !validQuestionIds.has(r.targetQuestionId) || !validQuestionIds.has(r.sourceQuestionId));
}
