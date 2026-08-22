import type {
  JireumInput,
  JireumRules,
  JireumVerdict,
  OptionScore,
  PriceBand,
  VerdictGrade,
} from './types';

/**
 * JSON의 condition 문자열을 평가한다.
 * 지원 문법: `field<=N`, `field>N`, `field=='값'`, `&&` 결합.
 * (jireum-rules.json에 등장하는 형태만 지원 — eval 미사용)
 */
export function evalCondition(condition: string, input: JireumInput): boolean {
  return condition.split('&&').every((raw) => {
    const clause = raw.trim();
    let m = clause.match(/^(\w+)\s*(<=|>=|<|>)\s*(\d+)$/);
    if (m) {
      const left = Number(input[m[1] as keyof JireumInput]);
      const right = Number(m[3]);
      switch (m[2]) {
        case '<=': return left <= right;
        case '>=': return left >= right;
        case '<': return left < right;
        case '>': return left > right;
      }
    }
    m = clause.match(/^(\w+)\s*(==|!=)\s*'([^']*)'$/);
    if (m) {
      const left = String(input[m[1] as keyof JireumInput]);
      return m[2] === '==' ? left === m[3] : left !== m[3];
    }
    throw new Error(`지원하지 않는 조건식: ${clause}`);
  });
}

function priceScore(bands: PriceBand[], price: number): number {
  for (const band of bands) {
    if (band.max === null || price <= band.max) return band.score;
  }
  return 0;
}

function optionScore(options: OptionScore[], selected: string): number {
  return options.find((o) => o.option === selected)?.score ?? 0;
}

/** 총점 100 = 가격 + 지름 빈도 + 숙려 기간 + 필요성 */
export function calcScore(rules: JireumRules, input: JireumInput): number {
  const { scoring } = rules;
  return (
    priceScore(scoring.price, input.price) +
    optionScore(scoring.frequency, input.frequency) +
    optionScore(scoring.deliberation, input.deliberation) +
    optionScore(scoring.necessity, input.necessity)
  );
}

export function gradeOf(rules: JireumRules, score: number): VerdictGrade {
  const { approve, conditional } = rules.scoring.cutoff;
  if (score >= approve) return 'approve';
  if (score >= conditional) return 'conditional';
  return 'reject';
}

function formatDocNumber(format: string, random: () => number): string {
  return format.replace('{random4}', String(Math.floor(random() * 10000)).padStart(4, '0'));
}

function pick<T>(pool: T[], random: () => number): T {
  return pool[Math.floor(random() * pool.length)];
}

/**
 * 판정 파이프라인: 특수 규칙 우선 → 점수 계산 → 등급 → 사유 랜덤 + 트리거 문구.
 * `random`은 테스트 주입용 (기본 Math.random).
 */
export function judge(
  rules: JireumRules,
  input: JireumInput,
  random: () => number = Math.random,
): JireumVerdict {
  const score = calcScore(rules, input);
  const docNumber = formatDocNumber(rules.meta.docNumberFormat, random);
  const notes = rules.triggers
    .filter((t) => evalCondition(t.condition, input))
    .map((t) => t.note);

  const special = rules.specialRules.find((r) => evalCondition(r.condition, input));
  if (special) {
    return {
      specialKey: special.key,
      grade: null,
      stamp: special.stamp,
      reason: special.reason,
      notes,
      score,
      docNumber,
    };
  }

  const grade = gradeOf(rules, score);
  const pool = rules.verdicts[grade];
  return {
    specialKey: null,
    grade,
    stamp: pool.stamp,
    reason: pick(pool.reasons, random),
    notes,
    score,
    docNumber,
  };
}
