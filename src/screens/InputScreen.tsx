import { useMemo, useState } from 'react';
import type { JireumInput, JireumRules } from '../engine/types';
import OptionGroup from '../components/OptionGroup';
import SignModal from '../components/SignModal';
import { loadSigner, storeSigner } from '../signer';

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
  const [signer, setSigner] = useState<string | null>(loadSigner);
  const [signing, setSigning] = useState(false);

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
          <h1 className="doc-header__title">지름 결의서</h1>
          <hr className="doc-header__rule" />
          <p className="doc-header__subtitle">
            대출 심사 모형(CSS)을 만들던 사람이 이제 당신의 지름을 심사합니다.
          </p>
        </header>

        {/* 기안자 — 눌러서 서명(이름)을 넣거나 고친다 */}
        <div className="drafter">
          <span className="drafter__key">기안자</span>
          <button className="drafter__value" type="button" onClick={() => setSigning(true)}>
            {signer ? (
              <span className="drafter__name">{signer}</span>
            ) : (
              <span className="drafter__blank">서명하기</span>
            )}
          </button>
        </div>

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

        <p className="form-oath">위 금액을 영수(청구)합니다.</p>
        <button className="submit" type="submit" disabled={!ready}>
          결재 상신
        </button>
        <p className="fine-print">{rules.meta.disclaimer}</p>
        </form>
      </article>

      {signing && (
        <SignModal
          initialName={signer}
          editOnly
          onCancel={() => setSigning(false)}
          onConfirm={(name) => {
            setSigning(false);
            if (name) {
              setSigner(name);
              storeSigner(name);
            }
          }}
        />
      )}
    </main>
  );
}
