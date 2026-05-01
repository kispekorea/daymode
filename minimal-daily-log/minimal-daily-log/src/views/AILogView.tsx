import React, { useState } from 'react';
import { Plus, Sparkles, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { AILogItem } from '../types';

const defaultAI: AILogItem[] = [
  {
    id: '1',
    date: '2026-04-27',
    toolName: 'Gemini 1.5 Pro',
    usage: '앱시트 구조와 리액트 구조 매핑',
    feedback: '한 방에 깔끔하게 구조를 잡아주어 시간이 크게 단축됨. 반복 작업에 쓰기 딱 좋음.'
  },
  {
    id: '2',
    date: '2026-04-25',
    toolName: 'Midjourney',
    usage: '앱 감성 레퍼런스 이미지 생성',
    feedback: '깔끔한 흰 배경에 부드러운 조명을 지정하니 원하는 무드가 바로 나옴.'
  }
];

export default function AILogView() {
  const { data: items, updateItem, deleteItem } = useFirestoreCollection<AILogItem>('aiLogs');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toolName, setToolName] = useState('');
  const [usage, setUsage] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim() || !usage.trim()) return;

    if (editingId) {
      updateItem(editingId, { date, toolName, usage, feedback });
      setEditingId(null);
    } else {
      const id = Date.now().toString();
      updateItem(id, {
        id,
        date,
        toolName,
        usage,
        feedback
      });
    }

    setIsAdding(false);
    setToolName('');
    setUsage('');
    setFeedback('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (item: AILogItem) => {
    setEditingId(item.id);
    setDate(item.date);
    setToolName(item.toolName);
    setUsage(item.usage);
    setFeedback(item.feedback);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      deleteItem(id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">AI 도구 기록</h2>
        <button 
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setEditingId(null);
              setToolName('');
              setUsage('');
              setFeedback('');
              setDate(new Date().toISOString().split('T')[0]);
            } else {
              setIsAdding(true);
              setEditingId(null);
              setToolName('');
              setUsage('');
              setFeedback('');
              setDate(new Date().toISOString().split('T')[0]);
            }
          }} 
          className="bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-800 transition-colors shadow-sm"
        >
          <Plus size={20} className={isAdding && !editingId ? "rotate-45 transition-transform" : "transition-transform"} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-6 space-y-3 overflow-hidden"
            onSubmit={handleAdd}
          >
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none" required />
            <input type="text" value={toolName} onChange={(e) => setToolName(e.target.value)} placeholder="도구 이름 (예: Gemini)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none" required />
            <textarea value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="활용 내용" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none resize-none" rows={2} required />
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="AI 피드백 / 느낀점" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none resize-none" rows={3} required />
            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-medium mt-2 hover:bg-stone-800 transition-colors">
              {editingId ? '수정 완료' : '저장하기'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {items.map(item => (
          <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-5 rounded-[20px] shadow-sm border border-stone-100 relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(item)} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex justify-between items-center mb-3 pr-16">
              <span className="text-xs text-stone-400">{item.date}</span>
              <span className="bg-indigo-50/80 text-indigo-600 border border-indigo-100/50 text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Sparkles size={10} />
                {item.toolName}
              </span>
            </div>
            <h3 className="text-[14px] font-semibold text-stone-800 mb-2.5 leading-relaxed">{item.usage}</h3>
            {item.feedback && (
               <div className="text-[13px] text-stone-600 bg-stone-50/80 p-3.5 rounded-xl font-medium leading-relaxed">
                  <span className="text-stone-400 mr-2">🗣️</span>
                  {item.feedback}
               </div>
            )}
          </motion.div>
        ))}
        {items.length === 0 && (
           <div className="text-center py-10 text-stone-400 text-sm">
             기록된 항목이 없습니다.
           </div>
        )}
      </div>
    </motion.div>
  );
}
