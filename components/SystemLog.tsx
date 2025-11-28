
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, X, Bell, Terminal } from 'lucide-react';

interface LogMessage {
  id: string;
  type: 'info' | 'error' | 'alert';
  content: string;
  timestamp: string;
}

const SystemLog: React.FC = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const originalLogRef = useRef(console.log);
  const originalErrorRef = useRef(console.error);
  const originalAlertRef = useRef(window.alert);
  const processedRef = useRef(new Set<string>());

  const addLog = (type: 'info' | 'error' | 'alert', args: any[]) => {
    // Format the message
    const content = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') {
        try {
            return JSON.stringify(arg);
        } catch(e) {
            return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');

    // Prevent duplicate spam in short burst
    const key = `${type}-${content}-${Date.now()}`;
    if (processedRef.current.has(key)) return;
    processedRef.current.add(key);
    
    // Cleanup cache after 1 sec
    setTimeout(() => {
        processedRef.current.delete(key);
    }, 1000);
    
    // Add to state
    const newLog: LogMessage = {
      id: crypto.randomUUID(),
      type,
      content: content.length > 300 ? content.substring(0, 300) + '...' : content,
      timestamp: new Date().toLocaleTimeString()
    };

    setLogs(prev => [...prev.slice(-19), newLog]); // Keep last 20
    
    // Auto dismiss
    const duration = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        setLogs(prev => prev.filter(l => l.id !== newLog.id));
    }, duration);
  };

  useEffect(() => {
    // Hijack Console Log
    console.log = (...args) => {
      originalLogRef.current(...args);
      addLog('info', args);
    };

    // Hijack Console Error
    console.error = (...args) => {
      originalErrorRef.current(...args);
      addLog('error', args);
    };

    // Hijack Window Alert
    window.alert = (message) => {
        addLog('alert', [message]);
    };

    // Cleanup
    return () => {
      console.log = originalLogRef.current;
      console.error = originalErrorRef.current;
      window.alert = originalAlertRef.current;
    };
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none p-4">
      {logs.map(log => (
        <div 
          key={log.id}
          className={`
            pointer-events-auto cursor-pointer animate-fade-in
            p-4 rounded border-l-4 shadow-2xl backdrop-blur-md transition-all duration-300 transform hover:-translate-x-2
            flex items-start gap-3 relative overflow-hidden group
            ${log.type === 'error' 
              ? 'bg-red-950/95 border-l-red-600 border-t border-r border-b border-red-900/50 text-red-100' 
              : log.type === 'alert'
                ? 'bg-amber-950/95 border-l-amber-500 border-t border-r border-b border-amber-900/50 text-amber-100'
                : 'bg-stone-900/95 border-l-stone-500 border-t border-r border-b border-stone-800/50 text-stone-300'
            }
          `}
          onClick={() => setLogs(prev => prev.filter(l => l.id !== log.id))}
        >
          {/* Icon */}
          <div className={`mt-0.5 flex-shrink-0 
            ${log.type === 'error' ? 'text-red-500' : log.type === 'alert' ? 'text-amber-500' : 'text-stone-500'}
          `}>
             {log.type === 'error' ? <AlertTriangle size={18} /> : log.type === 'alert' ? <Bell size={18} /> : <Terminal size={18} />}
          </div>

          <div className="flex-1 overflow-hidden z-10">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 font-cinzel">
                    {log.type === 'error' ? 'Falha Crítica' : log.type === 'alert' ? 'Mensagem do Sistema' : 'Console'}
                </span>
                <span className="text-[9px] font-mono opacity-50">{log.timestamp}</span>
             </div>
             <p className="text-sm font-sans break-words leading-snug">{log.content}</p>
          </div>
          
          <button className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-current">
              <X size={14}/>
          </button>
        </div>
      ))}
    </div>
  );
};

export default SystemLog;
