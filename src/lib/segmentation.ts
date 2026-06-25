// Customer Segmentation Engine — Core Algorithms
// Real implementations of RFM scoring, K-Means clustering, and silhouette analysis

export interface Customer {
  id: string;
  name: string;
  email: string;
  lastPurchaseDays: number;
  purchaseCount: number;
  totalSpent: number;
  avgOrderValue: number;
  country: string;
  signupDays: number;
}

export interface RFMScores {
  customerId: string;
  r: number;
  f: number;
  m: number;
  segment: string;
}

export interface ClusterResult {
  clusterId: number;
  centroid: number[];
  members: Customer[];
  label: string;
  profile: string;
  size: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
}

export interface SegmentationResult {
  clusters: ClusterResult[];
  silhouetteScore: number;
  iterations: number;
  converged: boolean;
  totalCustomers: number;
}

export function calculateRFM(customers: Customer[]): RFMScores[] {
  const sortedByRecency = [...customers].sort((a, b) => a.lastPurchaseDays - b.lastPurchaseDays);
  const sortedByFrequency = [...customers].sort((a, b) => a.purchaseCount - b.purchaseCount);
  const sortedByMonetary = [...customers].sort((a, b) => a.totalSpent - b.totalSpent);
  const n = customers.length;
  const getQuintile = (sorted: Customer[], customer: Customer): number => {
    const idx = sorted.findIndex(c => c.id === customer.id);
    return Math.min(5, Math.max(1, Math.floor((idx / n) * 5) + 1));
  };
  return customers.map(customer => {
    const r = getQuintile(sortedByRecency, customer);
    const f = getQuintile(sortedByFrequency, customer);
    const m = getQuintile(sortedByMonetary, customer);
    const segment = getRFMSegment(r, f, m);
    return { customerId: customer.id, r, f, m, segment };
  });
}

function getRFMSegment(r: number, f: number, m: number): string {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 4 && f >= 3 && m >= 3) return 'Loyal Customers';
  if (r >= 4 && f <= 2) return 'Recent Customers';
  if (r >= 3 && f >= 3 && m >= 3) return 'Potential Loyalists';
  if (r <= 2 && f >= 4 && m >= 4) return 'At Risk (High Value)';
  if (r <= 2 && f >= 3) return 'At Risk';
  if (r <= 2 && f <= 2 && m >= 3) return "Can't Lose Them";
  if (r >= 3 && f <= 2 && m <= 2) return 'Promising';
  if (r <= 2 && f <= 2 && m <= 2) return 'Hibernating';
  return 'Needs Attention';
}

export function kMeans(
  points: number[][],
  k: number,
  maxIter: number = 100,
): { centroids: number[][]; assignments: number[]; iterations: number; converged: boolean } {
  const n = points.length;
  if (n === 0 || k < 1) return { centroids: [], assignments: [], iterations: 0, converged: false };
  k = Math.min(k, n);
  const centroids: number[][] = [];
  centroids.push([...points[Math.floor(Math.random() * n)]]);
  for (let c = 1; c < k; c++) {
    const distances = points.map(p => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const d = euclideanSquared(p, centroid);
        if (d < minDist) minDist = d;
      }
      return minDist;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    if (totalDist === 0) { centroids.push([...points[Math.floor(Math.random() * n)]]); continue; }
    const r = Math.random() * totalDist;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      acc += distances[i];
      if (acc >= r) { centroids.push([...points[i]]); break; }
    }
  }
  let assignments = new Array(n).fill(0);
  let iter = 0;
  let converged = false;
  for (; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0; let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const d = euclideanSquared(points[i], centroids[c]);
        if (d < bestDist) { bestDist = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    if (!changed && iter > 0) { converged = true; break; }
    const sums = Array.from({ length: k }, () => new Array(points[0].length).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      counts[assignments[i]]++;
      for (let j = 0; j < points[i].length; j++) sums[assignments[i]][j] += points[i][j];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) centroids[c] = sums[c].map(s => s / counts[c]);
    }
  }
  return { centroids, assignments, iterations: iter, converged };
}

function euclideanSquared(a: number[], b: number[]): number {
  return a.reduce((acc, _, i) => acc + (a[i] - b[i]) ** 2, 0);
}

export function silhouetteScore(points: number[][], assignments: number[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const k = Math.max(...assignments) + 1;
  if (k < 2) return 0;
  let totalSilhouette = 0;
  for (let i = 0; i < n; i++) {
    const cluster = assignments[i];
    let a = 0; let aCount = 0;
    const bDists: Record<number, { sum: number; count: number }> = {};
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = Math.sqrt(euclideanSquared(points[i], points[j]));
      if (assignments[j] === cluster) { a += d; aCount++; }
      else {
        if (!bDists[assignments[j]]) bDists[assignments[j]] = { sum: 0, count: 0 };
        bDists[assignments[j]].sum += d;
        bDists[assignments[j]].count++;
      }
    }
    a = aCount > 0 ? a / aCount : 0;
    const bValues = Object.values(bDists).map(v => v.sum / v.count);
    const b = bValues.length > 0 ? Math.min(...bValues) : 0;
    const s = (a + b) === 0 ? 0 : (b - a) / Math.max(a, b);
    totalSilhouette += s;
  }
  return totalSilhouette / n;
}

