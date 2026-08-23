import { useState } from 'react';
import { clearHistory, historySummary, loadHistory } from '../history';
import type { HistoryEntry } from '../history';

interface Props {
  onBack: () => void;
  onOpen: (entry: HistoryEntry) => void;
}

/** 결재 대장 — 지난 판정 이력 목록 */
export default function HistoryScreen({ onBack, onOpen }: Props) {
  const [entries, setEntries] = useState(loadHistory);
  const summary = historySummary(entries);

  return (
    <main className="screen">
      <article className="sheet">
        <p className="form-no">■ 지름심사규칙 [별지 제3호 서식]</p>
        <header className="doc-header">
          <p className="doc-header__office">지름 심사 위원회</p>
          <h1 className="doc-header__title">결재 대장</h1>
          <hr className="doc-header__rule" />
          <p className="doc-header__subtitle">
            지금까지 상신하신 결의서 내역입니다. 항목을 누르면 판정서를 다시 볼 수 있어요.
          </p>
        </header>

        <dl className="ledger-summary">
          <div className="ledger-summary__cell">
            <dt>총 심사</dt>
            <dd>{summary.total}건</dd>
          </div>
          <div className="ledger-summary__cell">
            <dt>승인</dt>
            <dd>{summary.approved}건</dd>
          </div>
          <div className="ledger-summary__cell">
            <dt>신청 총액</dt>
            <dd>{summary.amount.toLocaleString('ko-KR')}원</dd>
          </div>
        </dl>

        {entries.length === 0 ? (
          <p className="ledger-empty">아직 상신하신 결의서가 없습니다.</p>
        ) : (
          <ul className="ledger">
            {entries.map((entry) => (
              <li key={entry.docNumber}>
                <button
                  className="ledger__row"
                  type="button"
                  disabled={entry.verdict == null}
                  onClick={() => onOpen(entry)}
                >
                  <span className="ledger__main">
                    <span className="ledger__item">{entry.item}</span>
                    <span className={`ledger__stamp ledger__stamp--${entry.tone}`}>{entry.stamp}</span>
                  </span>
                  <span className="ledger__meta">
                    <span>{entry.price.toLocaleString('ko-KR')}원</span>
                    <span>{entry.score}점</span>
                    <span>{entry.issuedAt}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

      <div className="actions">
        <button className="submit" type="button" onClick={onBack}>
          돌아가기
        </button>
        {entries.length > 0 && (
          <button
            className="submit submit--ghost"
            type="button"
            onClick={() => {
              clearHistory();
              setEntries([]);
            }}
          >
            대장 비우기
          </button>
        )}
      </div>
    </main>
  );
}
