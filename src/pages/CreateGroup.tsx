import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ChevronRight, Users } from 'lucide-react';
import { useStore } from '../store';

const GROUP_EMOJIS = ['✈️', '🏖️', '🏔️', '🎉', '🍕', '🏕️', '🎭', '🚀', '💼', '🎓'];

export const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const createGroup = useStore((s) => s.createGroup);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [members, setMembers] = useState<string[]>(['', '']);
  const [error, setError] = useState('');

  const addMemberField = () => setMembers([...members, '']);
  const removeMemberField = (i: number) => {
    if (members.length <= 2) return;
    setMembers(members.filter((_, idx) => idx !== i));
  };
  const updateMember = (i: number, val: string) => {
    const next = [...members];
    next[i] = val;
    setMembers(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    const validMembers = members.map((m) => m.trim()).filter(Boolean);
    if (validMembers.length < 2) {
      setError('Add at least 2 members');
      return;
    }
    const unique = new Set(validMembers.map((m) => m.toLowerCase()));
    if (unique.size !== validMembers.length) {
      setError('Member names must be unique');
      return;
    }
    const groupId = createGroup(name.trim(), description.trim(), emoji, validMembers);
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a Group</h1>
        <p className="text-gray-500 mt-1">Set up your trip or event expense group</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emoji selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Pick an Icon</label>
          <div className="flex flex-wrap gap-3">
            {GROUP_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all ${
                  emoji === e
                    ? 'bg-green-100 ring-2 ring-green-500 scale-110'
                    : 'bg-gray-50 hover:bg-green-50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Group details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip 2024"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-green-600" />
              <label className="text-sm font-semibold text-gray-700">Members</label>
            </div>
            <button
              type="button"
              onClick={addMemberField}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          <div className="space-y-3">
            {members.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <input
                  type="text"
                  value={m}
                  onChange={(e) => updateMember(i, e.target.value)}
                  placeholder={`Member ${i + 1} name`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 placeholder-gray-400"
                />
                {members.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeMemberField(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg transition-colors shadow-md"
        >
          Create Group <ChevronRight size={20} />
        </button>
      </form>
    </div>
  );
};
