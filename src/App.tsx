import { useCallback, useState } from 'react';
import rulesJson from './rules/jireum-rules.json';
import { judge } from './engine/judge';
import type { JireumInput, JireumRules, JireumVerdict } from './engine/types';
import { logEvent, triggerHaptic } from './toss/bridge';
import InputScreen from './screens/InputScreen';
import ReviewingScreen from './screens/ReviewingScreen';
import VerdictScreen from './screens/VerdictScreen';

const rules = rulesJson as JireumRules;

/** "심사 중…" 뜸 들이기 — 이 기다림이 개그의 절반 */
const REVIEWING_MS = 2500;

type Phase =
  | { name: 'input' }
  | { name: 'reviewing' }
  | { name: 'verdict'; input: JireumInput; verdict: JireumVerdict };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ name: 'input' });

  const handleSubmit = useCallback((input: JireumInput) => {
    logEvent('jireum_submit', { price: input.price });
    setPhase({ name: 'reviewing' });
    const verdict = judge(rules, input);
    window.setTimeout(() => {
      void triggerHaptic(
        verdict.grade === 'reject' ? 'error' : verdict.grade === 'approve' ? 'success' : 'softMedium',
      );
      logEvent('jireum_verdict', { stamp: verdict.stamp, score: verdict.score });
      setPhase({ name: 'verdict', input, verdict });
    }, REVIEWING_MS);
  }, []);

  const handleRetry = useCallback(() => setPhase({ name: 'input' }), []);

  switch (phase.name) {
    case 'input':
      return <InputScreen rules={rules} onSubmit={handleSubmit} />;
    case 'reviewing':
      return <ReviewingScreen />;
    case 'verdict':
      return (
        <VerdictScreen rules={rules} input={phase.input} verdict={phase.verdict} onRetry={handleRetry} />
      );
  }
}
