import { useRef, useState } from 'react';
import { triggerHaptic } from '../toss/bridge';
import { loadSigner } from '../signer';

interface Props {
  onStart: () => void;
}

/** 표지가 다 젖혀지기 전에 화면을 전환하면 뚝 끊겨 보여서, 애니메이션 길이와 맞춘다. */
const OPEN_MS = 600;

/** 홈 화면 — 사무실의 그 검정 결재판. 열면(탭하면) 신청서가 나온다. */
export default function HomeScreen({ onStart }: Props) {
  const [opening, setOpening] = useState(false);
  // 판정서에서 한 번 서명했다면 결재판 명찰에도 이름이 채워진다
  const signer = loadSigner();
  const startedRef = useRef(false);

  const handleOpen = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    void triggerHaptic('tap');
    setOpening(true);
    window.setTimeout(onStart, OPEN_MS);
  };

  return (
    <main className="screen screen--center">
      <div className="board-stage">
        {/* 표지 밑에 깔린 속지 — 표지가 젖혀지면 드러난다 */}
        <span className="board-under" aria-hidden="true" />
        <button
          className={`board${opening ? ' board--opening' : ''}`}
          type="button"
          onClick={handleOpen}
          aria-label="결재판 열기"
        >
          <span className="board__spine" aria-hidden="true" />
          <span className="board__emboss">
            <span className="board__rule" aria-hidden="true" />
            결재를
            <br />
            바랍니다
            <span className="board__rule" aria-hidden="true" />
          </span>
          <span className="board__label" aria-hidden="true">
            <span className="board__label-row">
              <span className="board__label-key">Team:</span>
              <span className="board__label-value">자금집행팀</span>
            </span>
            <span className="board__label-row">
              <span className="board__label-key">Name:</span>
              {signer ? (
              <span className="board__label-value board__label-value--signed">{signer}</span>
            ) : (
              <span className="board__label-value board__label-value--blank" />
            )}
            </span>
          </span>
        </button>
      </div>
      <p className={`board__hint${opening ? ' board__hint--hidden' : ''}`}>눌러서 결의서 작성</p>
      <p className="fine-print">본 판정은 법적 효력이 없으며, 지름은 본인 책임입니다.</p>
    </main>
  );
}
