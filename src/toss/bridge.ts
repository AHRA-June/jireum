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

export type OgVariant = 'approve' | 'conditional' | 'reject' | 'decided';

/**
 * 링크 미리보기에 뜰 판정 이미지 주소.
 * 도메인을 박아두면 QR 테스트 환경(private-web)과 운영(web)이 갈려 404가 나므로,
 * 지금 이 번들이 서빙되고 있는 origin을 그대로 쓴다.
 */
function ogImageUrl(variant: OgVariant): string | undefined {
  const origin = window.location.origin;
  if (!origin.startsWith('https://')) return undefined; // 로컬 개발 등 외부에서 못 여는 주소
  return `${origin}/og/${variant}.png`;
}

/**
 * 토스 앱에서 이 미니앱을 열 수 있는 공유 링크를 만든다.
 * `variant`에 맞는 판정 이미지를 미리보기로 지정해, 링크만 전달돼도
 * 상대방이 승인/부결을 바로 본다. 실패하면 null.
 */
export async function createShareLink(variant: OgVariant): Promise<string | null> {
  const path = 'intoss://jireumform';
  const og = ogImageUrl(variant);
  if (og) {
    try {
      const link = await Share.createLink({ path, ogImageUrl: og });
      if (link) return link;
    } catch {
      // ogImageUrl은 토스 Android 5.240.0 / iOS 5.239.0 이상에서만 동작한다.
      // 구버전에서 실패하면 이미지 없이라도 링크는 보내야 하므로 아래로 폴백.
    }
  }
  try {
    const link = await Share.createLink({ path });
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

/**
 * 판정서 이미지를 시스템 공유 시트로 공유한다. 파일 공유가 안 되면 false.
 *
 * 웹뷰에 따라 `canShare`를 아예 노출하지 않으면서 `share({files})`는 되는 경우가 있어,
 * canShare가 명시적으로 false일 때만 포기하고 나머지는 일단 시도해 본다.
 */
export async function shareVerdictImage(dataUrl: string, text: string): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new window.File([blob], 'jireum-verdict.png', { type: 'image/png' });
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
    await navigator.share({ files: [file], text });
    return true;
  } catch (e) {
    // 사용자가 공유 시트를 닫은 경우도 여기로 온다 — 성공으로 취급
    if (e instanceof DOMException && e.name === 'AbortError') return true;
    return false;
  }
}
