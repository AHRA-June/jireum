import type { JireumInput, JireumVerdict } from './engine/types';

/** 결재 대장 — 지난 판정 이력을 기기에 남긴다. */

const HISTORY_KEY = 'jireum_history';
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  docNumber: string;
  item: string;
  price: number;
  stamp: string;
  score: number;
  issuedAt: string;
  tone: 'blue' | 'orange' | 'red' | 'gray';
  /** 정렬용 타임스탬프 */
  ts: number;
  /** 판정서를 그대로 다시 열기 위한 원본 (구버전 기록에는 없을 수 있음) */
  input?: JireumInput;
  verdict?: JireumVerdict;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistory(
  input: JireumInput,
  verdict: JireumVerdict,
  tone: HistoryEntry['tone'],
): void {
  try {
    const entry: HistoryEntry = {
      docNumber: verdict.docNumber,
      item: input.item,
      price: input.price,
      stamp: verdict.stamp,
      score: verdict.score,
      issuedAt: verdict.issuedAt,
      tone,
      ts: Date.now(),
      input,
      verdict,
    };
    // 같은 판정이 재렌더로 두 번 기록되는 것만 막는다.
    // (문서번호는 랜덤이라 드물게 겹칠 수 있는데, 그때 옛 기록을 지우면 안 된다)
    const history = loadHistory();
    if (history[0]?.docNumber === entry.docNumber) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, MAX_ENTRIES)));
  } catch {
    // 저장 불가 환경 — 이력은 부가 기능이므로 조용히 무시
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // 무시
  }
}

/** 승인·즉시승인 건수 / 전체 건수 */
export function historySummary(entries: HistoryEntry[]): { total: number; approved: number; amount: number } {
  return {
    total: entries.length,
    approved: entries.filter((e) => e.tone === 'blue').length,
    amount: entries.reduce((sum, e) => sum + e.price, 0),
  };
}
