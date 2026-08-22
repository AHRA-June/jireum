interface Props {
  onStart: () => void;
}

/** 홈 화면 — 상사 책상 위의 그 결재판. 열면(탭하면) 신청서가 나온다. */
export default function HomeScreen({ onStart }: Props) {
  return (
    <main className="screen screen--center">
      <button className="board" type="button" onClick={onStart} aria-label="결재판 열기">
        <span className="board__clip" aria-hidden="true" />
        <span className="board__frame">
          <span className="board__office">지름 심사 위원회</span>
          <span className="board__seal" aria-hidden="true">
            決裁
          </span>
          <span className="board__title">결재판</span>
          <span className="board__desc">
            대출 심사 모형(CSS)을 만들던 사람이
            <br />
            이제 당신의 지름을 심사합니다.
          </span>
          <span className="board__open">눌러서 심사 신청 →</span>
        </span>
      </button>
      <p className="fine-print">본 판정은 법적 효력이 없으며, 지름은 본인 책임입니다.</p>
    </main>
  );
}
