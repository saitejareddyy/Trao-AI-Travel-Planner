import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import CreateTripForm from '../components/CreateTripForm';
import ItineraryCard from '../components/ItineraryCard';
import PackingList from '../components/PackingList';
import { 
  LogOut, Plus, Trash2, Loader2, Sparkles, Compass, 
  MapPin, DollarSign, Hotel as HotelIcon, Landmark, Star, AlertCircle
} from 'lucide-react';

export default function Dashboard({ onSignOut }) {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
  const [regeneratingDayNum, setRegeneratingDayNum] = useState(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Read cached user info
    try {
      const cached = localStorage.getItem('user');
      if (cached) {
        const u = JSON.parse(cached);
        setUserEmail(u.email || '');
      }
    } catch (_) {}

    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await api.getTrips();
      setTrips(list);
      if (list.length > 0) {
        setSelectedTrip(list[0]);
      } else {
        setSelectedTrip(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to retrieve your itineraries.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async (formData) => {
    setIsGenerating(true);
    setError(null);
    try {
      const newTrip = await api.generateTrip(formData);
      setTrips((prev) => [newTrip, ...prev]);
      setSelectedTrip(newTrip);
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'AI generation encountered an error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip itinerary?')) return;
    
    try {
      await api.deleteTrip(id);
      const remaining = trips.filter((t) => t._id !== id);
      setTrips(remaining);
      if (selectedTrip?._id === id) {
        setSelectedTrip(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete trip: ' + err.message);
    }
  };

  const handleUpdateTrip = (updatedTrip) => {
    setTrips((prev) => prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t)));
    setSelectedTrip(updatedTrip);
  };

  const handleTogglePackingItem = async (itemId) => {
    if (!selectedTrip) return;

    const updatedPacking = selectedTrip.packingList.map((item) => {
      if (item._id === itemId) {
        return { ...item, isPacked: !item.isPacked };
      }
      return item;
    });

    // Optimistic UI update
    const prevTrip = { ...selectedTrip };
    const optimisticTrip = { ...selectedTrip, packingList: updatedPacking };
    setSelectedTrip(optimisticTrip);

    try {
      const data = await api.updateTrip(selectedTrip._id, { packingList: updatedPacking });
      handleUpdateTrip(data);
    } catch (err) {
      console.error('Failed to toggle item:', err);
      // Rollback
      setSelectedTrip(prevTrip);
    }
  };

  const handleRegenerateDay = async (dayNumber, feedback) => {
    if (!selectedTrip) return;
    setIsRegeneratingDay(true);
    setRegeneratingDayNum(dayNumber);
    setError(null);

    try {
      const data = await api.regenerateDay(selectedTrip._id, dayNumber, feedback);
      handleUpdateTrip(data);
    } catch (err) {
      console.error(err);
      setError(err.message || `Failed to regenerate Day ${dayNumber}. Please check your key or try again.`);
    } finally {
      setIsRegeneratingDay(false);
      setRegeneratingDayNum(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Header Panel */}
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-5 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Trao AI Workspace
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Connected Vault • {userEmail}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 transition text-slate-300 hover:text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Panel: Saved Trips & Budgets */}
        <div className="space-y-6">
          {/* Active Trips list */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Active Trips</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Create New Trip"
              >
                <Plus className="w-4 h-4" />
                New Trip
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                <p className="text-xs text-slate-500">Querying trip vault...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/40">
                <p className="text-xs text-slate-500 font-medium">No travel plans saved yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {trips.map((trip) => (
                  <div
                    key={trip._id}
                    onClick={() => {
                      setSelectedTrip(trip);
                      setShowCreateForm(false);
                    }}
                    className={`w-full p-4 rounded-2xl transition cursor-pointer flex justify-between items-center border ${
                      selectedTrip?._id === trip._id
                        ? 'bg-blue-600/15 border-blue-500/50 text-blue-400 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-950/60 border-slate-900 text-slate-350 hover:bg-slate-900/60 hover:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <p className="font-bold text-sm text-slate-200 truncate">{trip.destination}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {trip.durationDays} Days • {trip.budgetTier} Budget
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrip(trip._id);
                      }}
                      className="text-slate-650 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/40 shrink-0 transition cursor-pointer"
                      title="Delete trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial cost ledger card */}
          {selectedTrip && !showCreateForm && (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full filter blur-2xl -z-10" />
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-indigo-400" />
                Financial Cost Ledger
              </h2>
              <div className="space-y-3.5 bg-slate-950 border border-slate-900/60 p-4.5 rounded-2xl">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Accommodation:</span>
                  <span className="text-slate-300 font-mono font-bold">${selectedTrip.estimatedBudget.accommodation}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Culinary & Food:</span>
                  <span className="text-slate-300 font-mono font-bold">${selectedTrip.estimatedBudget.food}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Transport:</span>
                  <span className="text-slate-300 font-mono font-bold">${selectedTrip.estimatedBudget.transport}</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Activities & Events:</span>
                  <span className="text-slate-300 font-mono font-bold">${selectedTrip.estimatedBudget.activities}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-800/80 pt-3 text-slate-100 font-bold">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Grand Total:
                  </span>
                  <span className="text-emerald-400 font-mono text-base">${selectedTrip.estimatedBudget.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hotel Suggestions list */}
          {selectedTrip && !showCreateForm && selectedTrip.hotels && selectedTrip.hotels.length > 0 && (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <HotelIcon className="w-4 h-4 text-indigo-400" />
                Hotel Suggestions
              </h2>
              <div className="space-y-3">
                {selectedTrip.hotels.map((hotel, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-900/60 p-3.5 rounded-2xl flex flex-col gap-1 hover:border-slate-800 transition">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">{hotel.name}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-850 font-mono text-indigo-400 shrink-0 uppercase tracking-wider">
                        {hotel.tier}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-semibold">
                      <span className="flex items-center gap-0.5 font-mono">
                        <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                        {hotel.estimatedCostNightUSD} / night
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                        <Star className="w-3 h-3 fill-amber-400 shrink-0" />
                        {hotel.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Work Area Board */}
        <div className="lg:col-span-2 space-y-6">
          {showCreateForm ? (
            <CreateTripForm onSubmit={handleCreateTrip} isLoading={isGenerating} />
          ) : selectedTrip ? (
            <>
              {/* Trip Metadata Header */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full filter blur-3xl -z-10" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Travel Destination</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">{selectedTrip.destination}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTrip.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] uppercase bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg text-slate-400 font-mono font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Day-by-Day itinerary list */}
              <ItineraryCard
                trip={selectedTrip}
                onUpdateTrip={handleUpdateTrip}
                onRegenerateDay={handleRegenerateDay}
                isRegeneratingDay={isRegeneratingDay}
                regeneratingDayNum={regeneratingDayNum}
              />

              {/* Weather-Aware checklist panel */}
              <PackingList trip={selectedTrip} onToggleItem={handleTogglePackingItem} />
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-96 border border-slate-850/60 rounded-3xl bg-slate-900/10">
              <span className="text-6xl mb-4 animate-bounce">✈️</span>
              <h3 className="font-extrabold text-lg mb-1 text-slate-200">Start Planning Your Next Adventure</h3>
              <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
                Choose an itinerary from the sidebar or click "New Trip" to consult the AI Travel agent.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                Generate Custom Itinerary
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
