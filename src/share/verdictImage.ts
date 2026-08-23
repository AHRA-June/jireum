import type { JireumInput, JireumRules, JireumVerdict } from '../engine/types';

/**
 * 판정서를 카톡 공유용 PNG(1080x1440)로 그린다.
 * 화면 CSS와 같은 톤: 미색 용지, 이중 괘선, 결재란, 명조 제목, 인주 도장.
 */

const W = 1080;
const H = 1440;

const INK = '#26221b';
const INK_SOFT = '#857d6e';
const SHEET = '#fcfaf4';
const SHEET_DEEP = '#f3efe5';
const LINE = '#cfc8b8';
const NAVY = '#1f419b';
const PEN = '#23305e';
const RED = '#c03528';

const TONE_COLOR: Record<string, string> = {
  blue: NAVY,
  orange: '#c2551f',
  red: RED,
  gray: '#5b564c',
};

const SERIF = '"Noto Serif KR", serif';
const GOTHIC = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const PEN_FONT = '"Nanum Pen Script", cursive';

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const probe = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(probe).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = probe;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

/** 담당 칸의 휘갈긴 사인 (이름이 없을 때) */
function drawScribble(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-6 * Math.PI) / 180);
  ctx.strokeStyle = PEN;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = 2.1;
  ctx.beginPath();
  ctx.moveTo(-22 * s, 4 * s);
  ctx.bezierCurveTo(-19 * s, -7 * s, -16 * s, -8 * s, -15 * s, -2 * s);
  ctx.bezierCurveTo(-14 * s, 4 * s, -12 * s, 5 * s, -10 * s, -3 * s);
  ctx.bezierCurveTo(-8 * s, -9 * s, -6 * s, -7 * s, -5 * s, -1 * s);
  ctx.bezierCurveTo(-4 * s, 5 * s, -1 * s, 3 * s, 2 * s, -4 * s);
  ctx.bezierCurveTo(4 * s, -8 * s, 6 * s, -6 * s, 6 * s, -2 * s);
  ctx.bezierCurveTo(6 * s, 2 * s, 9 * s, 2 * s, 13 * s, -2 * s);
  ctx.moveTo(-19 * s, 7 * s);
  ctx.bezierCurveTo(-9 * s, 10 * s, 5 * s, 9 * s, 16 * s, 4 * s);
  ctx.stroke();
  ctx.restore();
}

