import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { History, Search } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.getAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.entity && l.entity.toLowerCase().includes(term)) ||
      (l.entity_id && l.entity_id.toLowerCase().includes(term)) ||
      (l.user_name && l.user_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            System Audit Trail & Compliance Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Immutable administrative event logging for status changes, document verifications, scheme creations, and dataset ingestions.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
          {logs.length} Logged Events
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs by action, entity ID or officer..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity & Reference ID</th>
                <th className="py-3 px-4">Actor / Officer</th>
                <th className="py-3 px-4">Details / Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading audit trail...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No matching audit events.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-500 uppercase text-[10px] block font-bold">{log.entity}</span>
                      <span className="font-mono text-slate-900 font-bold">{log.entity_id || '-'}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.user_name || 'System'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {log.previous_value ? `Changed from '${log.previous_value}' to '${log.new_value}'` : log.new_value || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
