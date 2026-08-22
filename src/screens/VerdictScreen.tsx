import { useState } from 'react';
import type { JireumInput, JireumRules, JireumVerdict } from '../engine/types';
import { logEvent, shareVerdict } from '../toss/bridge';

interface Props {
  rules: JireumRules;
  input: JireumInput;
  verdict: JireumVerdict;
  onRetry: () => void;
}

/** 도장 색: 승인=청색 / 조건부=주황 / 부결=적색, 특수 판정은 규칙별 지정 */
function stampTone(verdict: JireumVerdict): 'blue' | 'orange' | 'red' | 'gray' {
  if (verdict.specialKey === 'instant_approve') return 'blue';
  if (verdict.specialKey === 'already_decided') return 'gray';
  switch (verdict.grade) {
    case 'approve': return 'blue';
    case 'conditional': return 'orange';
    case 'reject': return 'red';
    default: return 'gray';
  }
}

function buildShareMessage(input: JireumInput, verdict: JireumVerdict): string {
  return [
    `[지름신 심사기] ${verdict.docNumber}`,
    `신청 품목: ${input.item} (${input.price.toLocaleString('ko-KR')}원)`,
    `판정: ${verdict.stamp} (${verdict.score}점)`,
    verdict.reason,
    '',
    '너도 심사받아 봐',
  ].join('\n');
}

export default function VerdictScreen({ rules, input, verdict, onRetry }: Props) {
  const [shared, setShared] = useState(false);
  const tone = stampTone(verdict);

  return (
    <main className="screen">
      <article className={`doc doc--${tone}`}>
        <header className="doc__head">
          <p className="doc__office">지름 심사 위원회</p>
          <h1 className="doc__title">지름 심사 판정서</h1>
          <p className="doc__number">{verdict.docNumber}</p>
        </header>

        <dl className="doc__table">
          <div className="doc__row">
            <dt>신청 품목</dt>
            <dd>{input.item}</dd>
          </div>
          <div className="doc__row">
            <dt>신청 금액</dt>
            <dd>{input.price.toLocaleString('ko-KR')}원</dd>
          </div>
          <div className="doc__row">
            <dt>심사 점수</dt>
            <dd>
              {verdict.score}점 / 100점
              {verdict.specialKey !== null && <span className="doc__score-note"> (점수 미반영 판정)</span>}
            </dd>
          </div>
        </dl>

        <div className="doc__stamp-area">
          <span className={`stamp stamp--${tone}`} role="img" aria-label={`판정: ${verdict.stamp}`}>
            {verdict.stamp}
          </span>
        </div>

        <section className="doc__reason">
          <h2 className="doc__reason-title">판정 사유</h2>
          <p>{verdict.reason}</p>
          {verdict.notes.map((note) => (
            <p key={note} className="doc__note">
              {note}
            </p>
          ))}
        </section>

        <footer className="doc__foot">
          <p className="doc__signature">{rules.meta.signature}</p>
          <p className="fine-print">{rules.meta.disclaimer}</p>
        </footer>
      </article>

      <div className="actions">
        <button
          className="submit"
          type="button"
          onClick={() => {
            logEvent('jireum_share', { stamp: verdict.stamp });
            void shareVerdict(buildShareMessage(input, verdict)).then((ok) => {
              if (ok) {
                setShared(true);
                window.setTimeout(() => setShared(false), 2000);
              }
            });
          }}
        >
          {shared ? '공유 완료' : '판정서 공유하기'}
        </button>
        <button className="submit submit--ghost" type="button" onClick={onRetry}>
          다른 건 심사받기
        </button>
      </div>
    </main>
  );
}
