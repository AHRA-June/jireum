/** jireum-rules.json 스키마 — 배점·문구는 전부 이 JSON에서 온다 (하드코딩 금지). */

export interface PriceBand {
  /** 이 금액 이하일 때 적용. null이면 상한 없음(캐치올). */
  max: number | null;
  score: number;
}

export interface OptionScore {
  option: string;
  score: number;
}

export interface ScoringRules {
  price: PriceBand[];
  frequency: OptionScore[];
  deliberation: OptionScore[];
  necessity: OptionScore[];
  cutoff: { approve: number; conditional: number };
}

export type VerdictGrade = 'approve' | 'conditional' | 'reject';

export interface VerdictPool {
  stamp: string;
  reasons: string[];
}

export interface SpecialRule {
  key: string;
  /** 예: "price<=10000 && frequency=='1번째'" */
  condition: string;
  stamp: string;
  reason: string;
}

export interface TriggerRule {
  condition: string;
  note: string;
}

export interface JireumRules {
  scoring: ScoringRules;
  verdicts: Record<VerdictGrade, VerdictPool>;
  specialRules: SpecialRule[];
  triggers: TriggerRule[];
  meta: {
    signature: string;
    disclaimer: string;
    docNumberFormat: string;
  };
}

/** 사용자 입력 (5문항) */
export interface JireumInput {
  item: string;
  price: number;
  frequency: string;
  deliberation: string;
  necessity: string;
}

export interface JireumVerdict {
  /** 특수 규칙에 걸리면 그 key, 아니면 null */
  specialKey: string | null;
  grade: VerdictGrade | null;
  stamp: string;
  /** 등급별 풀에서 뽑은 판정 사유 (특수 규칙이면 전용 문구) */
  reason: string;
  /** 조건 트리거 참고 문구 (해당 시) */
  notes: string[];
  score: number;
  docNumber: string;
}
