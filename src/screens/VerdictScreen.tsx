import { useState } from 'react';
import type { JireumInput, JireumRules, JireumVerdict } from '../engine/types';
import { logEvent, saveVerdictImage, shareVerdict, shareVerdictImage } from '../toss/bridge';
import { renderVerdictImage } from '../share/verdictImage';
import SignModal from '../components/SignModal';

interface Props {
  rules: JireumRules;
  input: JireumInput;
  verdict: JireumVerdict;
  onRetry: () => void;
}

const SIGNER_KEY = 'jireum_signer';

function loadSigner(): string | null {
  try {
    return localStorage.getItem(SIGNER_KEY);
  } catch {
    return null;
  }
}

function storeSigner(name: string | null): void {
  try {
    if (name) localStorage.setItem(SIGNER_KEY, name);
  } catch {
    // 저장 불가 환경 — 무시
  }
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
    `[지름결의서] ${verdict.docNumber}`,
    `신청 품목: ${input.item} (${input.price.toLocaleString('ko-KR')}원)`,
    `판정: ${verdict.stamp} (${verdict.score}점)`,
    verdict.reason,
    '',
    '너도 심사받아 봐',
  ].join('\n');
}

type PendingAction = 'share' | 'save' | null;

export default function VerdictScreen({ rules, input, verdict, onRetry }: Props) {
  const [signer, setSigner] = useState<string | null>(loadSigner);
  const [pending, setPending] = useState<PendingAction>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tone = stampTone(verdict);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const runAction = async (action: 'share' | 'save', name: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await renderVerdictImage(rules, input, verdict, tone, name);
      if (action === 'share') {
        logEvent('jireum_share', { stamp: verdict.stamp });
        if (await shareVerdictImage(dataUrl, buildShareMessage(input, verdict))) return;
        // 이미지 공유가 안 되는 환경: 앨범 저장 후 안내, 텍스트 공유 시트라도 연다
        if (await saveVerdictImage(dataUrl, `jireum-${verdict.docNumber}.png`)) {
          showToast('판정서 이미지를 저장했어요. 사진으로 공유해 주세요.');
        }
        await shareVerdict(buildShareMessage(input, verdict));
      } else {
        logEvent('jireum_save', { stamp: verdict.stamp });
        const ok = await saveVerdictImage(dataUrl, `jireum-${verdict.docNumber}.png`);
        showToast(ok ? '판정서 이미지를 저장했어요.' : '저장에 실패했어요. 다시 시도해 주세요.');
      }
    } finally {
      setBusy(false);
    }
  };

  const requestAction = (action: 'share' | 'save') => {
    if (signer === null) {
      setPending(action);
      return;
    }
    void runAction(action, signer);
  };

  return (
    <main className="screen">
      <article className={`sheet doc doc--${tone}`}>
        <div className="approval" aria-hidden="true">
          <div className="approval__table">
            <div className="approval__cell">
              <span className="approval__role">담당</span>
              <span className="approval__sign">
                {signer ? (
                  <span
                    className="approval__name"
                    style={{ fontSize: signer.length >= 4 ? 13 : signer.length === 3 ? 16 : 20 }}
                  >
                    {signer}
                  </span>
                ) : (
                  /* 서명 전: 알아볼 수 없는 사인 자리 */
                  <svg className="approval__scribble" viewBox="0 0 44 22" aria-hidden="true">
                    <path
                      d="M3 15 C6 4, 9 3, 10 9 C11 15, 13 16, 15 8 C17 2, 19 4, 20 10 C21 16, 24 14, 27 7 C29 3, 31 5, 31 9 C31 13, 34 13, 38 9 M6 18 C16 21, 30 20, 41 15"
                      fill="none"
                      stroke="#23305e"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </div>
            <div className="approval__cell">
              <span className="approval__role">심사역</span>
              <span className="approval__sign">
                <span className="approval__dojang">심</span>
              </span>
            </div>
            <div className="approval__cell">
              <span className="approval__role">지름신</span>
              <span className="approval__sign">－</span>
            </div>
          </div>
        </div>
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
        <button className="submit" type="button" disabled={busy} onClick={() => requestAction('share')}>
          {busy ? '처리 중…' : '판정서 공유하기'}
        </button>
        <button
          className="submit submit--ghost"
          type="button"
          disabled={busy}
          onClick={() => requestAction('save')}
        >
          이미지로 저장
        </button>
        <button className="submit submit--ghost" type="button" onClick={onRetry}>
          다른 건 심사받기
        </button>
      </div>

      {toast && <p className="toast">{toast}</p>}

      {pending !== null && (
        <SignModal
          onCancel={() => setPending(null)}
          onConfirm={(name) => {
            setPending(null);
            if (name) {
              setSigner(name);
              storeSigner(name);
            }
            void runAction(pending, name);
          }}
        />
      )}
    </main>
  );
}
