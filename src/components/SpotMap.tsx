/* eslint-disable @typescript-eslint/no-explicit-any */
import { BiryaniSpot } from "@/types/spot";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

// Check if spot is from a previous day
function isOldSpot(createdAt: Date): boolean {
  const spotDate = new Date(createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  spotDate.setHours(0, 0, 0, 0);
  return spotDate < today;
}

// Check if spot is newly added (within last 2 hours)
function isNewSpot(createdAt: Date): boolean {
  const now = new Date();
  const spotDate = new Date(createdAt);
  const diffHours = (now.getTime() - spotDate.getTime()) / (1000 * 60 * 60);
  return diffHours <= 2;
}

const createCustomIcon = (
  category: string,
  isNew: boolean = false,
  isNewest: boolean = false,
) => {
  const { color, icon } = getCategoryStyles(category);
  const size = isNewest ? 45 : isNew ? 40 : 35;
  const borderColor = isNewest ? "#10b981" : isNew ? "#34d399" : "white";
  const borderWidth = isNewest ? "3px" : isNew ? "2.5px" : "2px";
  const animation = isNewest
    ? "spot-blink 1s ease-in-out infinite, marker-pulse 2s ease-in-out infinite"
    : isNew
      ? "spot-blink 1.2s ease-in-out infinite"
      : "spot-blink 1.5s ease-in-out infinite";

  return L.divIcon({
    html: `
      <div class="marker-wrapper" style="position: relative;">
        ${
          isNewest
            ? `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%);
            border-radius: 50%;
            animation: marker-glow 2s ease-in-out infinite;
          "></div>
        `
            : ""
        }
        ${
          isNew && !isNewest
            ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #10b981, #34d399);
            color: white;
            font-size: 8px;
            font-weight: bold;
            padding: 2px 4px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 10;
            animation: badge-bounce 1s ease-in-out infinite;
          ">NEW</div>
        `
            : ""
        }
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: ${borderWidth} solid ${borderColor};
          box-shadow: 0 ${isNewest ? "4px 12px" : isNew ? "3px 8px" : "2px 5px"} rgba(0,0,0,${isNewest ? "0.5" : "0.4"});
          animation: ${animation};
          position: relative;
          z-index: 1;
        ">
          <div style="transform: rotate(45deg); font-size: ${isNewest ? "20px" : isNew ? "18px" : "16px"};">
            ${icon}
          </div>
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 5],
  });
};

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "কাচ্চি বিরিয়ানি":
      return { color: "#e74c3c", icon: "🍖" }; // লাল
    case "তেহারি":
      return { color: "#27ae60", icon: "🍛" }; // সবুজ
    case "মোরগ পোলাও":
      return { color: "#f39c12", icon: "🍗" }; // কমলা
    case "খিচুড়ি":
      return { color: "#f1c40f", icon: "🍲" }; // হলুদ
    default:
      return { color: "#34495e", icon: "🍽️" }; // অন্যান্য - ধূসর
  }
};

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface SpotMapProps {
  spots: BiryaniSpot[];
  onSpotClick?: (spot: BiryaniSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isAddMode?: boolean;
  newMarkerPos?: { lat: number; lng: number } | null;
  center?: { lat: number; lng: number };
  onLike?: (id: string) => void;
  onDislike?: (id: string) => void;
  userVotes?: { [spotId: string]: "like" | "dislike" };
  isLoading?: boolean;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterHandler({
  center,
}: {
  center?: { lat: number; lng: number };
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 15, {
        duration: 1.5,
      });
    }
  }, [center, map]);

  return null;
}

// Function to offset markers at the same location
function offsetDuplicateLocations(spots: BiryaniSpot[]): Array<{
  spot: BiryaniSpot;
  lat: number;
  lng: number;
  groupSize: number;
  indexInGroup: number;
}> {
  // Group spots by location
  const locationGroups = new Map<string, BiryaniSpot[]>();

  spots.forEach((spot) => {
    // Log each spot's original coordinates

    const key = `${spot.lat.toFixed(4)},${spot.lng.toFixed(4)}`; // Group spots at same location (4 decimal = ~10 meter precision)
    const group = locationGroups.get(key) || [];
    group.push(spot);
    locationGroups.set(key, group);
  });

  const offsetAmount = 0.005; // Larger offset in degrees (~500 meters) - clearly visible gap
  const result: Array<{
    spot: BiryaniSpot;
    lat: number;
    lng: number;
    groupSize: number;
    indexInGroup: number;
  }> = [];

  locationGroups.forEach((group, key) => {
    if (group.length === 1) {
      // Single spot at this location, no offset needed
      result.push({
        spot: group[0],
        lat: group[0].lat,
        lng: group[0].lng,
        groupSize: 1,
        indexInGroup: 0,
      });
    } else {
      group.forEach((spot, index) => {
        const angle = (index * 360) / group.length; // Evenly distribute around circle
        const radians = (angle * Math.PI) / 180;
        const offsetLat = Math.cos(radians) * offsetAmount;
        const offsetLng = Math.sin(radians) * offsetAmount;
        const newLat = spot.lat + offsetLat;
        const newLng = spot.lng + offsetLng;

        result.push({
          spot,
          lat: newLat,
          lng: newLng,
          groupSize: group.length,
          indexInGroup: index,
        });
      });
    }
  });

  return result;
}

