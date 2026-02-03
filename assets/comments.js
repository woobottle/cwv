// 🔴 문제: 댓글 스크립트 (페이지 로드 시 즉시 로드되지만 스크롤 해야 보임)

console.log('Comments script loaded');

// 무거운 초기화 작업
(function() {
  'use strict';

  // 댓글 데이터 생성
  function generateComments() {
    const comments = [];
    for (let i = 1; i <= 20; i++) {
      comments.push({
        id: i,
        author: `User ${i}`,
        text: `This is comment number ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString()
      });
    }
    return comments;
  }

  // 댓글 렌더링
  function renderComments() {
    const container = document.getElementById('comments-container');
    if (!container) return;

    // 무거운 작업 시뮬레이션
    let dummy = 0;
    for (let i = 0; i < 500000; i++) {
      dummy += Math.sqrt(i);
    }

    const comments = generateComments();
    let html = '<div class="comments-list">';

    comments.forEach(comment => {
      html += `
        <div class="comment">
          <div class="comment-header">
            <strong>${comment.author}</strong>
            <span class="comment-time">${new Date(comment.timestamp).toLocaleString()}</span>
          </div>
          <div class="comment-body">
            ${comment.text}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comment {
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 5px;
      border-left: 3px solid #667eea;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .comment-time {
      color: #999;
    }

    .comment-body {
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);

  // 페이지 로드 후 즉시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderComments);
  } else {
    renderComments();
  }

})();
