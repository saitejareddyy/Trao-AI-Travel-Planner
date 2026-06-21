import React, { useState } from 'react';
import { Compass, Calendar, DollarSign, Heart, Sun, Loader2 } from 'lucide-react';

const INTEREST_OPTIONS = [
  { id: 'Food', label: '🍜 Food & Culinary' },
  { id: 'Culture', label: '⛩️ Culture & Heritage' },
  { id: 'Adventure', label: '🌋 Adventure & Sports' },
  { id: 'Shopping', label: '🛍️ Shopping & Fashion' },
  { id: 'Relaxation', label: '🌴 Relaxation & Wellness' },
  { id: 'Nature', label: '🏕️ Nature & Outdoors' },
  { id: 'History', label: '🏛️ History & Museums' },
  { id: 'Nightlife', label: '✨ Nightlife & Clubs' }
];

const SEASON_OPTIONS = [
  { value: 'Spring', label: '🌸 Spring' },
  { value: 'Summer', label: '☀️ Summer' },
  { value: 'Autumn', label: '🍁 Autumn' },
  { value: 'Winter', label: '❄️ Winter' }
];

export default function CreateTripForm({ onSubmit, isLoading }) {
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetTier, setBudgetTier] = useState('Medium');
  const [interests, setInterests] = useState([]);
  const [season, setSeason] = useState('Spring');

  const handleInterestToggle = (id) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination.trim() || durationDays < 1) return;
    onSubmit({
      destination,
      durationDays,
      budgetTier,
      interests,
      season
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Visual Accent Gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full filter blur-3xl -z-10" />

      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
        <Compass className="w-5 h-5 text-blue-400 animate-spin-slow" />
        Configure New Itinerary
      </h3>

      <div className="space-y-4">
        {/* Destination */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Destination</label>
          <div className="relative">
            <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              disabled={isLoading}
              placeholder="e.g., Tokyo, Kyoto, Paris, Iceland..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Duration (Days)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                min="1"
                max="14"
                required
                disabled={isLoading}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Season / Period</label>
            <div className="relative">
              <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                disabled={isLoading}
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 outline-none appearance-none cursor-pointer transition focus:ring-1 focus:ring-indigo-500"
              >
                {SEASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budget Tier */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Budget Level</label>
          <div className="grid grid-cols-3 gap-3">
            {['Low', 'Medium', 'High'].map((tier) => (
              <button
                key={tier}
                type="button"
                disabled={isLoading}
                onClick={() => setBudgetTier(tier)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  budgetTier === tier
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 ring-1 ring-blue-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex">
                  {tier === 'Low' && <DollarSign className="w-4 h-4" />}
                  {tier === 'Medium' && (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <DollarSign className="w-4 h-4 -ml-1.5" />
                    </>
                  )}
                  {tier === 'High' && (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <DollarSign className="w-4 h-4 -ml-1.5" />
                      <DollarSign className="w-4 h-4 -ml-1.5" />
                    </>
                  )}
                </div>
                <span className="text-xs">{tier}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Interests & Preferences
          </label>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleInterestToggle(interest.id)}
                  className={`py-2 px-3 rounded-lg border text-left text-xs font-medium transition cursor-pointer ${
                    selected
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !destination.trim()}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Consulting AI Agent...
          </>
        ) : (
          'Generate Custom Itinerary'
        )}
      </button>
    </form>
  );
}
