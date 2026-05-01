import React, { useState, useRef } from 'react';
import { Plus, Mic, Square, Image as ImageIcon, X, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { MemoItem } from '../types';

const defaultMemo: MemoItem[] = [
  {
    id: '1',
    date: '2026-04-27',
    title: '미니멀 디자인 핵심',
    content: '여백을 아끼지 말 것. 색상은 메인 1개, 보조 1개로 제한할 때 가장 세련된 느낌을 준다.'
  }
];

export default function MemoView() {
  const { data: items, updateItem, deleteItem } = useFirestoreCollection<MemoItem>('memos');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl && !audioUrl) return;

    if (editingId) {
      updateItem(editingId, { date, title: '', content, imageUrl, audioUrl });
    } else {
      const id = Date.now().toString();
      updateItem(id, {
        id,
        date,
        title: '',
        content,
        imageUrl,
        audioUrl
      });
    }
    
    // Reset
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setImageUrl('');
    setAudioUrl('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditClick = (item: MemoItem) => {
    setEditingId(item.id);
    setDate(item.date);
    setTitle(item.title);
    setContent(item.content);
    setImageUrl(item.imageUrl || '');
    setAudioUrl(item.audioUrl || '');
    setIsAdding(true);
    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      deleteItem(id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-stone-800">메모장</h2>
        <button 
          onClick={() => {
            if (isAdding) {
               setIsAdding(false);
               setEditingId(null);
               setTitle('');
               setContent('');
               setImageUrl('');
               setAudioUrl('');
               setDate(new Date().toISOString().split('T')[0]);
            } else {
               setIsAdding(true);
               setEditingId(null);
               setTitle('');
               setContent('');
               setImageUrl('');
               setAudioUrl('');
               setDate(new Date().toISOString().split('T')[0]);
            }
          }} 
          className="bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-95 shadow-sm"
        >
          <Plus size={18} className={isAdding && !editingId ? "rotate-45" : "transition-transform"} />
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
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="어떤 생각을 기록할까요? (#태그를 활용해보세요)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none resize-none" rows={4} />
            
            {/* Attachments Preview */}
            {(imageUrl || audioUrl) && (
              <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
                {imageUrl && (
                  <div className="relative inline-block w-full h-32 bg-stone-200 rounded-lg overflow-hidden">
                    <img src={imageUrl} alt="attached" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 backdrop-blur hover:bg-black/70">
                      <X size={14} />
                    </button>
                  </div>
                )}
                {audioUrl && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-100 shadow-sm relative">
                    <audio src={audioUrl} controls className="w-full h-8" />
                    <button type="button" onClick={() => setAudioUrl('')} className="shrink-0 p-1 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-full">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <label className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors active:scale-95">
                <ImageIcon size={16} /> 사진 추가
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              {isRecording ? (
                <button type="button" onClick={stopRecording} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-rose-200 bg-rose-50 text-rose-600 active:scale-95 transition-all animate-pulse">
                  <Square size={14} fill="currentColor" /> 녹음 중지
                </button>
              ) : (
                <button type="button" onClick={startRecording} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors active:scale-95">
                  <Mic size={16} /> 음성 녹음
                </button>
              )}
            </div>

            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-bold mt-1 shadow-sm hover:bg-stone-800 transition-colors active:scale-95">
              {editingId ? '수정 완료' : '기록하기'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-5 rounded-[20px] border border-stone-100 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEditClick(item)} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="pr-16">
              <div className="text-[10px] text-stone-400 font-medium mb-1 tracking-wide">{item.date}</div>
            </div>
            
            {item.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-stone-100 shadow-sm mt-1">
                <img src={item.imageUrl} alt="memo" className="w-full object-cover max-h-40" />
              </div>
            )}
            
            {item.audioUrl && (
              <div className="mt-1">
                <audio src={item.audioUrl} controls className="w-full h-8" />
              </div>
            )}

            {item.content && (
              <p className="text-[13px] text-stone-700 whitespace-pre-wrap leading-relaxed mt-1">
                {item.content.split('\n').map((line, i) => {
                  const parts = line.split(/(#\S+)/g);
                  return (
                    <React.Fragment key={i}>
                      {parts.map((part, j) => 
                        part.startsWith('#') ? <span key={j} className="text-sky-500 font-bold bg-sky-50 px-1 rounded-md py-0.5 inline-block mx-0.5">{part}</span> : part
                      )}
                      <br/>
                    </React.Fragment>
                  );
                })}
              </p>
            )}
          </motion.div>
        ))}
        {items.length === 0 && (
           <div className="col-span-full text-center py-12 text-stone-400 text-sm font-medium">
             기록된 메모가 없습니다.
           </div>
        )}
      </div>
    </motion.div>
  );
}
