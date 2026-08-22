import { useMemo, useState } from 'react';
import type { JireumInput, JireumRules } from '../engine/types';
import OptionGroup from '../components/OptionGroup';

interface Props {
  rules: JireumRules;
  onSubmit: (input: JireumInput) => void;
}

/** "120000" → "120,000" */
function formatPrice(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function InputScreen({ rules, onSubmit }: Props) {
  const [item, setItem] = useState('');
  const [priceRaw, setPriceRaw] = useState('');
  const [frequency, setFrequency] = useState<string | null>(null);
  const [deliberation, setDeliberation] = useState<string | null>(null);
  const [necessity, setNecessity] = useState<string | null>(null);

  // 선택지 목록도 배점표(JSON)에서 그대로 가져온다.
  const options = useMemo(
    () => ({
      frequency: rules.scoring.frequency.map((o) => o.option),
      deliberation: rules.scoring.deliberation.map((o) => o.option),
      necessity: rules.scoring.necessity.map((o) => o.option),
    }),
    [rules],
  );

  const price = priceRaw === '' ? null : Number(priceRaw);
  const ready =
    item.trim().length > 0 && price !== null && frequency !== null && deliberation !== null && necessity !== null;

  return (
    <main className="screen">
      <article className="sheet">
        <p className="form-no">■ 지름심사규칙 [별지 제1호 서식]</p>
        <header className="doc-header">
          <p className="doc-header__office">지름 심사 위원회</p>
          <h1 className="doc-header__title">지름 심사 신청서</h1>
          <hr className="doc-header__rule" />
          <p className="doc-header__subtitle">
            대출 심사 모형(CSS)을 만들던 사람이 이제 당신의 지름을 심사합니다.
          </p>
        </header>

        <form
          className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          onSubmit({
            item: item.trim(),
            price: price!,
            frequency: frequency!,
            deliberation: deliberation!,
            necessity: necessity!,
          });
        }}
      >
        <label className="field">
          <span className="field__label">1. 신청 품목</span>
          <input
            className="field__input"
            type="text"
            value={item}
            maxLength={40}
            placeholder="예: 키보드 (판정서에 그대로 인쇄됩니다)"
            onChange={(e) => setItem(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">2. 신청 금액</span>
          <div className="field__price">
            <input
              className="field__input"
              type="text"
              inputMode="numeric"
              value={formatPrice(priceRaw)}
              placeholder="0"
              onChange={(e) => setPriceRaw(e.target.value.replace(/\D/g, '').slice(0, 9))}
            />
            <span className="field__unit">원</span>
          </div>
        </label>

        <OptionGroup
          label="3. 이번 달 몇 번째 지름인가요?"
          options={options.frequency}
          value={frequency}
          onChange={setFrequency}
        />
        <OptionGroup
          label="4. 장바구니에 얼마나 묵혔나요?"
          options={options.deliberation}
          value={deliberation}
          onChange={setDeliberation}
        />
        <OptionGroup
          label="5. 이게 없으면 어떻게 되나요?"
          options={options.necessity}
          value={necessity}
          onChange={setNecessity}
        />

        <button className="submit" type="submit" disabled={!ready}>
          심사 신청
        </button>
        <p className="fine-print">{rules.meta.disclaimer}</p>
        </form>
      </article>
    </main>
  );
}
