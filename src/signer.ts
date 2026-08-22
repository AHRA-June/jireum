/** 결재란 서명(이름) — 한 번 서명하면 기기에 기억한다. */
const SIGNER_KEY = 'jireum_signer';

export function loadSigner(): string | null {
  try {
    return localStorage.getItem(SIGNER_KEY);
  } catch {
    return null;
  }
}

export function storeSigner(name: string | null): void {
  try {
    if (name) localStorage.setItem(SIGNER_KEY, name);
  } catch {
    // 저장 불가 환경 — 무시
  }
}
