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

