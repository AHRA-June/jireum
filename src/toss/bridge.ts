/**
 * 앱인토스 SDK 래퍼.
 * 브릿지는 토스 앱 안에서만 동작하므로, 일반 브라우저(개발/미리보기)에서는
 * 조용히 폴백한다 — UI 코드는 환경을 신경 쓰지 않아도 된다.
 */
import { Analytics, Device, Share } from '@apps-in-toss/web-framework';

export async function triggerHaptic(type: 'softMedium' | 'success' | 'error'): Promise<void> {
  try {
    await Device.triggerHaptic?.({ type });
  } catch {
    // 브릿지 없음 (브라우저) — 무시
  }
}

export async function shareVerdict(message: string): Promise<boolean> {
  try {
    await Share.sendMessage({ message });
    return true;
  } catch {
    // 브라우저 폴백: Web Share API → 클립보드
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return true;
      }
      await navigator.clipboard.writeText(message);
      return true;
    } catch {
      return false;
    }
  }
}

export function logEvent(name: string, params: Record<string, string | number> = {}): void {
  try {
    void Analytics.log({ log_type: 'event', log_name: name, params });
  } catch {
    // 미지원 환경 — 무시
  }
}
