import { describe, expect, it } from 'vitest';
import rulesJson from '../rules/jireum-rules.json';
import { calcScore, evalCondition, gradeOf, judge } from './judge';
import type { JireumInput, JireumRules } from './types';

const rules = rulesJson as JireumRules;

/** 규칙은 key로 찾는다 — 배열 순서가 바뀌어도 테스트가 깨지지 않게 */
function specialRule(key: string) {
  const rule = rules.specialRules.find((r) => r.key === key);
  if (!rule) throw new Error(`특수 규칙 없음: ${key}`);
  return rule;
}

function input(partial: Partial<JireumInput>): JireumInput {
  return {
    item: '테스트 품목',
    price: 100000,
    frequency: '2~3번째',
    deliberation: '일주일쯤',
    necessity: '좀 아쉬움',
    ...partial,
  };
}

describe('gradeOf — 등급 경계값 (39/40/69/70)', () => {
  it('39점은 부결', () => expect(gradeOf(rules, 39)).toBe('reject'));
  it('40점은 조건부 승인', () => expect(gradeOf(rules, 40)).toBe('conditional'));
  it('69점은 조건부 승인', () => expect(gradeOf(rules, 69)).toBe('conditional'));
  it('70점은 승인', () => expect(gradeOf(rules, 70)).toBe('approve'));
});

describe('calcScore — 배점표 합산', () => {
  it('만점 조합 = 100', () => {
    // 가격 40 + 빈도 30 + 숙려 20 + 필요성 10 (특수 규칙 여부와 무관하게 점수만 검증)
    const score = calcScore(
      rules,
      input({ price: 9000, frequency: '1번째', deliberation: '한 달 이상', necessity: '일상에 지장' }),
    );
    expect(score).toBe(100);
  });

  it('최저 조합 = 0', () => {
    const score = calcScore(
      rules,
      input({
        price: 600000,
        frequency: '세지 않습니다',
        deliberation: '이미 결제창입니다',
        necessity: '그냥 예뻐서요',
      }),
    );
    expect(score).toBe(0);
  });

  it('가격 경계: 10000원은 40점 구간, 10001원은 30점 구간', () => {
    const base = { frequency: '세지 않습니다', deliberation: '이미 결제창입니다', necessity: '그냥 예뻐서요' };
    expect(calcScore(rules, input({ ...base, price: 10000 }))).toBe(40);
    expect(calcScore(rules, input({ ...base, price: 10001 }))).toBe(30);
  });

  it('승인 경계 조합: 40+20+5+5 = 70 → 승인', () => {
    const v = judge(
      rules,
      input({ price: 9000, frequency: '2~3번째', deliberation: '오늘 처음 봤는데요', necessity: '좀 아쉬움' }),
      () => 0,
    );
    expect(v.score).toBe(70);
    expect(v.grade).toBe('approve');
    expect(v.stamp).toBe(rules.verdicts.approve.stamp);
  });

  it('부결 조합: 20+10+5+0 = 35 → 부결', () => {
    const v = judge(
      rules,
      input({ price: 150000, frequency: '4~5번째', deliberation: '오늘 처음 봤는데요', necessity: '그냥 예뻐서요' }),
      () => 0,
    );
    expect(v.score).toBe(35);
    expect(v.grade).toBe('reject');
    expect(v.stamp).toBe(rules.verdicts.reject.stamp);
  });
});

