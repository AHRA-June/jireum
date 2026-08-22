import { useState } from 'react';

interface Props {
  onConfirm: (name: string | null) => void;
  onCancel: () => void;
}

/** 저장·공유 전에 결재란에 들어갈 서명(이름)을 받는다. */
export default function SignModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="결재란 서명">
      <div className="modal__sheet">
        <h2 className="modal__title">결재란 서명</h2>
        <p className="modal__desc">판정서 담당 칸에 들어갈 서명을 남겨주세요.</p>
        <input
          className="modal__input"
          type="text"
          value={name}
          maxLength={6}
          placeholder="이름 (최대 6자)"
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onConfirm(name.trim());
          }}
        />
        {name.trim() && (
          <p className="modal__preview" aria-hidden="true">
            {name.trim()}
          </p>
        )}
        <div className="modal__actions">
          <button
            className="submit"
            type="button"
            disabled={!name.trim()}
            onClick={() => onConfirm(name.trim())}
          >
            서명하기
          </button>
          <button className="submit submit--ghost" type="button" onClick={() => onConfirm(null)}>
            서명 없이 진행
          </button>
        </div>
        <button className="modal__close" type="button" onClick={onCancel} aria-label="닫기">
          ×
        </button>
      </div>
    </div>
  );
}
