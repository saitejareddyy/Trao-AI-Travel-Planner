import React, { useState } from 'react';
import { Trash2, Plus, Sparkles, Clock, DollarSign, Loader2 } from 'lucide-react';

export default function ItineraryCard({
  trip,
  onUpdateTrip,
  onRegenerateDay,
  isRegeneratingDay,
  regeneratingDayNum
}) {
  const [newActivityTitles, setNewActivityTitles] = useState({});
  const [newActivityTimes, setNewActivityTimes] = useState({});
  const [regeneratePrompts, setRegeneratePrompts] = useState({});

  const handleAddActivity = async (dayNumber) => {
    const title = newActivityTitles[dayNumber]?.trim();
    if (!title) return;

    const timeOfDay = newActivityTimes[dayNumber] || 'Afternoon';

    const newActivity = {
      title,
      description: 'Added manually by traveler',
      estimatedCostUSD: 0,
      timeOfDay
    };

    const updatedItinerary = trip.itinerary.map((day) => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          activities: [...day.activities, newActivity]
        };
      }
      return day;
    });

    let totalActivitiesCost = 0;
    updatedItinerary.forEach((d) => {
      d.activities.forEach((act) => {
        totalActivitiesCost += act.estimatedCostUSD || 0;
      });
    });

    const updatedTrip = {
      ...trip,
      itinerary: updatedItinerary,
      estimatedBudget: {
        ...trip.estimatedBudget,
        activities: totalActivitiesCost,
        total: 
          trip.estimatedBudget.accommodation +
          trip.estimatedBudget.food +
          trip.estimatedBudget.transport +
          totalActivitiesCost
      }
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trao-ai-travel-planner-backend-ft4i.onrender.com'}/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itinerary: updatedItinerary,
          estimatedBudget: updatedTrip.estimatedBudget
        })
      });

      if (res.ok) {
        const saved = await res.json();
        onUpdateTrip(saved);
        setNewActivityTitles((prev) => ({ ...prev, [dayNumber]: '' }));
      }
    } catch (err) {
      console.error('Failed to add activity:', err);
    }
  };

  const handleRemoveActivity = async (dayNumber, activityIndex) => {
    const dayToEdit = trip.itinerary.find((d) => d.dayNumber === dayNumber);
    if (!dayToEdit) return;

    const updatedActivities = dayToEdit.activities.filter((_, idx) => idx !== activityIndex);

    const updatedItinerary = trip.itinerary.map((day) => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          activities: updatedActivities
        };
      }
      return day;
    });

    let totalActivitiesCost = 0;
    updatedItinerary.forEach((d) => {
      d.activities.forEach((act) => {
        totalActivitiesCost += act.estimatedCostUSD || 0;
      });
    });

    const updatedTrip = {
      ...trip,
      itinerary: updatedItinerary,
      estimatedBudget: {
        ...trip.estimatedBudget,
        activities: totalActivitiesCost,
        total: 
          trip.estimatedBudget.accommodation +
          trip.estimatedBudget.food +
          trip.estimatedBudget.transport +
          totalActivitiesCost
      }
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://trao-ai-travel-planner-backend-ft4i.onrender.com'}/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itinerary: updatedItinerary,
          estimatedBudget: updatedTrip.estimatedBudget
        })
      });

      if (res.ok) {
        const saved = await res.json();
        onUpdateTrip(saved);
      }
    } catch (err) {
      console.error('Failed to remove activity:', err);
    }
  };

  const triggerRegenerateDay = (dayNumber) => {
    const feedback = regeneratePrompts[dayNumber]?.trim();
    if (!feedback) return;
    onRegenerateDay(dayNumber, feedback);
    setRegeneratePrompts((prev) => ({ ...prev, [dayNumber]: '' }));
  };

  return (
    <div className="space-y-8">
      {trip.itinerary.map((day) => (
        <div key={day.dayNumber} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 relative">
          <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-mono">
                Day {day.dayNumber}
              </span>
              Schedule Plan
            </h3>
          </div>

          {/* Activities List */}
          <div className="space-y-4 mb-6">
            {day.activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No scheduled activities for this day.</p>
            ) : (
              day.activities.map((act, index) => (
                <div key={index} className="group bg-slate-950/60 hover:bg-slate-900 border border-slate-905 hover:border-slate-800/80 p-4 rounded-xl transition flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200">{act.title}</span>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        act.timeOfDay === 'Morning' 
                          ? 'bg-amber-600/10 text-amber-400 border border-amber-500/10'
                          : act.timeOfDay === 'Afternoon'
                          ? 'bg-sky-600/10 text-sky-400 border border-sky-500/10'
                          : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {act.timeOfDay}
                      </span>
                      {act.estimatedCostUSD > 0 && (
                        <span className="text-[10px] font-mono bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <DollarSign className="w-2.5 h-2.5" />
                          {act.estimatedCostUSD}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveActivity(day.dayNumber, index)}
                    className="text-slate-650 hover:text-rose-450 p-1.5 rounded-lg hover:bg-slate-800/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition cursor-pointer"
                    title="Delete activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-850">
            {/* Inline Add Activity Form */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add Custom Activity</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Activity title..."
                  value={newActivityTitles[day.dayNumber] || ''}
                  onChange={(e) => setNewActivityTitles((prev) => ({ ...prev, [day.dayNumber]: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none w-full placeholder-slate-650"
                />
                <select
                  value={newActivityTimes[day.dayNumber] || 'Afternoon'}
                  onChange={(e) => setNewActivityTimes((prev) => ({ ...prev, [day.dayNumber]: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-2 py-2 text-xs text-slate-350 outline-none cursor-pointer"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
                <button
                  onClick={() => handleAddActivity(day.dayNumber)}
                  disabled={!newActivityTitles[day.dayNumber]?.trim()}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-750 hover:border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>

            {/* AI Day-level Regeneration Prompt */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                Regenerate Day with AI Instruction
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Change to chill outdoor events..."
                  value={regeneratePrompts[day.dayNumber] || ''}
                  onChange={(e) => setRegeneratePrompts((prev) => ({ ...prev, [day.dayNumber]: e.target.value }))}
                  disabled={isRegeneratingDay}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none w-full placeholder-slate-650 disabled:opacity-50"
                />
                <button
                  onClick={() => triggerRegenerateDay(day.dayNumber)}
                  disabled={isRegeneratingDay || !regeneratePrompts[day.dayNumber]?.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isRegeneratingDay && regeneratingDayNum === day.dayNumber ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Regen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
