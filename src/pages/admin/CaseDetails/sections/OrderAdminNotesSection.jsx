import React, { useState } from 'react';
import { FileText, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderAdminNotesSection = ({
  notes = [],
  onSaveNote = null,
  isSavingNote = false
}) => {
  const [isOpen, setIsOpen] = useState(true);
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header / Accordion Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-100 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
          <FileText size={15} className="text-[#4F46E5] stroke-[2.25]" />
          <span>Admin Notes & Audit Log ({notes.length})</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {isOpen && (
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

export default OrderAdminNotesSection;
