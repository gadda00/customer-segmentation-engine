'use client';

import { useState, useMemo } from 'react';
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell,
} from 'recharts';
import {
  generateSampleCustomers, segmentCustomers, calculateRFM,
  findOptimalK, Customer, ClusterResult,
} from '@/lib/segmentation';

const CLUSTER_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#0ea5e9', '#ec4899', '#14b8a6', '#ef4444', '#a855f7'];

export default function Home() {
  const [customerCount, setCustomerCount] = useState(500);
  const [kValue, setKValue] = useState(6);

  const customers = useMemo(() => generateSampleCustomers(customerCount), [customerCount]);
  const segmentation = useMemo(() => segmentCustomers(customers, kValue), [customers, kValue]);
  const rfmScores = useMemo(() => calculateRFM(customers), [customers]);
  const optimalK = useMemo(() => {
    const maxR = Math.max(...customers.map(c => c.lastPurchaseDays), 1);
    const maxF = Math.max(...customers.map(c => c.purchaseCount), 1);
    const maxM = Math.max(...customers.map(c => c.totalSpent), 1);
    const points = customers.map(c => [1 - c.lastPurchaseDays / maxR, c.purchaseCount / maxF, c.totalSpent / maxM]);
    return findOptimalK(points, 10);
  }, [customers]);

  // Prepare scatter data (Frequency vs Monetary, bubble size = Recency)
  const scatterData = segmentation.clusters.map((cluster: ClusterResult) => ({
    name: cluster.label,
    data: cluster.members.map(m => ({
      x: m.purchaseCount,
      y: m.totalSpent,
      z: m.lastPurchaseDays,
      name: m.name,
      country: m.country,
    })),
  }));

  // RFM segment distribution
  const rfmDistribution = Object.entries(
    rfmScores.reduce((acc, r) => {
      acc[r.segment] = (acc[r.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Elbow chart data
  const elbowData = optimalK.inertias.map((inertia, i) => ({
    k: i + 1,
    inertia: Math.round(inertia),
    silhouette: Number(optimalK.silhouettes[i].toFixed(3)),
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">Customer Segmentation Engine</h1>
          <p className="text-slate-400">RFM analysis + K-Means clustering with silhouette optimization</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Customers" value={customerCount.toLocaleString()} color="text-emerald-400" />
          <StatCard icon={Target} label="Clusters" value={segmentation.clusters.length} color="text-purple-400" />
          <StatCard icon={TrendingUp} label="Silhouette Score" value={segmentation.silhouetteScore.toFixed(3)} color="text-amber-400" />
          <StatCard icon={DollarSign} label="Total Revenue" value={`$${customers.reduce((a, c) => a + c.totalSpent, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="text-sky-400" />
        </div>

        {/* Controls */}
        <div className="bg-slate-900 rounded-xl p-4 mb-8 border border-slate-800 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Customers:</label>
            <input type="range" min="100" max="2000" step="100" value={customerCount} onChange={e => setCustomerCount(Number(e.target.value))} className="w-32 accent-emerald-500" />
            <span className="text-sm font-mono text-emerald-400 w-12">{customerCount}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">K (clusters):</label>
            <input type="range" min="2" max="8" value={kValue} onChange={e => setKValue(Number(e.target.value))} className="w-24 accent-purple-500" />
            <span className="text-sm font-mono text-purple-400 w-6">{kValue}</span>
          </div>
          <div className="text-sm text-slate-400">
            Optimal K: <span className="text-emerald-400 font-bold">{optimalK.k}</span> (elbow method)
          </div>
          <div className="text-sm text-slate-400">
            Converged: <span className={segmentation.converged ? 'text-emerald-400' : 'text-amber-400'}>{segmentation.converged ? 'Yes' : 'No'}</span> in {segmentation.iterations} iterations
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="bg-slate-900 rounded-xl p-6 mb-8 border border-slate-800">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Customer Segments — Frequency vs Monetary</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" dataKey="x" name="Frequency" unit=" orders" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Monetary" unit="$" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" name="Recency" unit=" days" range={[20, 200]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: 12 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
                      <div className="font-bold text-slate-200">{d.name}</div>
                      <div className="text-slate-400">Frequency: {d.x} orders</div>
                      <div className="text-slate-400">Monetary: ${d.y.toFixed(2)}</div>
                      <div className="text-slate-400">Recency: {d.z} days</div>
                      <div className="text-slate-400">Country: {d.country}</div>
                    </div>
                  );
                }}
              />
              <Legend />
              {scatterData.map((cluster, i) => (
                <Scatter key={i} name={cluster.name} data={cluster.data} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} fillOpacity={0.6} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Cluster Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {segmentation.clusters.map((cluster: ClusterResult, i: number) => (
            <div key={cluster.clusterId} className="bg-slate-900 rounded-xl p-5 border border-slate-800" style={{ borderLeftColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length], borderLeftWidth: 3 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-100">{cluster.label}</h3>
                <span className="text-2xl font-bold" style={{ color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>{cluster.size}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{cluster.profile}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Recency</div>
                  <div className="text-sm font-mono text-slate-300">{cluster.avgRecency.toFixed(0)}d</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Frequency</div>
                  <div className="text-sm font-mono text-slate-300">{cluster.avgFrequency.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Monetary</div>
                  <div className="text-sm font-mono text-slate-300">${cluster.avgMonetary.toFixed(0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RFM Distribution + Elbow Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">RFM Segment Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rfmDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {rfmDistribution.map((_, i) => (
                    <Cell key={i} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Elbow Method — Optimal K Selection</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="k" name="K" tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[1, 10]} />
                <YAxis type="number" dataKey="inertia" name="Inertia" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: 12 }} />
                <Scatter data={elbowData} fill="#10b981" fillOpacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-600 py-6">
          Customer Segmentation Engine · Victor Ndunda · Built with Next.js + Recharts
        </footer>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
      <Icon className={`h-5 w-5 mb-2 ${color}`} />
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
