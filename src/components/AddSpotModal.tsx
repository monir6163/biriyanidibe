import { BiryaniSpot } from "@/types/spot";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (spot: Omit<BiryaniSpot, "id" | "createdAt">) => void;
  selectedPosition: { lat: number; lng: number } | null;
  onRequestMapPick: () => void;
}

const foodTypes = [
  "কাচ্চি বিরিয়ানি",
  "তেহারি",
  "মোরগ পোলাও",
  "খিচুড়ি",
  "অন্যান্য",
];

const AddSpotModal = ({
  isOpen,
  onClose,
  onAdd,
  selectedPosition,
  onRequestMapPick,
}: AddSpotModalProps) => {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [foodType, setFoodType] = useState(foodTypes[0]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locMode, setLocMode] = useState<"gps" | "map" | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{
      display_name: string;
      lat: string;
      lon: string;
      type: string;
    }>
  >([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  if (!isOpen) return null;

  const effectiveLat = selectedPosition?.lat ?? (lat ? parseFloat(lat) : NaN);
  const effectiveLng = selectedPosition?.lng ?? (lng ? parseFloat(lng) : NaN);
  const hasLocation = !isNaN(effectiveLat) && !isNaN(effectiveLng);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("আপনার ডিভাইস GPS সাপোর্ট করে না");
      return;
    }

    setGpsLoading(true);
    setGpsError("");
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
        setLocationSuccess(true);
        setGpsError("");
        // Auto-hide success after 3 seconds
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (error) => {
        setGpsLoading(false);
        setLocationSuccess(false);
        let errorMsg = "লোকেশন পাওয়া যায়নি";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "লোকেশন পারমিশন দিন";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "লোকেশন খুঁজে পাওয়া যাচ্ছে না";
            break;
          case error.TIMEOUT:
            errorMsg = "সময় শেষ, আবার চেষ্টা করুন";
            break;
        }

        setGpsError(errorMsg);
        setTimeout(() => setGpsError(""), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleLocationSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setGpsError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Bangladesh",
        )}&limit=5&countrycodes=bd`,
        {
          headers: {
            "Accept-Language": "bn,en",
          },
        },
      );

      if (!response.ok) throw new Error("Search failed");

      const results = await response.json();

      if (results.length === 0) {
        setGpsError("কোনো জায়গা পাওয়া যায়নি। আবার চেষ্টা করুন");
        setTimeout(() => setGpsError(""), 4000);
      } else {
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error) {
      setGpsError("সার্চ করতে সমস্যা হয়েছে। ইন্টারনেট চেক করুন");
      setTimeout(() => setGpsError(""), 4000);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    setLat(parseFloat(result.lat).toFixed(6));
    setLng(parseFloat(result.lon).toFixed(6));
    setLocMode("map");
    setLocationSuccess(true);
    setShowSearchResults(false);
    setSearchQuery("");
    setTimeout(() => setLocationSuccess(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hasLocation) return;

    onAdd({
      name: name.trim(),
      address: area.trim(),
      description: foodType,
      addedBy: "বেনামী",
      lat: effectiveLat,
      lng: effectiveLng,
      isActive: true,
      rating: undefined,
      likes: 0,
      dislikes: 0,
    });

    setName("");
    setArea("");
    setFoodType(foodTypes[0]);
    setLat("");
    setLng("");
    setLocMode(null);
    setGpsError("");
    setLocationSuccess(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    onClose();

    // instantly show added spot
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Orange gradient header */}
        <div className="relative bg-gradient-to-r from-accent to-[hsl(35,100%,55%)] px-5 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-accent-foreground flex items-center gap-2">
            🍛 বিরিয়ানি স্পট যোগ করুন
          </h2>
          <p className="text-xs text-accent-foreground/80 mt-0.5">
            উমাহকে ইফতার খুঁজে পেতে সাহায্য করুন!
          </p>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-1.5 text-accent-foreground/80 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 grid gap-4 overflow-y-auto flex-1"
        >
          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-foreground">
              মসজিদের নাম <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: সোবহানবাগ জামে মসজিদ"
              required
              maxLength={100}
              className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          {/* Area */}
          <div>
            <label className="text-sm font-semibold text-foreground">
              এলাকা / মহল্লা <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="যেমন: ধানমন্ডি, মিরপুর, গুলশান"
              required
              maxLength={100}
              className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          {/* Food Type */}
          <div>
            <label className="text-sm font-semibold text-foreground">
              খাবারের ধরন <span className="text-destructive">*</span>
            </label>
            <div className="relative mt-1">
              <select
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                className="w-full appearance-none rounded-xl border bg-background px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
              >
                {foodTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ▾
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              লোকেশন <span className="text-destructive">*</span>
            </label>
            {/* Location Mode Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocMode("gps");
                  handleGPS();
                }}
                disabled={gpsLoading}
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-medium transition-all ${
                  locMode === "gps" && hasLocation
                    ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20"
                    : gpsLoading
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5"
                } disabled:cursor-not-allowed`}
              >
                {gpsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : locationSuccess && locMode === "gps" ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Navigation
                    className={`h-6 w-6 transition-transform group-hover:scale-110 ${
                      locMode === "gps" && hasLocation ? "text-primary" : ""
                    }`}
                  />
                )}
                <span className="font-semibold">
                  {gpsLoading ? "খুঁজছি..." : "আমার লোকেশন"}
                </span>
                {locMode === "gps" && hasLocation && !gpsLoading && (
                  <span className="text-xs text-primary/70">সংযুক্ত ✓</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocMode("map");
                  setLocationSuccess(false);
                  onRequestMapPick();
                }}
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-medium transition-all ${
                  locMode === "map" && selectedPosition
                    ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20"
                    : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                {selectedPosition ? (
                  <MapPinned className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                ) : (
                  <MapPin className="h-6 w-6 transition-transform group-hover:scale-110" />
                )}
                <span className="font-semibold">ম্যাপ থেকে</span>
                {locMode === "map" && selectedPosition && (
                  <span className="text-xs text-primary/70">নির্বাচিত ✓</span>
                )}
              </button>
            </div>
            <div className="flex items-center justify-center mt-2">
              <p className="text-xs text-muted-foreground mt-2">OR</p>
            </div>
            {/* Location Search */}
            <div className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLocationSearch();
                    }
                  }}
                  placeholder="🔍 জায়গার নাম লিখুন (যেমন: ধানমন্ডি মসজিদ)"
                  className="w-full rounded-xl border bg-background pl-10 pr-20 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={handleLocationSearch}
                  disabled={!searchQuery.trim() || searchLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "খুঁজুন"
                  )}
                </button>
              </div>

              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="mt-2 rounded-xl border bg-card shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 flex items-start gap-2"
                    >
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {result.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Error Message */}
            {gpsError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive border border-destructive/20">
                <span className="text-lg">⚠️</span>
                <span>{gpsError}</span>
              </div>
            )}
            {/* Success Message */}
            {locationSuccess && !gpsError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2.5 text-sm text-green-600 border border-green-500/20">
                <CheckCircle2 className="h-4 w-4" />
                <span>লোকেশন সফলভাবে যুক্ত হয়েছে!</span>
              </div>
            )}
            {/* Coordinate Display */}
            {hasLocation && (
              <div className="mt-3 rounded-xl bg-muted/50 border border-border p-3">
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">অক্ষাংশ:</span>
                      <span className="font-mono font-medium text-foreground">
                        {effectiveLat.toFixed(6)}°
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">দ্রাঘিমাংশ:</span>
                      <span className="font-mono font-medium text-foreground">
                        {effectiveLng.toFixed(6)}°
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || !hasLocation}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-accent to-[hsl(35,100%,55%)] py-3.5 text-sm font-bold text-accent-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {!hasLocation && name.trim() ? (
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                প্রথমে লোকেশন যোগ করুন
              </span>
            ) : (
              "🍛 এই স্পটটি যোগ করুন!"
            )}
          </button>

          {/* Helper text */}
          {!hasLocation && (
            <p className="text-xs text-center text-muted-foreground -mt-2">
              লোকেশন যোগ করতে উপরের বাটন ব্যবহার করুন
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddSpotModal;
