// 🔴
// @see https://web.dev/articles/optimize-long-tasks

// 이미지 데이터 생성
function generateImageData(count) {
  const images = [];
  for (let i = 1; i <= count; i++) {
    images.push({
      id: i,
      url: `https://picsum.photos/400/300?random=${i}`,
      title: `Photo ${i}`,
      description: `Beautiful photo number ${i}`
    });
  }
  return images;
}

// 🔴
// @see https://web.dev/articles/optimize-long-tasks
// @see https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
function processComplexData() {
  console.log('Processing complex data...');
  let result = 0;
  // 약 500ms 걸리는 계산
  for (let i = 0; i < 10000000; i++) {
    result += Math.sqrt(i);
  }
  console.log('Complex data processed:', result);
  return result;
}

// 갤러리 렌더링
function renderGallery(images) {
  const galleryGrid = document.getElementById('gallery-grid');
  galleryGrid.innerHTML = '';

  images.forEach(img => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    item.innerHTML = `
      <img src="${img.url}" alt="${img.title}">
      <div class="gallery-item-overlay">
        <h3>${img.title}</h3>
        <p>${img.description}</p>
      </div>
    `;

    galleryGrid.appendChild(item);
  });
}

// 이미지 필터링
function filterImages(query) {
  const allImages = generateImageData(50);
  if (!query) return allImages;

  return allImages.filter(img =>
    img.title.toLowerCase().includes(query.toLowerCase()) ||
    img.description.toLowerCase().includes(query.toLowerCase())
  );
}

// 이미지 클릭 핸들러
function handleImageClick(event) {
  const title = event.currentTarget.querySelector('h3').textContent;
  alert(`Clicked: ${title}`);
}

// 스크롤 진행률 업데이트
function updateScrollProgress() {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
  console.log('Scroll progress:', progress.toFixed(2) + '%');
}

// 🔴
window.addEventListener('load', () => {
  console.log('Page loaded');

  // 🔴
  processComplexData();

  // 🔴
  const images = generateImageData(50);
  renderGallery(images);

  // 🔴
  // @see https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    item.addEventListener('click', handleImageClick);
  });

  // 🔴
  // @see https://web.dev/articles/optimize-inp
  // @see https://css-tricks.com/debouncing-throttling-explained-examples/
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', (e) => {
    const filtered = filterImages(e.target.value);
    renderGallery(filtered);

    // 검색 후 다시 이벤트 리스너 등록해야 함
    const newItems = document.querySelectorAll('.gallery-item');
    newItems.forEach(item => {
      item.addEventListener('click', handleImageClick);
    });
  });

  // 🔴
  // @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#using_passive_listeners
  window.addEventListener('scroll', () => {
    updateScrollProgress();
    // 추가 작업들...
    checkVisibleImages();
  });
});

// 🔴
// @see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
function checkVisibleImages() {
  const images = document.querySelectorAll('.gallery-item img');

  images.forEach(img => {
    // 🔴 문제: 강제 reflow 발생 (getBoundingClientRect 반복 호출) 이건 어떻게 개선 가능하지?
    const rect = img.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
      img.style.opacity = '1';
    }
  });
}

