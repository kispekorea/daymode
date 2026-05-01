import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { WishlistItem, ItemType, WishNecessity } from '../types';

const defaultWishlist: WishlistItem[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    name: '점심 식사',
    imageUrl: '',
    type: 'expense',
    status: 'bought',
    necessity: 'essential',
    price: '12,000'
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    name: '디자이너 조명',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
    type: 'wish',
    status: 'wish',
    necessity: 'thinking',
    price: '85,000'
  }
];

export default function WishlistView() {
  const { data: items, updateItem, deleteItem } = useFirestoreCollection<WishlistItem>('wishlistItems');
  
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'expense' | 'wish'>('expense');

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<ItemType>('expense');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [necessity, setNecessity] = useState<WishNecessity>('thinking');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
  };

  const monthItems = useMemo(() => items.filter(i => i.date.startsWith(monthPrefix)), [items, monthPrefix]);
  
  // 가계부: 이번 달 소비 + 이번 달 구매한 위시
  const expenseItems = useMemo(() => 
    monthItems.filter(i => i.type === 'expense' || i.status === 'bought').sort((a,b) => b.date.localeCompare(a.date))
  , [monthItems]);
  
  const wishItems = useMemo(() => 
    monthItems.filter(i => i.type === 'wish' && i.status === 'wish').sort((a,b) => b.date.localeCompare(a.date))
  , [monthItems]);

  const totalExpense = expenseItems.reduce((acc, cur) => acc + (parseInt(cur.price.replace(/[^0-9]/g, '')) || 0), 0);

  const groupedExpenseItems = useMemo(() => {
    const groups: Record<string, WishlistItem[]> = {};
    expenseItems.forEach(item => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
  }, [expenseItems]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const placeholderImg = 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop';
    
    if (editingId) {
      updateItem(editingId, { date, name: name.trim(), imageUrl: type === 'wish' ? (imageUrl.trim() || placeholderImg) : '', type, necessity: type === 'wish' ? necessity : 'essential', price: price || '0', linkUrl: type === 'wish' ? linkUrl.trim() : '' });
    } else {
      const id = Date.now().toString();
      updateItem(id, {
        id,
        date,
        name: name.trim(),
        imageUrl: type === 'wish' ? (imageUrl.trim() || placeholderImg) : '',
        type,
        status: type === 'expense' ? 'bought' : 'wish',
        necessity: type === 'wish' ? necessity : 'essential',
        price: price || '0',
        linkUrl: type === 'wish' ? linkUrl.trim() : ''
      });
    }

    setIsAdding(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setImageUrl('');
    setLinkUrl('');
    setNecessity('thinking');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const markAsBought = (id: string) => {
    updateItem(id, { status: 'bought', date: new Date().toISOString().split('T')[0] });
  };

  const updateNecessity = (id: string, currentNecessity: WishNecessity) => {
    const next = currentNecessity === 'essential' ? 'thinking' : currentNecessity === 'thinking' ? 'unnecessary' : 'essential';
    updateItem(id, { necessity: next });
  };

  const handleEditClick = (item: WishlistItem) => {
    setEditingId(item.id);
    setDate(item.date);
    setType(item.type);
    setName(item.name);
    setPrice(item.price);
    setImageUrl(item.imageUrl === 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop' ? '' : item.imageUrl);
    setLinkUrl(item.linkUrl || '');
    setNecessity(item.necessity);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제하시겠습니까?')) {
      deleteItem(id);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
      
      {/* Month Navigator */}
      <div className="flex justify-between items-center mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
        <button onClick={prevMonth} className="p-2 hover:bg-stone-50 rounded-xl transition-colors"><ChevronLeft size={20} className="text-stone-500" /></button>
        <span className="font-semibold text-stone-800 tracking-tight">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</span>
        <button onClick={nextMonth} className="p-2 hover:bg-stone-50 rounded-xl transition-colors"><ChevronRight size={20} className="text-stone-500" /></button>
      </div>

      {/* View Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 bg-stone-200/50 p-1 rounded-xl">
          <button onClick={() => setViewTab('expense')} className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'expense' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>가계부</button>
          <button onClick={() => setViewTab('wish')} className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'wish' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>위시리스트</button>
        </div>
        <button onClick={() => {
          if (isAdding) {
            setIsAdding(false);
            setEditingId(null);
            setName('');
            setPrice('');
            setImageUrl('');
            setLinkUrl('');
            setNecessity('thinking');
            setDate(new Date().toISOString().split('T')[0]);
          } else {
            setIsAdding(true);
            setEditingId(null);
            setName('');
            setPrice('');
            setImageUrl('');
            setLinkUrl('');
            setNecessity('thinking');
            setDate(new Date().toISOString().split('T')[0]);
          }
        }} className="bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-95 shadow-sm">
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
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${type === 'expense' ? 'bg-green-50 text-green-700 border border-green-200/50' : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-transparent'}`}>👛 소비 기록</button>
              <button type="button" onClick={() => setType('wish')} className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${type === 'wish' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-transparent'}`}>✨ 위시 아이템</button>
            </div>
            
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none" required />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="항목 이름" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none" required />
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="금액 (예: 15,000)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none" />
            
            {type === 'wish' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {imageUrl && <img src={imageUrl} alt="preview" className="w-full h-32 object-cover rounded-xl mb-3 border border-stone-100" />}
                <div className="flex gap-2 mb-3">
                  <label className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm text-center text-stone-500 hover:bg-stone-100 cursor-pointer transition-colors cursor-pointer flex items-center justify-center gap-2">
                    <Check size={16} className={imageUrl ? "text-green-500" : "hidden"} />
                    {imageUrl ? '사진 변경' : '사진 첨부 (갤러리)'}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="참고 URL (선택사항)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-stone-300 outline-none mb-3" />
                <div className="flex gap-2">
                  {(['essential','thinking','unnecessary'] as WishNecessity[]).map(n => (
                     <button type="button" key={n} onClick={() => setNecessity(n)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all ${necessity === n ? 'border-stone-400 bg-stone-800 text-white shadow-sm' : 'border-stone-100 text-stone-400 hover:bg-stone-50'}`}>
                       {n === 'essential' ? '꼭 필요함' : n === 'unnecessary' ? '불필요' : '고민중'}
                     </button>
                  ))}
                </div>
              </motion.div>
            )}
            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-medium mt-2 hover:bg-stone-800 transition-colors">
              {editingId ? '수정 완료' : '추가하기'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewTab === 'expense' && (
          <motion.div key="expense" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {/* 총 지출 데시보드 */}
            <div className="bg-gradient-to-br from-[#E6EEF4] to-[#D0DDF0] border border-white rounded-[24px] p-6 text-center mb-6 shadow-lg shadow-[#D0DDF0]/50">
              <p className="text-[#6B8A9E] text-sm font-bold mb-1.5 opacity-90">이번 달 총 지출</p>
              <h3 className="text-3xl font-bold tracking-tight text-slate-800 mb-1">₩{totalExpense.toLocaleString()}</h3>
            </div>
            
            <div className="space-y-6">
              {groupedExpenseItems.length > 0 ? groupedExpenseItems.map(([dateGroup, items]) => (
                <div key={dateGroup}>
                  <div className="text-[12px] font-bold text-stone-400 mb-2 px-1 tracking-wider">{dateGroup}</div>
                  <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden border border-stone-100">
                    {items.map((item, idx) => (
                      <div key={item.id} className={`flex justify-between items-center p-4 group relative ${idx !== items.length - 1 ? 'border-b border-stone-50' : ''} transition-colors hover:bg-stone-50/50`}>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-stone-800 flex items-center gap-2">
                              {item.name}
                              {item.type === 'wish' && <span className="bg-indigo-50/80 text-indigo-500 px-1.5 py-0.5 text-[9px] rounded-full font-bold tracking-tight border border-indigo-100">위시 달성✨</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-stone-800 text-[15px] tracking-tight mr-1 transition-opacity group-hover:opacity-0 sm:group-hover:opacity-100">₩{item.price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 bg-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm p-1 rounded-xl">
                            <button onClick={() => handleEditClick(item)} className="p-1.5 text-stone-400 hover:text-stone-600 bg-white/80 rounded-lg hover:bg-stone-100 shadow-sm">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 bg-white/80 rounded-lg hover:bg-rose-50 shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-center text-stone-400 py-10 text-sm">지출 내역이 없습니다.</p>
              )}
            </div>
          </motion.div>
        )}

        {viewTab === 'wish' && (
          <motion.div key="wish" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-2 gap-4">
              {wishItems.map(item => (
                  <div key={item.id} className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-stone-100 flex flex-col group">
                    <div className="aspect-[4/3] bg-stone-100 relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-semibold">NO IMAGE</div>
                      )}
                      
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.necessity === 'essential' && <span className="bg-rose-50/90 text-rose-600 px-2.5 py-1 text-[10px] rounded-full font-bold shadow-sm backdrop-blur">🔥 필요함</span>}
                        {item.necessity === 'unnecessary' && <span className="bg-stone-100/90 text-stone-500 px-2.5 py-1 text-[10px] rounded-full font-bold shadow-sm backdrop-blur">🧊 불필요</span>}
                        {item.necessity === 'thinking' && <span className="bg-amber-50/90 text-amber-600 px-2.5 py-1 text-[10px] rounded-full font-bold shadow-sm backdrop-blur">🤔 고민중</span>}
                      </div>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col justify-between relative group-hover:bg-stone-50/50 transition-colors">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(item)} className="p-1.5 text-stone-400 hover:text-stone-600 bg-white/80 backdrop-blur-sm shadow-sm border border-stone-100 rounded-lg hover:bg-stone-50">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 bg-white/80 backdrop-blur-sm shadow-sm border border-stone-100 rounded-lg hover:bg-rose-50">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div>
                        <div className="flex justify-between items-start mb-0.5">
                          <div className="text-[10px] text-stone-400">{item.date}</div>
                        </div>
                        <h3 className="text-[13px] font-semibold leading-tight mb-1 line-clamp-2 text-stone-800 pr-12">{item.name}</h3>
                        {item.linkUrl && (
                          <a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline line-clamp-1 break-all mb-2 inline-block">🔗 링크 열기</a>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1 border-t border-stone-50 pt-2">
                        <p className="text-[13px] text-stone-600 font-bold tracking-tight">{item.price ? `₩${item.price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : '-'}</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => updateNecessity(item.id, item.necessity)} className="w-7 h-7 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center hover:bg-stone-100 hover:text-stone-600 transition-colors" title="필요도 변경">
                            <span className="text-[12px] font-bold">⇄</span>
                          </button>
                          <button onClick={() => markAsBought(item.id)} className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors shadow-sm" title="구매 완료 (가계부로 이동)">
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
              {wishItems.length === 0 && <div className="col-span-2 text-center text-stone-400 py-10 text-sm">위시 아이템이 없습니다.</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
