import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { Plus, X, ArrowLeft, ChevronRight, Users } from 'lucide-react';

const GROUP_EMOJIS = ['✈️','🏖️','🏔️','🎉','🍕','🏕️','🎭','🚀','💼','🎓','🏠','🎸','⚽','🎮','🛍️','🌍'];

export const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const createGroup = useStore((s) => s.createGroup);
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [members, setMembers] = useState(['', '']);
  const [error, setError] = useState('');

  const addMember = () => setMembers([...members, '']);
  const removeMember = (i: number) => { if (members.length > 2) setMembers(members.filter((_, idx) => idx !== i)); };
  const updateMember = (i: number, val: string) => { const n = [...members]; n[i] = val; setMembers(n); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Group name is required');
    const valid = members.map((m) => m.trim()).filter(Boolean);
    if (valid.length < 2) return setError('Add at least 2 members');
    const uniq = new Set(valid.map((m) => m.toLowerCase()));
    if (uniq.size !== valid.length) return setError('Member names must be unique');
    const gid = createGroup(name.trim(), description.trim(), emoji, valid);
    showToast(`${emoji} ${name.trim()} created! 🎉`);
    navigate(`/groups/${gid}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/')}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create a Group</h1>
          <p className="text-gray-400 text-sm">Set up your trip or event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Emoji + Name combined card */}
        <div className="card p-5">
          {/* Emoji grid */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pick an icon</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {GROUP_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                className={`w-11 h-11 text-2xl rounded-2xl flex items-center justify-center transition-all ${
                  emoji === e ? 'bg-green-100 ring-2 ring-green-500 scale-110 shadow-sm' : 'bg-slate-50 hover:bg-green-50 hover:scale-105'
                }`}>
                {e}
              </button>
            ))}
          </div>

          {/* Name & description */}
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name (e.g. Goa Trip 2024)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-gray-900 placeholder-gray-300 font-semibold"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-gray-600 placeholder-gray-300 text-sm"
            />
          </div>
        </div>

        {/* Members card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-green-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</span>
            </div>
            <button type="button" onClick={addMember}
              className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
              <Plus size={13} /> Add
            </button>
          </div>

          <div className="space-y-2.5">
            {members.map((m, i) => (
              <div key={i} className="flex gap-2 items-center animate-slide-up">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: `hsl(${(i * 36) % 360},65%,55%)` }}>
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={m}
                  onChange={(e) => updateMember(i, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && i === members.length - 1 && addMember()}
                  placeholder={`Member ${i + 1} name`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 text-sm text-gray-900 placeholder-gray-300"
                />
                {members.length > 2 && (
                  <button type="button" onClick={() => removeMember(i)}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded-xl hover:bg-red-50 transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3">💡 Press Enter to quickly add more members</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
            <X size={14} /> {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4">
          Create Group <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};