describe('특수 규칙 — 점수 무시하고 전용 문구', () => {
  it('1만원 이하 + 첫 지름 → 즉시 승인', () => {
    const v = judge(rules, input({ price: 10000, frequency: '1번째' }), () => 0);
    expect(v.specialKey).toBe('instant_approve');
    expect(v.grade).toBeNull();
    expect(v.stamp).toBe('즉시 승인');
    expect(v.reason).toBe(specialRule('instant_approve').reason);
  });

  it('10001원 + 첫 지름은 특수 규칙 미적용', () => {
    const v = judge(rules, input({ price: 10001, frequency: '1번째' }), () => 0);
    expect(v.specialKey).toBeNull();
  });

  it('"세지 않습니다" + "이미 결제창입니다" → 심사 무의미', () => {
    const v = judge(
      rules,
      input({ frequency: '세지 않습니다', deliberation: '이미 결제창입니다' }),
      () => 0,
    );
    expect(v.specialKey).toBe('already_decided');
    expect(v.stamp).toBe('심사 무의미');
    expect(v.reason).toBe(specialRule('already_decided').reason);
  });
});

describe('트리거 참고 문구', () => {
  it('고액(>50만원) + 세지 않습니다 → 트리거 2개', () => {
    const v = judge(rules, input({ price: 500001, frequency: '세지 않습니다' }), () => 0);
    expect(v.notes).toHaveLength(2);
  });

  it('50만원 정확히는 고액 트리거 미발동', () => {
    const v = judge(rules, input({ price: 500000 }), () => 0);
    expect(v.notes).toHaveLength(0);
  });
});

describe('문서번호와 랜덤 사유', () => {
  it('문서번호 형식: 제2026-지름-NNNN호', () => {
    const v = judge(rules, input({}), () => 0.0847);
    expect(v.docNumber).toMatch(/^제2026-지름-\d{4}호$/);
  });

  it('random 값에 따라 사유 풀에서 다른 문구가 나온다', () => {
    const first = judge(rules, input({}), () => 0);
    const last = judge(rules, input({}), () => 0.999);
    expect(first.reason).not.toBe(last.reason);
    const pool = rules.verdicts[first.grade!].reasons;
    expect(pool).toContain(first.reason);
    expect(pool).toContain(last.reason);
  });
});

describe('evalCondition', () => {
  it('지원하지 않는 문법은 throw', () => {
    expect(() => evalCondition('price ~= 3', input({}))).toThrow();
  });
});

describe('문서번호', () => {
  const at = (iso: string) => () => new Date(iso);

  it('연도는 심사한 날짜에서 온다', () => {
    const v = judge(rules, input({}), () => 0.5, at('2027-03-04T10:00:00'));
    expect(v.docNumber).toBe('제2027-지름-5000호');
  });

  it('뒤 4자리는 매번 새로 뽑힌다', () => {
    const a = judge(rules, input({}), () => 0.1234, at('2026-08-23T10:00:00'));
    const b = judge(rules, input({}), () => 0.9876, at('2026-08-23T10:00:00'));
    expect(a.docNumber).not.toBe(b.docNumber);
    expect(a.docNumber).toMatch(/^제2026-지름-\d{4}호$/);
    expect(b.docNumber).toMatch(/^제2026-지름-\d{4}호$/);
  });
});

describe('고액 특수 규칙 — 전결 권한 초과', () => {
  it('300만원 초과는 점수와 무관하게 권한 초과 판정', () => {
    // 점수만 보면 60점(조건부 승인)이 나오는 조합
    const v = judge(
      rules,
      input({
        item: '차',
        price: 35000000,
        frequency: '1번째',
        deliberation: '한 달 이상',
        necessity: '일상에 지장',
      }),
    );
    expect(v.specialKey).toBe('over_limit');
    expect(v.stamp).toBe('권한 초과');
    expect(v.grade).toBeNull();
  });

  it('300만원 정확히는 통상 심사', () => {
    const v = judge(rules, input({ price: 3000000 }));
    expect(v.specialKey).toBeNull();
  });

  it('300만원 초과는 즉시 승인보다 우선한다', () => {
    // 만원 이하 + 첫 지름이라도 금액이 크면 성립할 수 없으므로, 규칙 순서만 확인
    const v = judge(rules, input({ price: 3000001, frequency: '1번째' }));
    expect(v.specialKey).toBe('over_limit');
  });
});
