#!/usr/bin/env tsx
// CLI runner for Customer Segmentation Engine
// Usage: npm run segment -- --customers 1000 --k 6

import { generateSampleCustomers, segmentCustomers, calculateRFM, findOptimalK } from './lib/segmentation';

const args = process.argv.slice(2);
const customerCount = parseInt(args.find(a => a.startsWith('--customers='))?.split('=')[1] || '500');
const k = parseInt(args.find(a => a.startsWith('--k='))?.split('=')[1] || '6');

console.log(`\n🔍 Customer Segmentation Engine`);
console.log(`   Generating ${customerCount} sample customers...\n`);

const customers = generateSampleCustomers(customerCount);
const segmentation = segmentCustomers(customers, k);
const rfm = calculateRFM(customers);

console.log(`✓ Segmentation complete`);
console.log(`  Silhouette Score: ${segmentation.silhouetteScore.toFixed(4)}`);
console.log(`  Iterations: ${segmentation.iterations} (converged: ${segmentation.converged})`);
console.log(`  Total Customers: ${segmentation.totalCustomers}`);
console.log(`\n📊 Clusters:`);

segmentation.clusters.forEach((cluster, i) => {
  console.log(`\n  ${i + 1}. ${cluster.label} (${cluster.size} customers)`);
  console.log(`     ${cluster.profile}`);
  console.log(`     Avg Recency: ${cluster.avgRecency.toFixed(0)} days`);
  console.log(`     Avg Frequency: ${cluster.avgFrequency.toFixed(1)} orders`);
  console.log(`     Avg Monetary: $${cluster.avgMonetary.toFixed(2)}`);
});

console.log(`\n📋 RFM Segment Distribution:`);
const rfmDist: Record<string, number> = {};
rfm.forEach(r => { rfmDist[r.segment] = (rfmDist[r.segment] || 0) + 1; });
Object.entries(rfmDist).sort((a, b) => b[1] - a[1]).forEach(([seg, count]) => {
  console.log(`  ${seg}: ${count} (${((count / customerCount) * 100).toFixed(1)}%)`);
});

// Find optimal K
console.log(`\n🎯 Optimal K Analysis:`);
const maxR = Math.max(...customers.map(c => c.lastPurchaseDays), 1);
const maxF = Math.max(...customers.map(c => c.purchaseCount), 1);
const maxM = Math.max(...customers.map(c => c.totalSpent), 1);
const points = customers.map(c => [1 - c.lastPurchaseDays / maxR, c.purchaseCount / maxF, c.totalSpent / maxM]);
const optimal = findOptimalK(points, 10);
console.log(`  Optimal K: ${optimal.k}`);
console.log(`  Silhouette by K: ${optimal.silhouettes.map((s, i) => `K=${i + 1}:${s.toFixed(3)}`).join(', ')}`);
console.log();
