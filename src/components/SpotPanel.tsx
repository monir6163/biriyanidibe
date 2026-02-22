import { BiryaniSpot } from "@/types/spot";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

interface SpotPanelProps {
  spots: BiryaniSpot[];
  onAddClick: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  userVotes: { [spotId: string]: "like" | "dislike" };
  onSpotClick?: (spot: BiryaniSpot) => void;
  selectedSpotId?: string | null;
  isLoading?: boolean;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function isOldSpot(createdAt: Date): boolean {
  const spotDate = new Date(createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  spotDate.setHours(0, 0, 0, 0);
  return spotDate < today;
}

function isNewSpot(createdAt: Date): boolean {
  const now = new Date();
  const spotDate = new Date(createdAt);
  const diffHours = (now.getTime() - spotDate.getTime()) / (1000 * 60 * 60);
  return diffHours <= 10; // Consider new if created within the last 10 hours
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const bengaliNumbers: { [key: string]: string } = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };

  const toBengaliNumber = (num: number): string => {
    return num
      .toString()
      .split("")
      .map((d) => bengaliNumbers[d] || d)
      .join("");
  };

  if (diffMins < 1) return "এখনই";
  if (diffMins < 60) return `${toBengaliNumber(diffMins)} মিনিট আগে`;
  if (diffHours < 24) return `${toBengaliNumber(diffHours)} ঘন্টা আগে`;
  if (diffDays === 1) return "গতকাল";
  if (diffDays < 7) return `${toBengaliNumber(diffDays)} দিন আগে`;
  return formatDate(date);
}

const SpotPanel = ({
  spots,
  onAddClick,
  onLike,
  onDislike,
  expanded,
  onToggleExpand,
  userVotes,
  onSpotClick,
  selectedSpotId,
  isLoading = false,
}: SpotPanelProps) => {
  // Show all spots, sorted by creation date (newest first)
  const allSpots = [...spots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const activeSpots = spots.filter((s) => s.isActive);
  const confirmedSpots = activeSpots.filter((s) => s.likes > 5);
  const todayActiveSpots = activeSpots.filter((s) => !isOldSpot(s.createdAt));

  interface SpotCounterProps {
    count: number;
    spots: BiryaniSpot[];
  }

  // Count locations with 5 or more total likes
  function countPopularLocations(spots: BiryaniSpot[]): number {
    const locationLikes = new Map<string, number>();

    spots.forEach((spot) => {
      const key = `${spot.lat.toFixed(4)},${spot.lng.toFixed(4)}`;
      const currentLikes = locationLikes.get(key) || 0;
      locationLikes.set(key, currentLikes + spot.likes);
    });

    let popularCount = 0;
    locationLikes.forEach((likes) => {
      if (likes >= 3) {
        popularCount++;
      }
    });

    return popularCount;
  }

  const popularLocations = countPopularLocations(spots);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-10 rounded-t-2xl bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 ${
        expanded
          ? "max-h-[75vh] sm:max-h-[60vh]"
          : "max-h-[30vh] sm:max-h-[30vh]"
      }`}
    >
      <div className="sticky top-0 bg-card rounded-t-2xl z-20 flex items-center justify-between px-2 sm:px-4 pt-3 pb-2 border-b border-border/50">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-sm font-bold text-foreground"
        >
          {/* <span>
            🍛 সক্রিয় স্পট
            {confirmedSpots.length > 0 && ` (নিশ্চিত=${popularLocations}টি)`}
          </span> */}
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
            {todayActiveSpots.length > 0
              ? `আজ ${todayActiveSpots.length}টি`
              : `মোট ${allSpots.length}টি`}
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={onAddClick}
          className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow transition-transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div
        className="overflow-y-auto overflow-x-hidden px-0 sm:px-4 pb-4 py-2"
        style={{
          maxHeight: expanded ? "calc(75vh - 7rem)" : "calc(50vh - 7rem)",
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                লোড হচ্ছে...
              </p>
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        ) : allSpots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <span className="text-3xl">🕌</span>
            <p className="text-sm">আজকে এখনো কোনো স্পট নেই</p>
            <button
              onClick={onAddClick}
              className="text-xs font-semibold text-primary hover:underline"
            >
              প্রথম স্পট যোগ করুন!
            </button>
          </div>
        ) : (
          <div className="grid gap-3 pb-16">
            {/* Group spots by new (today) vs old */}
            {(() => {
              const newSpots = allSpots.filter(
                (s) => !isOldSpot(s.createdAt) && s.isActive,
              );
              const oldSpots = allSpots.filter(
                (s) => isOldSpot(s.createdAt) || !s.isActive,
              );

              return (
                <>
                  {/* New/Today's Spots Section */}
                  {newSpots.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2 pt-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        <h3 className="text-xs font-bold text-primary flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          আজকের স্পট
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      </div>
                      {newSpots.map((spot, index) => {
                        const isSelected = selectedSpotId === spot.id;
                        const isNew = isNewSpot(spot.createdAt);
                        const isNewest = index === 0; // First item is the newest

                        return (
                          <div
                            key={spot.id}
                            onClick={() => onSpotClick?.(spot)}
                            className={`flex items-start sm:items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer relative overflow-hidden ${
                              isSelected
                                ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/50"
                                : isNew
                                  ? "bg-gradient-to-r from-primary/5 via-background to-primary/5 hover:from-primary/10 hover:to-primary/10 border-primary/30 shadow-md"
                                  : "bg-background hover:bg-muted"
                            } ${isNewest ? "animate-pulse-slow" : ""}`}
                            style={
                              isNewest
                                ? {
                                    animation:
                                      "pulse-glow 2s ease-in-out infinite",
                                  }
                                : {}
                            }
                          >
                            {/* Shimmer effect for newest spot */}
                            {isNewest && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent shimmer-animation" />
                            )}

                            <span className="text-2xl shrink-0 relative z-10">
                              🍛
                            </span>

                            <div className="flex-1 min-w-0 relative z-10">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">
                                  {spot.name}
                                </p>
                                {isNew && (
                                  <span className="text-[10px] bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1 shadow-sm animate-bounce-subtle">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    নতুন
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{spot.address}</span>
                              </div>
                              {spot.description && (
                                <div className="text-xs text-accent font-medium mt-0.5">
                                  🍽️ {spot.description}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{getTimeAgo(spot.createdAt)}</span>
                                </div>
                                <span className="text-muted-foreground/50">
                                  •
                                </span>
                                <span>{formatDate(spot.createdAt)}</span>
                              </div>

                              {/* Mobile: Like/Dislike buttons below date */}
                              <div className="flex items-center gap-1.5 mt-2 sm:hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLike(spot.id);
                                  }}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                    userVotes[spot.id] === "like"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "text-primary hover:bg-primary/10"
                                  }`}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  সত্যি {spot.likes}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDislike(spot.id);
                                  }}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                    userVotes[spot.id] === "dislike"
                                      ? "bg-destructive text-destructive-foreground border-destructive"
                                      : "text-destructive hover:bg-destructive/10"
                                  }`}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                  মিথ্যা {spot.dislikes}
                                </button>
                                <span className="pulse-dot shrink-0" />
                              </div>
                            </div>

                            {/* Desktop: Like/Dislike buttons on the right */}
                            <div className="hidden sm:flex items-center gap-1.5 shrink-0 relative z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLike(spot.id);
                                }}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                  userVotes[spot.id] === "like"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "text-primary hover:bg-primary/10"
                                }`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                সত্যি {spot.likes}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDislike(spot.id);
                                }}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                  userVotes[spot.id] === "dislike"
                                    ? "bg-destructive text-destructive-foreground border-destructive"
                                    : "text-destructive hover:bg-destructive/10"
                                }`}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                মিথ্যা {spot.dislikes}
                              </button>
                              <span className="pulse-dot shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Old/Inactive Spots Section */}
                  {oldSpots.length > 0 && (
                    <div className="space-y-2">
                      {newSpots.length > 0 && (
                        <div className="flex items-center gap-2 px-2 pt-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                          <h3 className="text-xs font-semibold text-muted-foreground">
                            পুরাতন স্পট
                          </h3>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                        </div>
                      )}
                      {oldSpots.map((spot) => {
                        const isOld = isOldSpot(spot.createdAt);
                        const isInactive = !spot.isActive;
                        const isSelected = selectedSpotId === spot.id;

                        return (
                          <div
                            key={spot.id}
                            onClick={() => onSpotClick?.(spot)}
                            className={`flex items-start sm:items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer opacity-60 ${
                              isSelected
                                ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/50"
                                : "bg-background hover:bg-muted"
                            }`}
                          >
                            <span className="text-2xl shrink-0">🍛</span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">
                                  {spot.name}
                                </p>
                                {isOld && (
                                  <span className="text-[10px] bg-red-700 text-yellow-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                                    ইফতার শেষ
                                  </span>
                                )}
                                {isInactive && !isOld && (
                                  <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium shrink-0">
                                    নিষ্ক্রিয়
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{spot.address}</span>
                              </div>
                              {spot.description && (
                                <div className="text-xs text-accent font-medium mt-0.5">
                                  🍽️ {spot.description}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{getTimeAgo(spot.createdAt)}</span>
                                </div>
                                <span className="text-muted-foreground/50">
                                  •
                                </span>
                                <span>{formatDate(spot.createdAt)}</span>
                              </div>

                              {/* Mobile: Like/Dislike buttons below date */}
                              <div className="flex items-center gap-1.5 mt-2 sm:hidden">
                                <button
                                  disabled={isOld || isInactive}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLike(spot.id);
                                  }}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    userVotes[spot.id] === "like"
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "text-primary hover:bg-primary/10"
                                  }`}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  সত্যি {spot.likes}
                                </button>
                                <button
                                  disabled={isOld || isInactive}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDislike(spot.id);
                                  }}
                                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    userVotes[spot.id] === "dislike"
                                      ? "bg-destructive text-destructive-foreground border-destructive"
                                      : "text-destructive hover:bg-destructive/10"
                                  }`}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                  মিথ্যা {spot.dislikes}
                                </button>
                                <span className="pulse-dot shrink-0" />
                              </div>
                            </div>

                            {/* Desktop: Like/Dislike buttons on the right */}
                            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                              <button
                                disabled={isOld || isInactive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLike(spot.id);
                                }}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  userVotes[spot.id] === "like"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "text-primary hover:bg-primary/10"
                                }`}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                সত্যি {spot.likes}
                              </button>
                              <button
                                disabled={isOld || isInactive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDislike(spot.id);
                                }}
                                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  userVotes[spot.id] === "dislike"
                                    ? "bg-destructive text-destructive-foreground border-destructive"
                                    : "text-destructive hover:bg-destructive/10"
                                }`}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                                মিথ্যা {spot.dislikes}
                              </button>
                              <span className="pulse-dot shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Copyright Footer */}
      <div className="sticky bottom-0 border-t border-border/50 bg-card px-2 sm:px-4 py-2 z-20">
        <p className="text-center text-[10px] text-muted-foreground">
          Developed by{" "}
          <a
            href="https://www.facebook.com/monirweb.wdd"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Monir
          </a>
        </p>
      </div>
    </div>
  );
};

export default SpotPanel;
