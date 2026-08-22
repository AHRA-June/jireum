interface Props {
  onStart: () => void;
}

/** 홈 화면 — 사무실의 그 검정 결재판. 열면(탭하면) 신청서가 나온다. */
export default function HomeScreen({ onStart }: Props) {
  return (
    <main className="screen screen--center">
      <button className="board" type="button" onClick={onStart} aria-label="결재판 열기">
        <span className="board__spine" aria-hidden="true" />
        <span className="board__emboss">
          <span className="board__rule board__rule--top" aria-hidden="true" />
          결재를
          <br />
          바랍니다
          <span className="board__rule board__rule--bottom" aria-hidden="true" />
        </span>
        <span className="board__label" aria-hidden="true">
          <span className="board__label-row">
            <span className="board__label-key">Team:</span>
            <span className="board__label-value">지름 심사 위원회</span>
          </span>
          <span className="board__label-row">
            <span className="board__label-key">Name:</span>
            <span className="board__label-value board__label-value--blank" />
          </span>
        </span>
      </button>
      <p className="board__hint">눌러서 심사 신청</p>
      <p className="fine-print">본 판정은 법적 효력이 없으며, 지름은 본인 책임입니다.</p>
    </main>
  );
}