export async function renderVerdictImage(
  rules: JireumRules,
  input: JireumInput,
  verdict: JireumVerdict,
  tone: 'blue' | 'orange' | 'red' | 'gray',
  signerName: string | null,
  jireumsinApproved: boolean,
): Promise<string> {
  // 폰트가 로드되기 전에 그리면 폴백 글꼴로 박제된다
  await Promise.all([
    document.fonts.load(`900 64px ${SERIF}`),
    document.fonts.load(`700 30px ${SERIF}`),
    document.fonts.load(`600 26px ${SERIF}`),
    document.fonts.load(`400 44px ${PEN_FONT}`),
  ]).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── 용지 + 이중 괘선 ──
  ctx.fillStyle = SHEET;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 34, W - 68, H - 68);
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // ── 워터마크 ──
  ctx.save();
  ctx.translate(W / 2, H / 2 + 40);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.font = `900 200px ${SERIF}`;
  ctx.fillStyle = 'rgba(38, 34, 27, 0.05)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('심사필', 0, 0);
  ctx.restore();

  // ── 결재란 (우상단) ──
  const cellW = 118;
  const headH = 46;
  const signH = 84;
  const aX = W - 90 - cellW * 3;
  const aY = 88;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.fillStyle = SHEET_DEEP;
  ctx.fillRect(aX, aY, cellW * 3, headH);
  ctx.strokeRect(aX, aY, cellW * 3, headH + signH);
  ctx.beginPath();
  ctx.moveTo(aX, aY + headH);
  ctx.lineTo(aX + cellW * 3, aY + headH);
  ctx.moveTo(aX + cellW, aY);
  ctx.lineTo(aX + cellW, aY + headH + signH);
  ctx.moveTo(aX + cellW * 2, aY);
  ctx.lineTo(aX + cellW * 2, aY + headH + signH);
  ctx.stroke();
  ctx.font = `600 22px ${SERIF}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const roles = ['담당', '심사역', '지름신'];
  roles.forEach((role, i) => {
    ctx.fillText(role, aX + cellW * i + cellW / 2 - (i === 2 ? 14 : 0), aY + headH / 2 + 1);
  });
  // 지름신은 전결권자
  ctx.font = `400 14px ${GOTHIC}`;
  ctx.fillStyle = INK_SOFT;
  ctx.fillText('전결', aX + cellW * 2.5 + 32, aY + headH / 2 + 1);
  // 담당: 필기체 이름 또는 휘갈긴 사인
  const signCy = aY + headH + signH / 2;
  if (signerName) {
    ctx.save();
    ctx.translate(aX + cellW / 2, signCy);
    ctx.rotate((-8 * Math.PI) / 180);
    ctx.font = `400 ${signerName.length >= 3 ? 34 : 44}px ${PEN_FONT}`;
    ctx.fillStyle = PEN;
    ctx.fillText(signerName, 0, 2);
    ctx.restore();
  } else {
    drawScribble(ctx, aX + cellW / 2, signCy);
  }
  // 심사역: 원형 막도장
  ctx.save();
  ctx.translate(aX + cellW * 1.5, signCy);
  ctx.rotate((8 * Math.PI) / 180);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `700 28px ${SERIF}`;
  ctx.fillStyle = RED;
  ctx.fillText('심', 0, 2);
  ctx.restore();
  // 지름신: 승인 건에만 결재 도장
  if (jireumsinApproved) {
    ctx.save();
    ctx.translate(aX + cellW * 2.5, signCy);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `700 20px ${SERIF}`;
    ctx.fillStyle = RED;
    ctx.fillText('지름', 0, 2);
    ctx.restore();
  } else {
    ctx.font = `700 26px ${SERIF}`;
    ctx.fillStyle = INK;
    ctx.fillText('－', aX + cellW * 2.5, signCy);
  }

  // ── 헤더 ──
  ctx.textAlign = 'center';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 27px ${SERIF}`;
  ctx.letterSpacing = '14px';
  ctx.fillText('지름 심사 위원회', W / 2 + 7, 300);
  ctx.fillStyle = INK;
  ctx.font = `900 68px ${SERIF}`;
  ctx.letterSpacing = '16px';
  ctx.fillText('지름 심사 판정서', W / 2 + 8, 386);
  ctx.letterSpacing = '2px';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 28px ${GOTHIC}`;
  ctx.fillText(verdict.docNumber, W / 2, 448);
  ctx.letterSpacing = '0px';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(90, 496);
  ctx.lineTo(W - 90, 496);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(90, 503);
  ctx.lineTo(W - 90, 503);
  ctx.stroke();

  // ── 심사표 ──
  const tX = 90;
  const tY = 540;
  const tW = W - 180;
  const rowH = 72;
  const labelW = 250;
  const rows: [string, string][] = [
    ['신청 품목', input.item],
    ['신청 금액', `${input.price.toLocaleString('ko-KR')}원`],
    ['심사 일자', verdict.issuedAt],
    [
      '심사 점수',
      `${verdict.score}점 / 100점${verdict.specialKey !== null ? ' (점수 미반영)' : ''}`,
    ],
  ];
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(tX, tY, tW, rowH * rows.length);
  rows.forEach(([label, value], i) => {
    const y = tY + rowH * i;
    ctx.fillStyle = SHEET_DEEP;
    ctx.fillRect(tX, y, labelW, rowH);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(tX, y);
      ctx.lineTo(tX + tW, y);
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tX + labelW, y);
    ctx.lineTo(tX + labelW, y + rowH);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = `700 28px ${SERIF}`;
    ctx.letterSpacing = '4px';
    ctx.fillText(label, tX + labelW / 2 + 2, y + rowH / 2 + 1);
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'left';
    ctx.font = `400 29px ${GOTHIC}`;
    let display = value;
    while (ctx.measureText(display).width > tW - labelW - 60 && display.length > 1) {
      display = `${display.slice(0, -2)}…`;
    }
    ctx.fillText(display, tX + labelW + 30, y + rowH / 2 + 1);
  });

  // ── 판정 도장 ──
  const stampColor = TONE_COLOR[tone];
  ctx.save();
  ctx.translate(W / 2, 940);
  ctx.rotate((-7 * Math.PI) / 180);
  ctx.globalAlpha = 0.92;
  ctx.font = `900 72px ${SERIF}`;
  ctx.letterSpacing = '22px';
  const stampText = verdict.stamp;
  const stW = ctx.measureText(stampText).width + 70;
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(-stW / 2, -78, stW, 156, 24);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-stW / 2 + 10, -68, stW - 20, 136, 18);
  ctx.stroke();
  ctx.fillStyle = stampColor;
  ctx.textAlign = 'center';
  ctx.fillText(stampText, 11, 2);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // ── 판정 사유 ──
  let y = 1108;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(90, y - 44);
  ctx.lineTo(W - 90, y - 44);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 25px ${SERIF}`;
  ctx.letterSpacing = '10px';
  ctx.fillText('판정 사유', 90, y);
  ctx.letterSpacing = '0px';
  y += 52;
  ctx.fillStyle = INK;
  ctx.font = `400 30px ${GOTHIC}`;
  for (const line of wrapText(ctx, verdict.reason, W - 180).slice(0, 3)) {
    ctx.fillText(line, 90, y);
    y += 46;
  }
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 26px ${GOTHIC}`;
  for (const note of verdict.notes.slice(0, 1)) {
    for (const line of wrapText(ctx, note, W - 180).slice(0, 2)) {
      ctx.fillText(line, 90, y);
      y += 40;
    }
  }

  // ── 하단 서명 ──
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(90, 1290);
  ctx.lineTo(W - 90, 1290);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 27px ${SERIF}`;
  ctx.fillText(rules.meta.signature, W / 2, 1330);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 21px ${GOTHIC}`;
  ctx.fillText(rules.meta.disclaimer, W / 2, 1366);

  return canvas.toDataURL('image/png');
}
