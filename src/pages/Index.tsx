import AddSpotModal from "@/components/AddSpotModal";
import Header from "@/components/Header";
import SpotCounter from "@/components/SpotCounter";
import SpotMap from "@/components/SpotMap";
import SpotPanel from "@/components/SpotPanel";
import { sampleSpots } from "@/data/sampleSpots";
import { addSpot, loadSpots, updateSpot } from "@/lib/spotStorage";
import { supabase } from "@/lib/supabase";
import { BiryaniSpot } from "@/types/spot";
import { MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Sanitize like/dislike counts
function sanitizeCount(value: any): number {
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 99999) {
    return 0;
  }
  return Math.floor(num);
}

const Index = () => {
  const [spots, setSpots] = useState<BiryaniSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMode, setIsAddMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [userVotes, setUserVotes] = useState<{
    [spotId: string]: "like" | "dislike";
  }>({});
  const [mapCenter, setMapCenter] = useState<
    | {
        lat: number;
        lng: number;
      }
    | undefined
  >(undefined);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  // Load user votes from localStorage
  useEffect(() => {
    const savedVotes = localStorage.getItem("userVotes");
    if (savedVotes) {
      try {
        setUserVotes(JSON.parse(savedVotes));
      } catch (e) {
        console.error("Failed to parse user votes:", e);
      }
    }
  }, []);

  // Load spots from Supabase on mount
  useEffect(() => {
    async function fetchSpots() {
      const loaded = await loadSpots();
      const data = loaded ?? sampleSpots;
      setSpots(data); // Show all spots, not just today's
      setLoading(false);
    }
    fetchSpots();
  }, []);

  // Real-time subscription for new spots
  useEffect(() => {
    const channel = supabase
      .channel("biryani_spots_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "biryani_spots",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSpot = {
              ...payload.new,
              createdAt: new Date(payload.new.createdAt),
              likes: sanitizeCount(payload.new.likes),
              dislikes: sanitizeCount(payload.new.dislikes),
            } as BiryaniSpot;

            setSpots((prev) => {
              // Check if spot already exists (avoid duplicates)
              if (prev.some((s) => s.id === newSpot.id)) return prev;
              return [newSpot, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedSpot = {
              ...payload.new,
              createdAt: new Date(payload.new.createdAt),
              likes: sanitizeCount(payload.new.likes),
              dislikes: sanitizeCount(payload.new.dislikes),
            } as BiryaniSpot;

            setSpots((prev) =>
              prev.map((s) => (s.id === updatedSpot.id ? updatedSpot : s)),
            );
          } else if (payload.eventType === "DELETE") {
            setSpots((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredSpots = useMemo(() => {
    if (!searchQuery.trim()) return spots;
    const q = searchQuery.toLowerCase();
    return spots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q),
    );
  }, [spots, searchQuery]);

  const activeCount = filteredSpots.filter((s) => s.isActive).length;

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleRequestMapPick = () => {
    // Close modal, enable map pick mode
    setShowAddModal(false);
    setIsAddMode(true);
    setNewMarkerPos(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddMode) {
      setNewMarkerPos({ lat, lng });
      // Reopen modal with selected position
      setIsAddMode(false);
      setShowAddModal(true);
    }
  };

  const handleAddSpot = async (spot: Omit<BiryaniSpot, "id" | "createdAt">) => {
    const newSpot = await addSpot(spot);

    if (newSpot) {
      // Update local state immediately for better UX
      setSpots((prev) => {
        if (prev.some((s) => s.id === newSpot.id)) return prev;
        return [newSpot, ...prev];
      });
      setIsPanelExpanded(true); // Auto-expand panel to show the new spot
    }

    setIsAddMode(false);
    setNewMarkerPos(null);
  };

  const handleLike = async (id: string) => {
    const spot = spots.find((s) => s.id === id);
    if (!spot) return;

    // Check if user already voted on this spot
    const existingVote = userVotes[id];

    // Ensure current values are valid
    const currentLikes = sanitizeCount(spot.likes);
    const currentDislikes = sanitizeCount(spot.dislikes);

    let newLikes = currentLikes;
    let newDislikes = currentDislikes;

    if (existingVote === "like") {
      // User already liked, so unlike
      newLikes = Math.max(0, currentLikes - 1);
      const updatedVotes = { ...userVotes };
      delete updatedVotes[id];
      setUserVotes(updatedVotes);
      localStorage.setItem("userVotes", JSON.stringify(updatedVotes));
    } else if (existingVote === "dislike") {
      // User disliked before, switch to like
      newLikes = Math.min(99999, currentLikes + 1);
      newDislikes = Math.max(0, currentDislikes - 1);
      const updatedVotes = { ...userVotes, [id]: "like" as const };
      setUserVotes(updatedVotes);
      localStorage.setItem("userVotes", JSON.stringify(updatedVotes));
    } else {
      // New like
      newLikes = Math.min(99999, currentLikes + 1);
      const updatedVotes = { ...userVotes, [id]: "like" as const };
      setUserVotes(updatedVotes);
      localStorage.setItem("userVotes", JSON.stringify(updatedVotes));
    }

    // Optimistic update
    setSpots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, likes: newLikes, dislikes: newDislikes } : s,
      ),
    );

    // Update in Supabase
    await updateSpot(id, { likes: newLikes, dislikes: newDislikes });
  };

  const handleDislike = async (id: string) => {
    const spot = spots.find((s) => s.id === id);
    if (!spot) return;

    // Check if user already voted on this spot
    const existingVote = userVotes[id];

    // Ensure current values are valid
    const currentLikes = sanitizeCount(spot.likes);
    const currentDislikes = sanitizeCount(spot.dislikes);

    let newLikes = currentLikes;
    let newDislikes = currentDislikes;

    if (existingVote === "dislike") {
      // User already disliked, so undislike
      newDislikes = Math.max(0, currentDislikes - 1);
      const updatedVotes = { ...userVotes };
      delete updatedVotes[id];
      setUserVotes(updatedVotes);
      localStorage.setItem("userVotes", JSON.stringify(updatedVotes));
    } else if (existingVote === "like") {
      // User liked before, switch to dislike
      newDislikes = Math.min(99999, currentDislikes + 1);
      newLikes = Math.max(0, currentLikes - 1);
      const updatedVotes = { ...userVotes, [id]: "dislike" as const };
      setUserVotes(updatedVotes);
      localStorage.setItem("userVotes", JSON.stringify(updatedVotes));
    } else {
      // New dislike
      newDislikes = Math.min(99999, currentDislikes + 1);
      const updatedVotes = { ...userVotes, [id]: "dislike" as const };
      setUserVotes(updatedVotes);
      localStorage.setItem("userVotes", JSON.stringify(updatedVotes));
    }

    // Optimistic update
    setSpots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, likes: newLikes, dislikes: newDislikes } : s,
      ),
    );

    // Update in Supabase
    await updateSpot(id, { likes: newLikes, dislikes: newDislikes });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setIsAddMode(false);
    setNewMarkerPos(null);
  };

  const handleCancelMapPick = () => {
    setIsAddMode(false);
    setShowAddModal(true);
  };

  const handleSpotClick = (spot: BiryaniSpot) => {
    setMapCenter({ lat: spot.lat, lng: spot.lng });
    setSelectedSpotId(spot.id);
    // Auto-clear selection after 3 seconds
    setTimeout(() => setSelectedSpotId(null), 3000);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCount={activeCount}
      />

      <div className="relative flex-1">
        {/* Map pick banner */}
        {isAddMode && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-foreground/80 backdrop-blur-md px-5 py-3 shadow-2xl">
            <MapPin className="h-5 w-5 text-destructive shrink-0" />
            <span className="text-sm font-semibold text-background">
              ম্যাপের যেকোনো জায়গায় ট্যাপ করুন
            </span>
          </div>
        )}

        {/* Cancel button during map pick */}
        {isAddMode && (
          <button
            onClick={handleCancelMapPick}
            className="absolute top-3 right-3 z-20 rounded-full bg-card px-4 py-2 text-xs font-semibold shadow-lg border hover:bg-muted transition-colors"
          >
            বাতিল ✕
          </button>
        )}

        <SpotCounter count={activeCount} spots={filteredSpots} />

        <SpotMap
          spots={filteredSpots}
          onMapClick={handleMapClick}
          isAddMode={isAddMode}
          newMarkerPos={newMarkerPos}
          center={mapCenter}
          onLike={handleLike}
          onDislike={handleDislike}
          userVotes={userVotes}
        />

        <SpotPanel
          spots={filteredSpots}
          onAddClick={handleAddClick}
          onLike={handleLike}
          onDislike={handleDislike}
          expanded={isPanelExpanded}
          onToggleExpand={() => setIsPanelExpanded(!isPanelExpanded)}
          userVotes={userVotes}
          onSpotClick={handleSpotClick}
          selectedSpotId={selectedSpotId}
        />
      </div>

      <AddSpotModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onAdd={handleAddSpot}
        selectedPosition={newMarkerPos}
        onRequestMapPick={handleRequestMapPick}
      />
    </div>
  );
};

export default Index;
