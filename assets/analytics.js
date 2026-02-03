
console.log('Analytics script loaded');

(function() {
  'use strict';

  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += Math.random();
  }

  // 가짜 분석 데이터 수집
  window.Analytics = {
    pageView: function() {
      console.log('Page view tracked');
    },

    event: function(category, action, label) {
      console.log(`Event tracked: ${category} - ${action} - ${label}`);
    },

    timing: function(category, variable, time) {
      console.log(`Timing: ${category} - ${variable} - ${time}ms`);
    }
  };

  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.Analytics.pageView();
    });
  } else {
    window.Analytics.pageView();
  }

  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      window.Analytics.event('Navigation', 'Click', e.target.href);
    }
  });

})();
