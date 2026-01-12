"use client"; 

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Settings, X, Leaf, Moon, Sun, Sunrise, CloudUpload, Eye
} from 'lucide-react';

// 环境变量需在 Zeabur/Vercel 中配置：
// NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

const LIFESTYLE_MODIFIERS = {
  default: { label: '普通人类', years: 0 },
  programmer: { label: '开发者', years: -3 },
  designer: { label: '设计师', years: -2 },
  founder: { label: '创业者', years: -4 },
  retired: { label: '悠闲生活', years: 5 },
  athlete: { label: '运动达人', years: 4 },
};

const BASE_LIFESPAN = { male: 76, female: 81 };

export default function App() {
  const [activeTab, setActiveTab] = useState('safety'); 
  const [userData, setUserData] = useState(null);
  const [safetyConfig, setSafetyConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [timeGreeting, setTimeGreeting] = useState({ text: '你好', icon: 'Sun' });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 1. 初始化本地缓存数据
    const lifeData = localStorage.getItem('life_data_v2');
    const safeData = localStorage.getItem('safe_config_v2');
    const savedLogs = localStorage.getItem('alive_logs_v2');
    
    if (lifeData) setUserData(JSON.parse(lifeData));
    if (safeData) setSafetyConfig(JSON.parse(safeData));
    if (savedLogs) setLogs(JSON.parse(savedLogs));

    // 2. 动态问候语逻辑
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 10) setTimeGreeting({ text: '早安，新的一天', icon: 'Sunrise' });
      else if (hour >= 10 && hour < 17) setTimeGreeting({ text: '你好，午后时光', icon: 'Sun' });
      else if (hour >= 17 && hour < 22) setTimeGreeting({ text: '傍晚好，辛苦了', icon: 'Sun' });
      else setTimeGreeting({ text: '夜深了，注意休息', icon: 'Moon' });
    };
    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 核心同步逻辑 ---
  const syncHeartbeat = async (mood) => {
    if (!safetyConfig) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: safetyConfig.userId || 'default_user', 
          mood 
        }),
      });
      if (!res.ok) throw new Error('Sync failed');
    } catch (err) {
      console.error("Heartbeat sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSafetyConfig = async (config) => {
    const userId = safetyConfig?.userId || Math.random().toString(36).substring(7);
    const fullConfig = { ...config, userId };
    
    setSafetyConfig(fullConfig);
    localStorage.setItem('safe_config_v2', JSON.stringify(fullConfig));
    
    setIsSyncing(true);
    try {
      await fetch('/api/heartbeat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      });
    } catch (err) {
      console.error("Config sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const addLog = async (mood) => {
    const time = new Date().getTime();
    const newLogs = [{ time, mood }, ...logs].slice(0, 50);
    setLogs(newLogs);
    localStorage.setItem('alive_logs_v2', JSON.stringify(newLogs));
    localStorage.setItem('last_check_in_time', time.toString());
    await syncHeartbeat(mood);
  };

  // 动态渲染图标
  const renderGreetingIcon = () => {
    switch(timeGreeting.icon) {
      case 'Sunrise': return <Sunrise className="w-4 h-4 text-orange-400" />;
      case 'Moon': return <Moon className="w-4 h-4 text-indigo-400" />;
      default: return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col items-center">
      {isSyncing && (
        <div className="fixed top-6 right-6 flex items-center gap-2 text-[10px] font-bold text-blue-500 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-500/10 z-[100] animate-pulse">
          <CloudUpload className="w-3 h-3" />
          <span>云端保护中...</span>
        </div>
      )}

      <header className="w-full max-w-2xl px-8 py-10 flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <h1 className="text-xs font-bold tracking-[0.3em] uppercase text-slate-400">Project Connection</h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-medium tracking-tight text-slate-800">{timeGreeting.text}</p>
            {renderGreetingIcon()}
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl px-6 pb-32">
        {activeTab === 'safety' ? (
          <SafetyModule 
            config={safetyConfig} 
            onSaveConfig={handleSaveSafetyConfig} 
            logs={logs} 
            onCheckIn={addLog} 
          />
        ) : (
          <LifeModule 
            data={userData} 
            onSaveData={(d) => { setUserData(d); localStorage.setItem('life_data_v2', JSON.stringify(d)); }} 
          />
        )}
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-64 z-50">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-full p-1.5 flex shadow-sm">
          <button onClick={() => setActiveTab('safety')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all duration-500 ${activeTab === 'safety' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px] font-bold tracking-wider">联结</span>
          </button>
          <button onClick={() => setActiveTab('life')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all duration-500 ${activeTab === 'life' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <Leaf className="w-4 h-4" />
            <span className="text-[11px] font-bold tracking-wider">时光</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// --- 联结模块子组件 ---
function SafetyModule({ config, onSaveConfig, logs, onCheckIn }) {
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [now, setNow] = useState(new Date());
  const [isEditing, setIsEditing] = useState(!config);
  const [showMoodInput, setShowMoodInput] = useState(false);
  const [tempMood, setTempMood] = useState("");

  useEffect(() => {
    const savedTime = localStorage.getItem('last_check_in_time');
    if (savedTime) setLastCheckIn(new Date(parseInt(savedTime)));
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const confirmCheckIn = () => {
    const time = new Date();
    setLastCheckIn(time);
    onCheckIn(tempMood || "一切如常。");
    setTempMood("");
    setShowMoodInput(false);
  };

  const status = useMemo(() => {
    if (!config || !lastCheckIn) return { isExpired: false, remainingMs: 0, progress: 100 };
    const thresholdMs = config.checkInInterval * 60 * 60 * 1000;
    const elapsed = now - lastCheckIn;
    const remaining = thresholdMs - elapsed;
    return {
      isExpired: remaining <= 0,
      isWarning: remaining > 0 && remaining < 3600000,
      remainingMs: Math.max(0, remaining),
      progress: Math.min(100, (remaining / thresholdMs) * 100)
    };
  }, [config, lastCheckIn, now]);

  if (isEditing) {
    return (
      <SafetySetup 
        config={config} 
        onSave={(c) => { onSaveConfig(c); setIsEditing(false); if(!lastCheckIn) confirmCheckIn(); }} 
        onCancel={() => config && setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col items-center py-6">
        <div className="relative w-64 h-64 flex items-center justify-center" onClick={() => setShowMoodInput(true)}>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="128" cy="128" r="120" fill="none" stroke="#f1f5f9" strokeWidth="1.5" />
            <circle
              cx="128" cy="128" r="120" fill="none" 
              stroke={status.isExpired ? "#ef4444" : (status.isWarning ? "#f59e0b" : "#3b82f6")} 
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - status.progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center space-y-1 z-10 cursor-pointer">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block">距离约定</span>
            <div className="text-5xl font-extralight tracking-tighter tabular-nums text-slate-800">
              {formatTime(status.remainingMs)}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowMoodInput(true)}
          className="mt-12 bg-white border border-slate-200/80 px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-800 transition-all active:scale-95"
        >
          我依然在此处
        </button>
      </div>

      <div className="bg-white/60 border border-slate-100 rounded-[2rem] p-8 space-y-8">
        <div className="flex justify-between items-center text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">守护协议运行中</h3>
            <p className="text-xs text-slate-400">联系人: {config?.contactName || '未设置'}</p>
          </div>
          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4 text-left">
          {logs.length > 0 ? logs.slice(0, 3).map((log, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 italic">"{log.mood}"</span>
              <span className="text-[10px] font-mono text-slate-300">{new Date(log.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          )) : (
            <p className="text-xs text-slate-300 italic text-center py-2 uppercase tracking-widest">暂无记录</p>
          )}
        </div>
      </div>

      {showMoodInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/95 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-10 text-center">
            <h3 className="text-2xl font-light text-slate-800 tracking-tight">此刻的心情</h3>
            <input 
              autoFocus
              className="w-full bg-transparent border-b border-slate-100 py-6 text-center text-2xl font-light outline-none focus:border-blue-300"
              value={tempMood}
              onChange={e => setTempMood(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmCheckIn()}
              placeholder="一切如常。"
            />
            <div className="flex justify-center gap-8">
              <button onClick={() => setShowMoodInput(false)} className="text-slate-400 text-sm font-medium">取消</button>
              <button onClick={confirmCheckIn} className="text-blue-600 text-sm font-bold">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SafetySetup({ config, onSave, onCancel }) {
  const [formData, setFormData] = useState(config || {
    userName: '',
    checkInInterval: 24,
    contactName: '',
    contactEmail: '',
    testament: ''
  });

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-8 text-left">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">守护设置</h2>
        <button onClick={onCancel} className="text-slate-300 hover:text-slate-600"><X className="w-5 h-5"/></button>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">响应周期</label>
          <div className="flex gap-2">
            {[12, 24, 48, 72].map(hr => (
              <button key={hr} onClick={() => setFormData({...formData, checkInInterval: hr})} className={`flex-1 py-3 rounded-2xl text-xs font-medium ${formData.checkInInterval === hr ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>{hr}h</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="联系人姓名" className="bg-slate-50 rounded-2xl px-5 py-4 text-sm outline-none" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
          <input placeholder="联系人邮箱" className="bg-slate-50 rounded-2xl px-5 py-4 text-sm outline-none" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
        </div>
        <textarea placeholder="预设告警邮件内容..." className="w-full bg-slate-50 rounded-2xl p-5 h-32 text-sm outline-none resize-none" value={formData.testament} onChange={e => setFormData({...formData, testament: e.target.value})} />
        <button onClick={() => onSave(formData)} className="w-full bg-blue-600 text-white font-bold py-5 rounded-3xl tracking-widest text-[11px] uppercase">开启云端守护</button>
      </div>
    </div>
  );
}

// --- 时光模块子组件 ---
function LifeModule({ data, onSaveData }) {
  if (!data) return <LifeInput onStart={onSaveData} />;
  
  const now = new Date();
  const birth = new Date(data.birthDate);
  const totalYears = BASE_LIFESPAN[data.gender] + LIFESTYLE_MODIFIERS[data.occupation].years;
  const deathDate = new Date(birth);
  deathDate.setFullYear(birth.getFullYear() + totalYears);
  
  const percentage = Math.min(100, Math.max(0, ((now - birth) / (deathDate - birth)) * 100));
  const livedMonths = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30.44));

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 text-left">
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-light text-slate-800 tracking-tighter">时光进度</h2>
        <button onClick={() => onSaveData(null)} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">重置</button>
      </div>
      <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] space-y-8">
        <div className="flex justify-between items-end">
          <span className="text-6xl font-light tracking-tighter tabular-nums text-slate-800">{percentage.toFixed(4)}%</span>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">预期寿命</span>
            <span className="text-sm font-bold text-slate-700">{totalYears} 年</span>
          </div>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">人生 900 格 (月)</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8px,1fr))] gap-[4px]">
          {Array.from({ length: 900 }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-[1px] ${i < livedMonths ? 'bg-slate-200' : (i === livedMonths ? 'bg-blue-400 animate-pulse' : 'bg-slate-50')}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LifeInput({ onStart }) {
  const [form, setForm] = useState({ birthDate: '', gender: 'male', occupation: 'default' });
  return (
    <div className="flex flex-col items-center py-20 space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-light tracking-tight text-slate-800">开始记录时光</h2>
        <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">记录生命的流转</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if(form.birthDate) onStart(form); }} className="w-full space-y-4">
        <input type="date" required className="w-full bg-white border border-slate-100 p-5 rounded-3xl outline-none" onChange={e => setForm({...form, birthDate: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <select className="bg-white border border-slate-100 p-5 rounded-3xl outline-none" onChange={e => setForm({...form, gender: e.target.value})}>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
          <select className="bg-white border border-slate-100 p-5 rounded-3xl outline-none" onChange={e => setForm({...form, occupation: e.target.value})}>
            {Object.entries(LIFESTYLE_MODIFIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-5 rounded-3xl uppercase tracking-widest text-[11px]">计算时光进度</button>
      </form>
    </div>
  );
}

function formatTime(ms) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