// Default map center (Dhaka, Bangladesh)
const position: [number, number] = [23.7596, 90.379]; // ঢাকা, বাংলাদেশ

const SpotMap = ({
  spots,
  onSpotClick,
  onMapClick,
  isAddMode,
  newMarkerPos,
  center,
  onLike,
  onDislike,
  userVotes = {},
  isLoading = false,
}: SpotMapProps) => {
  // Sort spots by creation date (newest first)
  const sortedSpots = [...spots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const offsettedSpots = offsetDuplicateLocations(sortedSpots);

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-bold text-foreground">
                ম্যাপ লোড হচ্ছে...
              </p>
              <div className="flex gap-1.5">
                <span
                  className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <MapContainer
        center={position}
        zoom={10}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {isAddMode && <MapClickHandler onMapClick={onMapClick} />}
        <MapCenterHandler center={center} />

        {offsettedSpots.map(
          ({ spot, lat, lng, groupSize, indexInGroup }, index) => {
            const isOld = isOldSpot(spot.createdAt);
            const isInactive = !spot.isActive;
            const isNew = isNewSpot(spot.createdAt) && !isOld && !isInactive;
            const isNewest = index === 0 && !isOld && !isInactive; // First item is the newest
            const zIndex = isNewest
              ? 10000
              : isNew
                ? 1000 + (offsettedSpots.length - index)
                : offsettedSpots.length - index;

            return (
              <Marker
                key={spot.id}
                position={[lat, lng]}
                zIndexOffset={zIndex} // Ensure newer markers appear on top
                // স্পটের ক্যাটাগরি অনুযায়ী রঙ ও আইকন সেট করুন
                icon={createCustomIcon(spot.description, isNew, isNewest)}
                eventHandlers={{
                  click: () => onSpotClick?.(spot),
                }}
              >
                <Popup className="modern-popup">
                  <div className="min-w-[240px] max-w-[280px]">
                    {/* Header with gradient */}
                    <div className="relative -mt-4 -mx-5 px-5 pt-4 pb-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
                      {/* Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-[10px] font-bold shadow-md animate-pulse-subtle">
                              <span className="text-xs">✨</span>
                              {isNewest ? "সবচেয়ে নতুন" : "নতুন"}
                            </span>
                          )}
                          {spot.likes >= 3 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-full text-[10px] font-bold shadow-md">
                              <span className="text-xs">✓</span>
                              {isOld ? "নিশ্চিত ছিল" : "নিশ্চিত"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="flex items-start gap-2">
                        <span className="text-2xl shrink-0">🍛</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base leading-tight mb-1 text-foreground">
                            {spot.name}
                          </h3>
                          {spot.description && (
                            <p className="text-[11px] font-semibold text-accent px-2 py-0.5 bg-accent/10 rounded-md inline-block">
                              {spot.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="py-3 space-y-2.5">
                      {/* Location info */}
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                        <span className="text-base shrink-0">📍</span>
                        <span className="flex-1 leading-relaxed">
                          {spot.address}
                        </span>
                      </div>

                      {/* Multiple spots alert */}
                      {groupSize > 1 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                          <span className="text-sm">🔔</span>
                          <span className="text-xs font-medium text-orange-700">
                            এই স্থানে{" "}
                            <span className="font-bold text-orange-800">
                              {groupSize}টি
                            </span>{" "}
                            স্পট আছে
                          </span>
                        </div>
                      )}

                      {/* Old spot warning */}
                      {isOld && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <span className="text-sm">⏰</span>
                          <span className="text-xs font-medium text-amber-700">
                            এই স্পটটি পুরানো (গত দিনের)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Like/Dislike buttons */}
                    <div className="-mx-5 -mb-3 px-5 py-3 bg-gradient-to-t from-muted/20 to-transparent border-t border-border/50">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={isOld || isInactive}
                          onClick={(e) => {
                            e.stopPropagation();
                            onLike?.(spot.id);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${
                            userVotes[spot.id] === "like"
                              ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-200 scale-105"
                              : "bg-white text-green-600 hover:bg-green-50 border border-green-200 hover:border-green-300 hover:shadow-md"
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>সত্যি</span>
                          <span className="font-bold">{spot.likes}</span>
                        </button>
                        <button
                          disabled={isOld || isInactive}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDislike?.(spot.id);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${
                            userVotes[spot.id] === "dislike"
                              ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-200 scale-105"
                              : "bg-white text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 hover:shadow-md"
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>মিথ্যা</span>
                          <span className="font-bold">{spot.dislikes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          },
        )}

        {newMarkerPos && (
          <Marker
            position={[newMarkerPos.lat, newMarkerPos.lng]}
            zIndexOffset={1000}
          >
            <Popup className="modern-popup">
              <div className="text-center py-2">
                <div className="text-3xl mb-2">📍</div>
                <p className="font-bold text-sm text-primary">
                  নতুন স্পট এখানে
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  এই স্থানে বিরিয়ানি পাওয়া যাচ্ছে
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default SpotMap;
