import React, { useState, useEffect, useRef } from 'react';

const SERVER_MODE = typeof (window as any).Capacitor === 'undefined'; // web = server mode, APK = local mode

const NotifCaptureViewer: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadedRef = useRef<Set<string>>(new Set());

  // Upload local notifications to server (APK mode only)
  const uploadToServer = async (notif: any) => {
    const key = notif.timestamp + '_' + (notif.fullText || '').substring(0, 30);
    if (uploadedRef.current.has(key)) return;
    uploadedRef.current.add(key);
    try {
      await fetch('/api/upload-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification: notif })
      });
    } catch (e) { /* network error, ignore */ }
  };

  const loadFromServer = async () => {
    try {
      const res = await fetch(`/api/notifications?limit=100&filter=${encodeURIComponent(filter)}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.log('Server load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocal = async () => {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key: 'notif_log' });
      if (value) {
        const parsed = JSON.parse(value);
        parsed.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        setNotifications(parsed);
        setTotal(parsed.length);
        // Upload each to server
        for (const n of parsed) { await uploadToServer(n); }
      }
    } catch (e) {
      console.log('Local load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (SERVER_MODE) {
      loadFromServer();
      intervalRef.current = setInterval(loadFromServer, 5000);
    } else {
      loadFromLocal();
      intervalRef.current = setInterval(loadFromLocal, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [filter]);

  const filtered = filter && SERVER_MODE
    ? notifications // server already filters
    : filter
      ? notifications.filter(n => {
          const full = n.fullText?.toLowerCase() || '';
          const pkg = n.package?.toLowerCase() || '';
          const f = filter.toLowerCase();
          return full.includes(f) || pkg.includes(f);
        })
      : notifications;

  const uniquePackages = [...new Set(notifications.map(n => n.package))].sort();

  const exportAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(notifications, null, 2));
      alert('✅ Copied ' + notifications.length + ' notifications to clipboard');
    } catch {
      alert('❌ Failed to export');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 font-sans">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">📋 Captured Notifications {SERVER_MODE ? '(Server)' : '(Local)'}</h2>
          <p className="text-slate-400 text-xs">{total || notifications.length} captured · {uniquePackages.length} apps</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAll} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-bold">📤 Export</button>
          <button onClick={() => SERVER_MODE ? loadFromServer() : loadFromLocal()} className="bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded text-xs font-bold">🔄 Refresh</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-3 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="🔍 Filter by text or package..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 px-3 py-1.5 border rounded text-sm outline-none focus:ring-2 focus:ring-[#E2136E]"
        />
        <select
          onChange={e => setFilter(e.target.value)}
          className="px-2 py-1.5 border rounded text-sm bg-white"
        >
          <option value="">All apps</option>
          {uniquePackages.map(pkg => (
            <option key={pkg} value={pkg}>{pkg.replace('com.', '')}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border-x border-slate-200 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left w-28">Time</th>
              <th className="px-3 py-2 text-left w-32">App</th>
              <th className="px-3 py-2 text-left">Content</th>
              <th className="px-3 py-2 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-10 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-10 text-center text-slate-400">No notifications captured yet</td></tr>
            ) : (
              filtered.map((n, i) => (
                <tr key={n.id || i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500 font-mono">
                    {n.time ? n.time.substring(11, 19) : (n.serverTime ? n.serverTime.substring(11, 19) : '')}
                    <br />
                    <span className="text-[10px]">{n.time ? n.time.substring(0, 10) : (n.serverTime ? n.serverTime.substring(0, 10) : '')}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] max-w-[120px] truncate">
                      {n.package?.replace(/^com\./, '') || '?'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-bold text-slate-700">{n.title}</div>
                    <div className="text-slate-500 mt-0.5 line-clamp-2">{n.text}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {n.actions && n.actions.length > 0 ? (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded">{n.actions.length}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-b-xl px-3 py-2 text-[10px] text-slate-400">
        {SERVER_MODE
          ? 'Reading from server · Updates every 5s'
          : 'Reading from local device · Auto-uploading to server · Enable: Settings → Notification Access'}
      </div>
    </div>
  );
};

export default NotifCaptureViewer;
