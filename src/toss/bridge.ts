/**
 * 앱인토스 SDK 래퍼.
 * 브릿지는 토스 앱 안에서만 동작하므로, 일반 브라우저(개발/미리보기)에서는
 * 조용히 폴백한다 — UI 코드는 환경을 신경 쓰지 않아도 된다.
 */
import { Analytics, Device, Share } from '@apps-in-toss/web-framework';

export async function triggerHaptic(type: 'tap' | 'softMedium' | 'success' | 'error'): Promise<void> {
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

/** 카톡 링크 미리보기에 뜰 판정 이미지 — 서비스 도메인에 정적으로 올라간다. */
const OG_BASE = 'https://jireumform.web.tossmini.com/og';

export type OgVariant = 'approve' | 'conditional' | 'reject' | 'decided';

/**
 * 토스 앱에서 이 미니앱을 열 수 있는 공유 링크를 만든다.
 * `variant`에 맞는 판정 이미지를 미리보기로 지정해, 링크만 전달돼도
 * 상대방이 승인/부결을 바로 본다. 실패하면 null.
 */
export async function createShareLink(variant: OgVariant): Promise<string | null> {
  try {
    const link = await Share.createLink({
      path: 'intoss://jireumform',
      ogImageUrl: `${OG_BASE}/${variant}.png`,
    });
    return link ?? null;
  } catch {
    return null;
  }
}

/** 판정서 PNG를 앨범(기기)에 저장한다. 토스 밖에서는 다운로드로 폴백. */
export async function saveVerdictImage(dataUrl: string, fileName: string): Promise<boolean> {
  const base64 = dataUrl.split(',')[1];
  try {
    const { File } = await import('@apps-in-toss/web-framework');
    if (File.saveBase64.isSupported()) {
      await File.saveBase64({ data: base64, fileName, mimeType: 'image/png' });
      return true;
    }
  } catch {
    // 브릿지 없음 — 아래 브라우저 폴백으로
  }
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
    return true;
  } catch {
    return false;
  }
}

/** 판정서 이미지를 시스템 공유 시트로 공유한다. 파일 공유가 안 되면 false. */
export async function shareVerdictImage(dataUrl: string, text: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new window.File([blob], 'jireum-verdict.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return true;
    }
  } catch (e) {
    // 사용자가 공유 시트를 닫은 경우도 여기로 온다 — 성공으로 취급
    if (e instanceof DOMException && e.name === 'AbortError') return true;
  }
  return false;
}
