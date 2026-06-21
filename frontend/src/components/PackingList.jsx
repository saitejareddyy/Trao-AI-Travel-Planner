import React from 'react';
import { CheckSquare, Square, FileText, Shirt, Backpack, Compass, CheckCircle } from 'lucide-react';

export default function PackingList({ trip, onToggleItem }) {
  const items = trip.packingList || [];

  // Group items by category
  const categories = {
    Documents: items.filter((i) => i.category === 'Documents'),
    Clothing: items.filter((i) => i.category === 'Clothing'),
    Gear: items.filter((i) => i.category === 'Gear'),
    Other: items.filter((i) => i.category === 'Other')
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Documents':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'Clothing':
        return <Shirt className="w-4 h-4 text-amber-400" />;
      case 'Gear':
        return <Backpack className="w-4 h-4 text-emerald-400" />;
      default:
        return <Compass className="w-4 h-4 text-indigo-400" />;
    }
  };

  const packedCount = items.filter((i) => i.isPacked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full filter blur-3xl -z-10" />

      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          ⛈️ Weather-Aware Packing Assistant
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Custom gear & outfits curated for **{trip.destination}** based on planned activities.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Packing Progress
          </span>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            {packedCount} / {totalCount} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-6">
        {Object.keys(categories).map((catName) => {
          const list = categories[catName];
          if (list.length === 0) return null;

          return (
            <div key={catName} className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-850 pb-1">
                {getCategoryIcon(catName)}
                {catName}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {list.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => onToggleItem(item._id)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-900/60 hover:border-slate-850 text-left transition group cursor-pointer"
                  >
                    {item.isPacked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-650 group-hover:text-slate-500 shrink-0" />
                    )}
                    <span className={`text-xs transition-all ${
                      item.isPacked 
                        ? 'line-through text-slate-500 font-medium' 
                        : 'text-slate-300 font-medium'
                    }`}>
                      {item.item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