export function findOptimalK(points: number[][], maxK: number = 10): { k: number; inertias: number[]; silhouettes: number[] } {
  const inertias: number[] = [];
  const silhouettes: number[] = [];
  for (let k = 1; k <= Math.min(maxK, points.length); k++) {
    const { centroids, assignments } = kMeans(points, k, 50);
    let inertia = 0;
    for (let i = 0; i < points.length; i++) inertia += euclideanSquared(points[i], centroids[assignments[i]]);
    inertias.push(inertia);
    silhouettes.push(k >= 2 ? silhouetteScore(points, assignments) : 0);
  }
  let bestK = 2; let maxDrop = 0;
  for (let i = 1; i < inertias.length - 1; i++) {
    const drop = inertias[i - 1] - inertias[i];
    if (drop > maxDrop) { maxDrop = drop; bestK = i + 1; }
  }
  const maxSilhouetteIdx = silhouettes.indexOf(Math.max(...silhouettes.slice(1))) + 1;
  if (silhouettes[maxSilhouetteIdx] > 0.35) bestK = maxSilhouetteIdx + 1;
  return { k: bestK, inertias, silhouettes };
}

export function segmentCustomers(customers: Customer[], k: number = 6): SegmentationResult {
  const maxR = Math.max(...customers.map(c => c.lastPurchaseDays), 1);
  const maxF = Math.max(...customers.map(c => c.purchaseCount), 1);
  const maxM = Math.max(...customers.map(c => c.totalSpent), 1);
  const points = customers.map(c => [
    1 - (c.lastPurchaseDays / maxR),
    c.purchaseCount / maxF,
    c.totalSpent / maxM,
  ]);
  const { centroids, assignments, iterations, converged } = kMeans(points, k, 100);
  const score = silhouetteScore(points, assignments);
  const clusters: ClusterResult[] = [];
  for (let c = 0; c < k; c++) {
    const members = customers.filter((_, i) => assignments[i] === c);
    if (members.length === 0) continue;
    const avgRecency = members.reduce((a, m) => a + m.lastPurchaseDays, 0) / members.length;
    const avgFrequency = members.reduce((a, m) => a + m.purchaseCount, 0) / members.length;
    const avgMonetary = members.reduce((a, m) => a + m.totalSpent, 0) / members.length;
    const label = getClusterLabel(avgRecency, avgFrequency, avgMonetary);
    const profile = generateProfile(avgRecency, avgFrequency, avgMonetary, members.length);
    clusters.push({ clusterId: c, centroid: centroids[c], members, label, profile, size: members.length, avgRecency, avgFrequency, avgMonetary });
  }
  clusters.sort((a, b) => b.avgMonetary - a.avgMonetary);
  return { clusters, silhouetteScore: score, iterations, converged, totalCustomers: customers.length };
}

function getClusterLabel(avgR: number, avgF: number, avgM: number): string {
  if (avgR < 30 && avgF > 10 && avgM > 1000) return 'Champions';
  if (avgR < 60 && avgF > 5 && avgM > 500) return 'Loyal Customers';
  if (avgR < 30 && avgF <= 3) return 'New Customers';
  if (avgR > 90 && avgF > 5 && avgM > 500) return 'At Risk (High Value)';
  if (avgR > 120 && avgF <= 3) return 'Hibernating';
  if (avgR > 60 && avgF > 3 && avgM > 300) return 'Potential Loyalists';
  return 'General';
}

function generateProfile(avgR: number, avgF: number, avgM: number, size: number): string {
  const recency = avgR < 30 ? 'recent' : avgR < 90 ? 'moderate' : 'lapsed';
  const freq = avgF > 10 ? 'high-frequency' : avgF > 3 ? 'regular' : 'low-frequency';
  const spend = avgM > 1000 ? 'high-value' : avgM > 300 ? 'mid-value' : 'low-value';
  return `${size} customers — ${recency}, ${freq}, ${spend}. Avg ${avgF.toFixed(1)} orders, $${avgM.toFixed(0)} total spend, last active ${avgR.toFixed(0)} days ago.`;
}

export function generateSampleCustomers(count: number = 500): Customer[] {
  const countries = ['Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Tanzania', 'Uganda', 'Rwanda'];
  const customers: Customer[] = [];
  for (let i = 0; i < count; i++) {
    const segment = Math.random();
    let lastPurchaseDays: number, purchaseCount: number, totalSpent: number;
    if (segment < 0.15) {
      lastPurchaseDays = Math.floor(Math.random() * 20);
      purchaseCount = 15 + Math.floor(Math.random() * 30);
      totalSpent = 1500 + Math.random() * 5000;
    } else if (segment < 0.35) {
      lastPurchaseDays = 20 + Math.floor(Math.random() * 40);
      purchaseCount = 6 + Math.floor(Math.random() * 15);
      totalSpent = 500 + Math.random() * 1500;
    } else if (segment < 0.50) {
      lastPurchaseDays = Math.floor(Math.random() * 25);
      purchaseCount = 1 + Math.floor(Math.random() * 3);
      totalSpent = 50 + Math.random() * 300;
    } else if (segment < 0.65) {
      lastPurchaseDays = 90 + Math.floor(Math.random() * 60);
      purchaseCount = 8 + Math.floor(Math.random() * 12);
      totalSpent = 600 + Math.random() * 2000;
    } else if (segment < 0.80) {
      lastPurchaseDays = 120 + Math.floor(Math.random() * 120);
      purchaseCount = 1 + Math.floor(Math.random() * 3);
      totalSpent = 50 + Math.random() * 200;
    } else {
      lastPurchaseDays = 30 + Math.floor(Math.random() * 60);
      purchaseCount = 3 + Math.floor(Math.random() * 7);
      totalSpent = 200 + Math.random() * 600;
    }
    customers.push({
      id: `cust_${String(i + 1).padStart(4, '0')}`,
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      lastPurchaseDays, purchaseCount,
      totalSpent: Number(totalSpent.toFixed(2)),
      avgOrderValue: Number((totalSpent / purchaseCount).toFixed(2)),
      country: countries[Math.floor(Math.random() * countries.length)],
      signupDays: lastPurchaseDays + Math.floor(Math.random() * 365),
    });
  }
  return customers;
}
