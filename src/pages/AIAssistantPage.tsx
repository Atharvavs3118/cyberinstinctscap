import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Shield,
  FileSearch,
  Building2,
  Trash2,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { AIChatMessage, CyberIncident, ProtectedFile } from '../types';
import { sendChatMessage, checkGeminiStatus, GeminiStatus } from '../services/aiService';

interface AIAssistantPageProps {
  incidents: CyberIncident[];
  files: ProtectedFile[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onNavigateToTab: (tab: any) => void;
}

const DEFAULT_MESSAGES: AIChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'assistant',
    content: `### 🤖 CyberInstincts SOC AI Copilot Active

Welcome to the AI Intelligence Copilot, powered by **Gemini 3.8 Flash** with real-time SOC context integration.

I have direct visibility into:
- **CyberTrace**: Active threat telemetry, CVE mappings, and CVSS severity scoring.
- **MiniVault**: Cryptographic SHA-256 baselines and live file tampering anomalies.
- **Government Portal**: Statutory CERT-In and CISA incident disclosure obligations.

How can I assist your investigation today? Click a prompt below or enter an operational query.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  incidents,
  files,
  onShowToast,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextFilter, setContextFilter] = useState<'all' | 'critical-only'>('all');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkGeminiStatus().then((status) => {
      setGeminiStatus(status);
    });
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isSending) return;

    const userMsg: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: promptToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsSending(true);

    // Prepare SOC Context
    const socContext = {
      totalIncidents: incidents.length,
      criticalIncidents: incidents.filter((i) => i.severity === 'CRITICAL').length,
      tamperedFiles: files.filter((f) => f.status === 'MODIFIED').length,
      activeThreats: incidents.slice(0, 3).map((i) => ({
        id: i.id,
        type: i.threatType,
        severity: i.severity,
        target: i.target,
        sourceIp: i.sourceIp,
      })),
      monitoredFiles: files.map((f) => ({
        name: f.fileName,
        status: f.status,
        hashMatch: f.originalHash === f.currentHash,
      })),
    };

    try {
      const res = await sendChatMessage(promptToSend, messages, socContext);
      const assistantMsg: AIChatMessage = {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      onShowToast('Could not complete AI request: ' + err?.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    onShowToast('Analysis copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    onShowToast('Chat history cleared', 'info');
  };

  const quickPrompts = [
    {
      label: '🚨 Triage Active Critical Incidents',
      prompt: 'Review our active CRITICAL severity incidents in CyberTrace and give me an immediate containment prioritization list.',
    },
    {
      label: '🔍 MiniVault Cryptographic Integrity Check',
      prompt: 'Analyze our protected files. Are there any unauthorized SHA-256 hash modifications or ransomware tampering indicators?',
    },
    {
      label: '🏛️ CERT-In 6-Hour Statutory Disclosure',
      prompt: 'Under CERT-In guidelines, which of our current incidents require formal statutory notification within the 6-hour window and what are the steps?',
    },
    {
      label: '🛡️ SSH Brute Force Defense Playbook',
      prompt: 'Provide a step-by-step MITRE ATT&CK T1110 mitigation playbook for our SSH bastion gateway.',
    },
  ];

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[580px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Copilot Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                CyberInstincts AI Copilot
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-100 text-cyan-800 border border-cyan-300">
                GEMINI 3.8 FLASH
              </span>
            </div>
            <p className="text-xs text-slate-500">
              SOC Threat Intelligence, Cryptographic Forensics & Regulatory Reporting Assistant
            </p>
          </div>
        </div>

        {/* Status Indicators & Clear */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                geminiStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-600 text-[11px]">
              {geminiStatus?.configured ? 'Gemini API: Live' : 'SOC Intelligence: Ready'}
            </span>
          </div>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 font-mono">
          Quick Actions:
        </span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={isSending}
            className="shrink-0 text-xs px-3 py-1 rounded-lg bg-white hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300 border border-slate-200 text-slate-700 font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 shadow-xs text-xs leading-relaxed space-y-2 relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Content Render */}
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

                {/* Footer / Copy */}
                <div
                  className={`flex items-center justify-between pt-1 border-t text-[10px] font-mono ${
                    isUser ? 'border-indigo-500/50 text-indigo-200' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="flex items-center gap-1 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Copy Answer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
              <span>Analyzing telemetry & evaluating threat vectors with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Copilot about incidents, hash tampering, MITRE tactics, or CERT-In reports..."
            disabled={isSending}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
          />

          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-mono">
          <span>Server-side Gemini 3.8 Flash AI Model Proxy</span>
          <span>Tip: You can also launch one-click AI analysis directly from Incident & File inspection modals</span>
        </div>
      </div>
    </div>
  );
};
