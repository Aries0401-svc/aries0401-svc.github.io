// =====================
// 공용 스크립트
// =====================

// 연도 자동 표기
document.getElementById('year')?.append(new Date().getFullYear());

// 카드에 키보드 인터랙션(Enter/Space) 지원
document.querySelectorAll('.card').forEach(card => {
  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

// =====================
// Starfield: 왼쪽 ➜ 오른쪽 (살짝 하강) 은하수 배경
// =====================
(() => {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /** 캔버스 & 컨텍스트 */
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  /** 디바이스 픽셀 비율 */
  const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

  /** 레이어 구성: 멀리/중간/가까이 (패럴랙스) */
  const LAYERS = [
    { count: 120, speedX: 18, speedY: 6,  size: [0.7, 1.3], twinkle: [0.15, 0.35] }, // 먼 별
    { count: 140, speedX: 36, speedY: 12, size: [1.0, 2.0], twinkle: [0.25, 0.55] }, // 중간
    { count: 90,  speedX: 66, speedY: 18, size: [1.6, 2.6], twinkle: [0.35, 0.75] }, // 가까운 별
  ];

  /** 별 텍스처(부드러운 글로우) 사전 렌더 */
  const STAR_TEXTURES = createStarTextures();

  /** 리사이즈 */
  function resize() {
    const w = Math.floor(window.innerWidth  * DPR);
    const h = Math.floor(window.innerHeight * DPR);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }

  /** 유틸 */
  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  /** 별 풀 */
  let stars = [];
  function resetStars() {
    const w = canvas.width, h = canvas.height;
    stars.length = 0;

    for (const layer of LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        const size = rand(layer.size[0], layer.size[1]) * DPR;
        const speedX = (layer.speedX + rand(-4, 6)) * DPR; // ➜ 오른쪽으로 흐름
        const speedY = (layer.speedY + rand(-2, 4)) * DPR; // ↘ 살짝 하강
        const twFreq = rand(0.8, 2.0);  // 반짝 주기(Hz 비슷한 느낌)
        const twAmp  = rand(layer.twinkle[0], layer.twinkle[1]); // 반짝 세기
        const phase  = rand(0, Math.PI * 2);

        stars.push({
          x: rand(0, w),
          y: rand(0, h),
          r: size,
          vx: speedX / 60, // px/frame(60fps 기준)
          vy: speedY / 60,
          baseAlpha: rand(0.55, 0.95),
          twFreq, twAmp, phase,
          tex: pick(STAR_TEXTURES)
        });
      }
    }
  }

  /** 렌더 루프 */
  let rafId = null;
  let lastTs = 0;
  function frame(ts) {
    // delta time 보정
    const dt = Math.min(33, ts - lastTs || 16.6);
    lastTs = ts;

    // 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 업데이트 & 드로우
    const w = canvas.width, h = canvas.height;

    for (const s of stars) {
      s.x += s.vx * (dt / 16.6);
      s.y += s.vy * (dt / 16.6);

      // 오른쪽으로 지나가면 왼쪽에서 재등장
      if (s.x - s.r > w) {
        s.x = -s.r;
        s.y = rand(0, h);
      }
      // 아래로 벗어나면 위로 살짝 재조정(우하향 느낌 유지)
      if (s.y - s.r > h) {
        s.y = rand(-10 * DPR, 10 * DPR);
      }

      // 반짝임: baseAlpha ± sin 파동
      const t = ts / 1000;
      const alpha = Math.max(
        0.08,
        Math.min(1, s.baseAlpha + Math.sin(t * s.twFreq + s.phase) * s.twAmp)
      );

      ctx.globalAlpha = alpha;
      const tex = s.tex;
      const d = s.r * 2;
      ctx.drawImage(tex, s.x - s.r, s.y - s.r, d, d);
    }

    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(frame);
  }

  /** 텍스처 생성: 부드러운 청백 광 */
  function createStarTextures() {
    const sizes = [6, 10, 14]; // 기본 px (렌더 시 r로 스케일)
    return sizes.map(sz => {
      const S = ('OffscreenCanvas' in window)
        ? new OffscreenCanvas(sz, sz)
        : Object.assign(document.createElement('canvas'), { width: sz, height: sz });

      const g = S.getContext('2d');
      const cx = sz / 2, cy = sz / 2, r = sz / 2;

      // 외곽 글로우(은은한 푸른 기)
      const outer = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      outer.addColorStop(0, 'rgba(180,200,255,0.85)');
      outer.addColorStop(0.55, 'rgba(160,190,255,0.35)');
      outer.addColorStop(1, 'rgba(160,190,255,0)');
      g.fillStyle = outer;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();

      // 중심 코어(화이트)
      const innerR = r * 0.5;
      const inner = g.createRadialGradient(cx, cy, 0, cx, cy, innerR);
      inner.addColorStop(0, 'rgba(255,255,255,1)');
      inner.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = inner;
      g.beginPath(); g.arc(cx, cy, innerR, 0, Math.PI * 2); g.fill();

      return S;
    });
  }

  /** 가시성 관리(백그라운드 탭 절약) */
  function handleVisibility() {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId), rafId = null;
    } else {
      lastTs = 0;
      rafId = requestAnimationFrame(frame);
    }
  }

  /** 초기화 */
  resize();
  resetStars();

  // 모션 줄이기 환경: 프레임 고정(정적 별 배경)
  if (prefersReduced) {
    // 한 번만 그린다
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const d = s.r * 2;
      ctx.globalAlpha = s.baseAlpha;
      ctx.drawImage(s.tex, s.x - s.r, s.y - s.r, d, d);
    }
    ctx.globalAlpha = 1;
  } else {
    rafId = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', handleVisibility);
  }

  // 리사이즈 대응(레티나 포함)
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      resetStars(); // 해상도/크기 따라 재배치
    }, 150);
  });
})();
