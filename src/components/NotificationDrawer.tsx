import React from 'react';
import { NotificationItem } from '../types';
import { Bell, Check, Trash2, X, AlertOctagon, FileWarning, ShieldAlert, CheckCircle2, Eye } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead?: (id: string) => void;
  onDismissNotification?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClearAll: () => void;
  onNavigateToEntity?: (type: string, entityId?: string) => void;
  onSelectIncident?: (id: string) => void;
  onSelectFile?: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onDismissNotification,
  onMarkAllRead,
  onClearAll,
  onNavigateToEntity,
  onSelectIncident,
  onSelectFile,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleDismiss = (id: string) => {
    if (onDismissNotification) onDismissNotification(id);
    else if (onMarkRead) onMarkRead(id);
  };

  const getIcon = (type: NotificationItem['type'], severity: NotificationItem['severity']) => {
    switch (type) {
      case 'file_modified':
        return <FileWarning className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'critical_threat':
        return <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'new_incident':
        return <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'verification_complete':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      default:
        return <Eye className="w-5 h-5 text-cyan-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Security Alerts & Feed</h2>
                <p className="text-xs text-slate-500">
                  {unreadCount} unacknowledged alert{unreadCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && onMarkAllRead && (
                <button
                  onClick={onMarkAllRead}
                  title="Mark all as read"
                  className="p-1.5 text-xs text-slate-600 hover:text-cyan-700 rounded hover:bg-slate-200/60 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  title="Clear all"
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-200/60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="p-4 rounded-full bg-slate-100 border border-slate-200 mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-800">All Clear</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  No pending security alerts or file integrity modifications detected.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    handleDismiss(notif.id);
                    if (notif.entityId) {
                      if (notif.type === 'file_modified' && onSelectFile) {
                        onSelectFile(notif.entityId);
                      } else if (onSelectIncident) {
                        onSelectIncident(notif.entityId);
                      } else if (onNavigateToEntity) {
                        onNavigateToEntity(notif.type, notif.entityId);
                      }
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !notif.read
                      ? 'bg-cyan-50/50 border-cyan-200 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notif.type, notif.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.entityId && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-cyan-800 border border-slate-200 font-semibold shadow-2xs">
                            Target: {notif.entityId}
                          </span>
                          <span className="text-[10px] font-medium text-cyan-700 hover:underline">
                            Inspect entity →
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              Live SOC Telemetry • Automatic Polling Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
