import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderTabsSection = ({
  order = {},
  notes = [],
  onSaveNote = null,
  isSavingNote = false
}) => {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'notes'
  const [newNote, setNewNote] = useState('');
  const [visibleToCustomer, setVisibleToCustomer] = useState(false);

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      return new Date(dateVal).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateVal);
    }
  };

  // Activity events from order timeline
  const orderEvents = Array.isArray(order?.timeline) ? order.timeline : [];
  const sortedEvents = [...orderEvents]
    .filter(ev => !String(ev.type || '').toLowerCase().includes('qc') && !String(ev.type || '').toLowerCase().includes('quality check'))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error('Please enter a note before saving');
      return;
    }
    if (onSaveNote) {
      onSaveNote({
        note: newNote.trim(),
        visibleToCustomer: visibleToCustomer,
      });
      setNewNote('');
      setVisibleToCustomer(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Tabs Navigation Header */}
      <div className="flex items-center border-b border-slate-200 px-4 sm:px-5 bg-slate-50/50 overflow-x-auto">
        {[
          { id: 'activity', label: `Activity History (${sortedEvents.length})` },
          { id: 'notes', label: `Admin Notes (${notes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3 text-xs font-semibold transition-all relative border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#4F46E5] text-[#4F46E5] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Activity History */}
      {activeTab === 'activity' && (
        <div className="p-4 sm:p-5">
          {sortedEvents.length > 0 ? (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {sortedEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 p-3 bg-slate-50/80 hover:bg-slate-50 rounded-lg border border-slate-100 text-xs transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span>{ev.type || 'Status Update'}</span>
                        {ev.performedBy && (
                          <span className="text-[10px] font-normal text-slate-400">by {ev.performedBy}</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs font-medium leading-relaxed">
                        {ev.description || 'System recorded event update.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                    {formatDate(ev.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              No activity history records found for this order.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Admin Notes */}
      {activeTab === 'notes' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Add Note Form */}
          <form onSubmit={handleAddNoteSubmit} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 block">Add Order Note</span>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Type internal order details, customer communications, or packing instructions..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-1 focus:ring-[#4F46E5] resize-none h-16"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleToCustomer}
                  onChange={(e) => setVisibleToCustomer(e.target.checked)}
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span>Visible to customer</span>
              </label>

              <button
                type="submit"
                disabled={isSavingNote || !newNote.trim()}
                className="px-3 py-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSavingNote ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                <span>Save Note</span>
              </button>
            </div>
          </form>

          {/* Notes History */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Notes History ({notes.length})</span>
            {notes.length > 0 ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {notes.map((n, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">{n.author || 'Admin'}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            n.visibleToCustomer
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {n.visibleToCustomer ? 'Customer Visible' : 'Internal'}
                        </span>
                        <span className="text-slate-400">{formatDate(n.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 font-medium">"{n.note || String(n)}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                No notes recorded yet for this order.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTabsSection;
