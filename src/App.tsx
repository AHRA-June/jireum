import { useCallback, useState } from 'react';
import rulesJson from './rules/jireum-rules.json';
import { judge } from './engine/judge';
import type { JireumInput, JireumRules, JireumVerdict } from './engine/types';
import { logEvent, triggerHaptic } from './toss/bridge';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import InputScreen from './screens/InputScreen';
import ReviewingScreen from './screens/ReviewingScreen';
import VerdictScreen from './screens/VerdictScreen';

const rules = rulesJson as JireumRules;

/** "심사 중…" 뜸 들이기 — 이 기다림이 개그의 절반 */
const REVIEWING_MS = 2500;

type Phase =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'input' }
  | { name: 'reviewing' }
  | { name: 'verdict'; input: JireumInput; verdict: JireumVerdict; archived?: boolean };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ name: 'home' });

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
    case 'home':
      return (
        <HomeScreen
          onStart={() => setPhase({ name: 'input' })}
          onHistory={() => setPhase({ name: 'history' })}
        />
      );
    case 'history':
      return (
        <HistoryScreen
          onBack={() => setPhase({ name: 'home' })}
          onOpen={(entry) => {
            if (entry.input && entry.verdict) {
              setPhase({ name: 'verdict', input: entry.input, verdict: entry.verdict, archived: true });
            }
          }}
        />
      );
    case 'input':
      return <InputScreen rules={rules} onSubmit={handleSubmit} />;
    case 'reviewing':
      return <ReviewingScreen />;
    case 'verdict':
      return (
        <VerdictScreen
          rules={rules}
          input={phase.input}
          verdict={phase.verdict}
          archived={phase.archived}
          onRetry={phase.archived ? () => setPhase({ name: 'history' }) : handleRetry}
          onHistory={() => setPhase({ name: 'history' })}
        />
      );
  }
}
