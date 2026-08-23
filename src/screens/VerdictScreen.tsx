import { useEffect, useState } from 'react';
import type { JireumInput, JireumRules, JireumVerdict } from '../engine/types';
import { createShareLink, logEvent, saveVerdictImage, shareVerdict, shareVerdictImage } from '../toss/bridge';
import type { OgVariant } from '../toss/bridge';
import { renderVerdictImage } from '../share/verdictImage';
import SignModal from '../components/SignModal';
import { loadSigner, storeSigner } from '../signer';
import { addHistory } from '../history';

interface Props {
  rules: JireumRules;
  input: JireumInput;
  verdict: JireumVerdict;
  onRetry: () => void;
  /** 결재 대장에서 열람 중이면 true — 이력을 다시 쌓지 않는다 */
  archived?: boolean;
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

/** 지름신은 승인 건에만 결재한다 (조건부·부결은 미결재로 남음) */
function jireumsinApproved(verdict: JireumVerdict): boolean {
  return (
    verdict.grade === 'approve' ||
    verdict.specialKey === 'instant_approve' ||
    verdict.specialKey === 'already_decided'
  );
}

/** 링크 미리보기 이미지 종류 — 판정 등급에 맞춘다 */
function ogVariant(verdict: JireumVerdict): OgVariant {
  if (verdict.specialKey === 'already_decided') return 'decided';
  if (verdict.specialKey === 'instant_approve') return 'approve';
  switch (verdict.grade) {
    case 'approve': return 'approve';
    case 'conditional': return 'conditional';
    default: return 'reject';
  }
}

/** 받는 사람이 "나는 뭐 받았게?"로 읽도록 판정을 앞세운다 */
function buildShareMessage(input: JireumInput, verdict: JireumVerdict, link: string | null): string {
  return [
    `내 ${input.item}, ${verdict.stamp} 났다.`,
    `[지름결의서] ${verdict.docNumber}`,
    `신청 금액 ${input.price.toLocaleString('ko-KR')}원 · 심사 점수 ${verdict.score}점`,
    verdict.reason,
    '',
    '너도 심사받아 봐 👉',
    link ?? '',
  ]
    .filter(Boolean)
    .join('\n');
}

type PendingAction = 'share' | 'save' | 'edit' | null;

export default function VerdictScreen({ rules, input, verdict, onRetry, archived = false }: Props) {
  const [signer, setSigner] = useState<string | null>(loadSigner);
  const [pending, setPending] = useState<PendingAction>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tone = stampTone(verdict);

  // 새 판정만 결재 대장에 기록한다 (대장에서 다시 열어본 건은 제외)
  useEffect(() => {
    if (!archived) addHistory(input, verdict, tone);
  }, [input, verdict, tone, archived]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const runAction = async (action: 'share' | 'save', name: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await renderVerdictImage(rules, input, verdict, tone, name, jireumsinApproved(verdict));
      if (action === 'share') {
        logEvent('jireum_share', { stamp: verdict.stamp });
        const link = await createShareLink(ogVariant(verdict));
        const message = buildShareMessage(input, verdict, link);
        // 1순위: 이미지 + 문구를 함께 공유 시트로
        if (await shareVerdictImage(dataUrl, message)) return;
        // 2순위: 이미지 첨부가 불가능한 환경 — 문구+링크만 보낸다 (앨범 저장 강요하지 않음)
        await shareVerdict(message);
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
        <div className="approval">
          <div className="approval__table">
            <div className="approval__cell">
              <span className="approval__role" aria-hidden="true">담당</span>
              {/* 서명을 눌러 이름을 고칠 수 있다 */}
              <button
                className="approval__sign approval__sign--editable"
                type="button"
                onClick={() => setPending('edit')}
                aria-label={signer ? `담당 서명: ${signer} (눌러서 수정)` : '담당 서명하기'}
              >
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
              </button>
            </div>
            <div className="approval__cell" aria-hidden="true">
              <span className="approval__role">심사역</span>
              <span className="approval__sign">
                <span className="approval__dojang">심</span>
              </span>
            </div>
            <div className="approval__cell" aria-hidden="true">
              <span className="approval__role">지름신</span>
              <span className="approval__sign">
                {jireumsinApproved(verdict) ? (
                  <span className="approval__dojang approval__dojang--jireumsin">지름</span>
                ) : (
                  '－'
                )}
              </span>
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
            <dt>심사 일자</dt>
            <dd>{verdict.issuedAt}</dd>
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
          {archived ? '결재 대장으로' : '다른 건 심사받기'}
        </button>
      </div>

      {toast && <p className="toast">{toast}</p>}

      {pending !== null && (
        <SignModal
          initialName={signer}
          editOnly={pending === 'edit'}
          onCancel={() => setPending(null)}
          onConfirm={(name) => {
            const action = pending;
            setPending(null);
            if (name) {
              setSigner(name);
              storeSigner(name);
            }
            if (action === 'edit') {
              showToast(name ? '서명을 수정했어요.' : '서명을 지웠어요.');
              return;
            }
            void runAction(action, name);
          }}
        />
      )}
    </main>
  );
}
