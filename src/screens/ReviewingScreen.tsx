const STEPS = ['신청 서류 접수', '소비 이력 조회', '충동 지수 산출', '심사역 검토'];

/** 2.5초짜리 정색 — 서류 넘기는 애니메이션과 심사 단계 문구 */
export default function ReviewingScreen() {
  return (
    <main className="screen screen--center" aria-live="polite">
      <div className="papers" aria-hidden="true">
        <div className="papers__sheet papers__sheet--1" />
        <div className="papers__sheet papers__sheet--2" />
        <div className="papers__sheet papers__sheet--3" />
      </div>
      <h1 className="reviewing__title">심사 중…</h1>
      <ol className="reviewing__steps">
        {STEPS.map((step, i) => (
          <li key={step} className="reviewing__step" style={{ animationDelay: `${i * 0.55}s` }}>
            {step}
          </li>
        ))}
      </ol>
    </main>
  );
}
