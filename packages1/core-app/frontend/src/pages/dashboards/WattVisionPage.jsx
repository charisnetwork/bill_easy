import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Activity, TrendingUp, PlugZap, PowerOff, Info } from 'lucide-react';

const data = [
  { time: '00:00', watts: 150 },
  { time: '02:00', watts: 140 },
  { time: '04:00', watts: 150 },
  { time: '06:00', watts: 200 },
  { time: '08:00', watts: 800 },
  { time: '10:00', watts: 1200 },
  { time: '12:00', watts: 1100 },
  { time: '14:00', watts: 3100 },
  { time: '16:00', watts: 1800 },
  { time: '18:00', watts: 1500 },
  { time: '20:00', watts: 2200 },
  { time: '22:00', watts: 1400 },
  { time: '23:59', watts: 300 },
];

const WattVisionPage = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 rounded-xl bg-[#121212] text-[#FFFFFF]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Google Fonts injected for JetBrains Mono */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@600;700&display=swap');
        .font-jetbrains { font-family: 'JetBrains Mono', monospace; }
        .kpi-card { transition: transform 0.2s, border-color 0.2s; }
        .kpi-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.1); }
      `}</style>

      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-[#00E5FF]" />
          <h1 className="text-2xl font-semibold tracking-tight">WattVision</h1>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#32D74B] bg-[#32D74B]/10 px-4 py-2 rounded-full border border-[#32D74B]/20">
          <span className="w-2 h-2 bg-[#32D74B] rounded-full animate-pulse"></span>
          En vivo
        </div>
      </header>

      {/* Grid Layout */}
      <main className="grid grid-cols-12 gap-6">
        
        {/* KPI 1 */}
        <div className="kpi-card col-span-12 md:col-span-4 bg-[#1E1E1E] p-6 rounded-2xl border border-[#2C2C2E] shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#98989D] uppercase tracking-wide">Consumo Actual</h3>
            <Activity className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div className="flex items-baseline gap-2 font-jetbrains">
            <span className="text-4xl font-bold text-white">1,245</span>
            <span className="text-lg font-semibold text-[#98989D]">W</span>
          </div>
          <p className="text-xs text-[#32D74B] font-medium">Normal - Promedio doméstico</p>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card col-span-12 md:col-span-4 bg-[#1E1E1E] p-6 rounded-2xl border border-[#2C2C2E] shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#98989D] uppercase tracking-wide">Energía Hoy</h3>
            <Zap className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div className="flex items-baseline gap-2 font-jetbrains">
            <span className="text-4xl font-bold text-white">8.4</span>
            <span className="text-lg font-semibold text-[#98989D]">kWh</span>
          </div>
          <p className="text-xs text-[#98989D]">Equivalente a <span className="font-bold text-white">Bs. 6.30</span></p>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card col-span-12 md:col-span-4 bg-[#1E1E1E] p-6 rounded-2xl border border-[#2C2C2E] shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-[#98989D] uppercase tracking-wide">Pico Máximo (Hoy)</h3>
            <TrendingUp className="w-5 h-5 text-[#FF453A]" />
          </div>
          <div className="flex items-baseline gap-2 font-jetbrains">
            <span className="text-4xl font-bold text-white">3,100</span>
            <span className="text-lg font-semibold text-[#98989D]">W</span>
          </div>
          <p className="text-xs text-[#98989D]">14:30 - Horno Eléctrico</p>
        </div>

        {/* Main Chart */}
        <div className="col-span-12 lg:col-span-8 bg-[#1E1E1E] p-6 rounded-2xl border border-[#2C2C2E] shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Perfil de Consumo (Últimas 24h)</h2>
            <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-[#2C2C2E]">
              <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#1E1E1E] text-white shadow-sm">Día</button>
              <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-[#98989D] hover:text-white transition-colors">Semana</button>
              <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-[#98989D] hover:text-white transition-colors">Mes</button>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWatts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#32D74B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2C2C2E" />
                <XAxis 
                  dataKey="time" 
                  stroke="#98989D" 
                  tick={{ fill: '#98989D', fontSize: 12, fontFamily: "'Inter', sans-serif" }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#98989D" 
                  tick={{ fill: '#98989D', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val} W`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2C2C2E', borderRadius: '8px' }}
                  itemStyle={{ color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold' }}
                  labelStyle={{ color: '#98989D', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="watts" 
                  stroke="#00E5FF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWatts)" 
                  activeDot={{ r: 6, fill: '#1E1E1E', stroke: '#00E5FF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-[#2C2C2E] shadow-lg flex-1">
            <h2 className="text-lg font-semibold text-white mb-6">Alertas Recientes</h2>
            <div className="flex flex-col gap-4">
              
              <div className="flex gap-4 p-4 rounded-xl bg-black/20 border border-red-500/30 border-l-4 border-l-[#FF453A] bg-[#3A1C1C]">
                <PlugZap className="w-6 h-6 text-[#FF453A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Pico Inusual Detectado</h4>
                  <p className="text-xs text-white/70 mb-2 leading-relaxed">Consumo superó 3,000 W a las 14:30. Revise equipos pesados.</p>
                  <span className="text-[11px] font-semibold text-[#98989D]">Hace 2 horas</span>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-black/20 border border-[#2C2C2E] border-l-4 border-l-[#FF9F0A]">
                <PowerOff className="w-6 h-6 text-[#FF9F0A] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Posible Consumo Vampiro</h4>
                  <p className="text-xs text-white/70 mb-2 leading-relaxed">Consumo base nocturno de 150 W es superior al promedio.</p>
                  <span className="text-[11px] font-semibold text-[#98989D]">Hace 8 horas</span>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-black/20 border border-[#2C2C2E] border-l-4 border-l-[#00E5FF]">
                <Info className="w-6 h-6 text-[#00E5FF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Corte de Energía</h4>
                  <p className="text-xs text-white/70 mb-2 leading-relaxed">Micro-corte detectado en la red principal (2 segundos).</p>
                  <span className="text-[11px] font-semibold text-[#98989D]">Ayer, 21:00</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Devices Table */}
        <div className="col-span-12 bg-[#1E1E1E] p-6 rounded-2xl border border-[#2C2C2E] shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-6">Análisis de Dispositivos (Estimado)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-5 text-xs font-semibold text-[#98989D] uppercase tracking-wide border-b border-[#2C2C2E]">Dispositivo</th>
                  <th className="py-4 px-5 text-xs font-semibold text-[#98989D] uppercase tracking-wide border-b border-[#2C2C2E]">Estado</th>
                  <th className="py-4 px-5 text-xs font-semibold text-[#98989D] uppercase tracking-wide border-b border-[#2C2C2E]">Consumo Promedio</th>
                  <th className="py-4 px-5 text-xs font-semibold text-[#98989D] uppercase tracking-wide border-b border-[#2C2C2E]">Energía (Hoy)</th>
                  <th className="py-4 px-5 text-xs font-semibold text-[#98989D] uppercase tracking-wide border-b border-[#2C2C2E]">Costo Estimado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[#252525] transition-colors border-b border-[#2C2C2E]">
                  <td className="py-4 px-5 text-sm text-white">Refrigerador</td>
                  <td className="py-4 px-5"><span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#32D74B]/15 text-[#32D74B] border border-[#32D74B]/30">Activo</span></td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">250 W</td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">3.2 kWh</td>
                  <td className="py-4 px-5 text-sm text-white font-bold font-jetbrains">Bs. 2.40</td>
                </tr>
                <tr className="hover:bg-[#252525] transition-colors border-b border-[#2C2C2E]">
                  <td className="py-4 px-5 text-sm text-white">Horno Eléctrico</td>
                  <td className="py-4 px-5"><span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#98989D]/10 text-[#98989D] border border-[#98989D]/20">Inactivo</span></td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">2,000 W</td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">1.5 kWh</td>
                  <td className="py-4 px-5 text-sm text-white font-bold font-jetbrains">Bs. 1.12</td>
                </tr>
                <tr className="hover:bg-[#252525] transition-colors border-b border-[#2C2C2E]">
                  <td className="py-4 px-5 text-sm text-white">Iluminación (Total)</td>
                  <td className="py-4 px-5"><span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#32D74B]/15 text-[#32D74B] border border-[#32D74B]/30">Activo</span></td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">120 W</td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">0.8 kWh</td>
                  <td className="py-4 px-5 text-sm text-white font-bold font-jetbrains">Bs. 0.60</td>
                </tr>
                <tr className="hover:bg-[#252525] transition-colors">
                  <td className="py-4 px-5 text-sm text-white">TV / Entretenimiento</td>
                  <td className="py-4 px-5"><span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#98989D]/10 text-[#98989D] border border-[#98989D]/20">Inactivo</span></td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">150 W</td>
                  <td className="py-4 px-5 text-sm text-white/90 font-jetbrains">0.6 kWh</td>
                  <td className="py-4 px-5 text-sm text-white font-bold font-jetbrains">Bs. 0.45</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default WattVisionPage;
