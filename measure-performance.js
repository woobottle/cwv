#!/usr/bin/env node

/**
 * 웹 성능 자동 측정 스크립트
 *
 * 사용법:
 *   npm run measure          # 현재 성능 측정
 *   npm run measure:compare  # before.json과 비교
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const CONFIG = {
  url: 'http://localhost:56639',
  resultsDir: path.join(__dirname, 'lighthouse-results'),
  runs: 3, // 3회 측정 후 중간값 사용
  thresholds: {
    performance: 90,
    lcp: 2500,  // ms
    fcp: 1800,  // ms
    cls: 0.1,
    tbt: 200,   // ms
  }
};

// 결과 저장 디렉토리 생성
if (!fs.existsSync(CONFIG.resultsDir)) {
  fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
}

// Lighthouse 실행
async function runLighthouse(url, opts = {}) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
    ...opts
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  return runnerResult;
}

// 여러 번 실행해서 중간값 추출
async function runMultipleTimes(url, runs = CONFIG.runs) {
  console.log(`🔄 ${runs}회 측정 시작...\n`);

  const results = [];

  for (let i = 0; i < runs; i++) {
    console.log(`   실행 ${i + 1}/${runs}...`);
    const result = await runLighthouse(url);
    results.push(extractMetrics(result.lhr));

    // 측정 사이에 약간의 대기 시간
    if (i < runs - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('✅ 측정 완료\n');
  return results;
}

// 주요 지표 추출
function extractMetrics(lhr) {
  const audits = lhr.audits;

  return {
    timestamp: new Date().toISOString(),
    scores: {
      performance: Math.round(lhr.categories.performance.score * 100),
    },
    metrics: {
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      tbt: audits['total-blocking-time']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      tti: audits['interactive']?.numericValue || 0,
    }
  };
}

// 중간값 계산
function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// 여러 측정 결과에서 중간값 추출
function calculateMedianMetrics(results) {
  const metrics = {
    performance: getMedian(results.map(r => r.scores.performance)),
    fcp: getMedian(results.map(r => r.metrics.fcp)),
    lcp: getMedian(results.map(r => r.metrics.lcp)),
    tbt: getMedian(results.map(r => r.metrics.tbt)),
    cls: getMedian(results.map(r => r.metrics.cls)),
    speedIndex: getMedian(results.map(r => r.metrics.speedIndex)),
    tti: getMedian(results.map(r => r.metrics.tti)),
  };

  return metrics;
}

// 결과 출력
function printResults(metrics, comparison = null) {
  console.log('📊 성능 측정 결과 (중간값)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const perfStatus = metrics.performance >= CONFIG.thresholds.performance ? '✅' : '❌';
  console.log(`  Performance Score: ${perfStatus} ${metrics.performance}/100`);

  if (comparison) {
    const diff = metrics.performance - comparison.performance;
    const diffStr = diff > 0 ? `+${diff}` : diff;
    console.log(`    (${diffStr > 0 ? '📈' : '📉'} ${diffStr})`);
  }

  console.log('');
  console.log('  Core Web Vitals:');

  // LCP
  const lcpStatus = metrics.lcp < CONFIG.thresholds.lcp ? '✅' : '❌';
  const lcpSec = (metrics.lcp / 1000).toFixed(2);
  console.log(`    LCP: ${lcpStatus} ${lcpSec}s (목표: < 2.5s)`);
  if (comparison) {
    const diff = ((metrics.lcp - comparison.lcp) / 1000).toFixed(2);
    console.log(`        (${diff > 0 ? '⬆️' : '⬇️'} ${diff}s)`);
  }

  // FCP
  const fcpStatus = metrics.fcp < CONFIG.thresholds.fcp ? '✅' : '❌';
  const fcpSec = (metrics.fcp / 1000).toFixed(2);
  console.log(`    FCP: ${fcpStatus} ${fcpSec}s (목표: < 1.8s)`);
  if (comparison) {
    const diff = ((metrics.fcp - comparison.fcp) / 1000).toFixed(2);
    console.log(`        (${diff > 0 ? '⬆️' : '⬇️'} ${diff}s)`);
  }

  // CLS
  const clsStatus = metrics.cls < CONFIG.thresholds.cls ? '✅' : '❌';
  console.log(`    CLS: ${clsStatus} ${metrics.cls.toFixed(3)} (목표: < 0.1)`);
  if (comparison) {
    const diff = (metrics.cls - comparison.cls).toFixed(3);
    console.log(`        (${diff > 0 ? '⬆️' : '⬇️'} ${diff})`);
  }

  console.log('');
  console.log('  기타 지표:');
  console.log(`    Speed Index: ${(metrics.speedIndex / 1000).toFixed(2)}s`);
  console.log(`    TTI: ${(metrics.tti / 1000).toFixed(2)}s`);

  const tbtStatus = metrics.tbt < CONFIG.thresholds.tbt ? '✅' : '❌';
  console.log(`    TBT: ${tbtStatus} ${Math.round(metrics.tbt)}ms (목표: < 200ms)`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 개선율 계산 및 출력
function printImprovement(before, after) {
  console.log('📈 개선 현황\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const perfImprovement = ((after.performance - before.performance) / before.performance * 100).toFixed(1);
  console.log(`  Performance: ${before.performance} → ${after.performance} (${perfImprovement > 0 ? '+' : ''}${perfImprovement}%)`);

  const lcpImprovement = ((before.lcp - after.lcp) / before.lcp * 100).toFixed(1);
  console.log(`  LCP: ${(before.lcp/1000).toFixed(2)}s → ${(after.lcp/1000).toFixed(2)}s (${lcpImprovement > 0 ? '↓' : '↑'}${Math.abs(lcpImprovement)}%)`);

  const fcpImprovement = ((before.fcp - after.fcp) / before.fcp * 100).toFixed(1);
  console.log(`  FCP: ${(before.fcp/1000).toFixed(2)}s → ${(after.fcp/1000).toFixed(2)}s (${fcpImprovement > 0 ? '↓' : '↑'}${Math.abs(fcpImprovement)}%)`);

  const clsImprovement = ((before.cls - after.cls) / before.cls * 100).toFixed(1);
  console.log(`  CLS: ${before.cls.toFixed(3)} → ${after.cls.toFixed(3)} (${clsImprovement > 0 ? '↓' : '↑'}${Math.abs(clsImprovement)}%)`);

  const tbtImprovement = ((before.tbt - after.tbt) / before.tbt * 100).toFixed(1);
  console.log(`  TBT: ${Math.round(before.tbt)}ms → ${Math.round(after.tbt)}ms (${tbtImprovement > 0 ? '↓' : '↑'}${Math.abs(tbtImprovement)}%)`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 목표 달성 체크
function checkGoals(metrics) {
  console.log('🎯 목표 달성 체크\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const goals = [
    { name: 'Performance ≥ 90', achieved: metrics.performance >= CONFIG.thresholds.performance },
    { name: 'LCP < 2.5s', achieved: metrics.lcp < CONFIG.thresholds.lcp },
    { name: 'FCP < 1.8s', achieved: metrics.fcp < CONFIG.thresholds.fcp },
    { name: 'CLS < 0.1', achieved: metrics.cls < CONFIG.thresholds.cls },
    { name: 'TBT < 200ms', achieved: metrics.tbt < CONFIG.thresholds.tbt },
  ];

  goals.forEach(goal => {
    console.log(`  ${goal.achieved ? '✅' : '❌'} ${goal.name}`);
  });

  const achievedCount = goals.filter(g => g.achieved).length;
  const totalCount = goals.length;

  console.log('');
  console.log(`  달성률: ${achievedCount}/${totalCount} (${Math.round(achievedCount/totalCount*100)}%)`);

  if (achievedCount === totalCount) {
    console.log('\n  🎉 축하합니다! 모든 목표를 달성했습니다!');
  } else {
    console.log(`\n  💪 ${totalCount - achievedCount}개 항목 개선이 필요합니다.`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 메인 실행
async function main() {
  const mode = process.argv[2] || 'measure';

  console.log('🚀 웹 성능 자동 측정 도구\n');

  // 서버 실행 여부 체크
  try {
    const response = await fetch(CONFIG.url);
    if (!response.ok) throw new Error('Server not responding');
  } catch (error) {
    console.error('❌ 오류: 로컬 서버가 실행되지 않았습니다.');
    console.error('   먼저 `npm run dev`로 서버를 시작하세요.\n');
    process.exit(1);
  }

  // 측정 실행
  const results = await runMultipleTimes(CONFIG.url);
  const metrics = calculateMedianMetrics(results);

  // 결과 저장
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `result-${timestamp}.json`;
  const filepath = path.join(CONFIG.resultsDir, filename);

  fs.writeFileSync(
    filepath,
    JSON.stringify({ metrics, allResults: results }, null, 2)
  );

  console.log(`💾 결과 저장: ${filename}\n`);

  // 모드별 처리
  if (mode === 'compare') {
    const beforePath = path.join(CONFIG.resultsDir, 'before.json');

    if (!fs.existsSync(beforePath)) {
      console.log('⚠️  before.json이 없습니다. 먼저 개선 전 측정을 저장하세요:');
      console.log('   npm run measure:before\n');

      printResults(metrics);
      checkGoals(metrics);
    } else {
      const beforeData = JSON.parse(fs.readFileSync(beforePath, 'utf8'));

      console.log('📊 개선 전 (Before)\n');
      printResults(beforeData.metrics);

      console.log('\n📊 개선 후 (After)\n');
      printResults(metrics, beforeData.metrics);

      printImprovement(beforeData.metrics, metrics);
      checkGoals(metrics);
    }
  } else if (mode === 'before') {
    const beforePath = path.join(CONFIG.resultsDir, 'before.json');
    fs.writeFileSync(
      beforePath,
      JSON.stringify({ metrics, allResults: results }, null, 2)
    );

    console.log('✅ 개선 전 기준선(baseline) 저장 완료\n');
    printResults(metrics);
    console.log('💡 이제 코드를 개선한 후 `npm run measure:compare`로 비교하세요.\n');
  } else {
    printResults(metrics);
    checkGoals(metrics);
  }
}

// 실행
main().catch(error => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});
