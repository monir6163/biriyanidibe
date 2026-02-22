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

const createCustomIcon = (category: string) => {
  const { color, icon } = getCategoryStyles(category);
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 35px;
        height: 35px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.4);
        animation: spot-blink 1.5s ease-in-out infinite;
      ">
        <div style="transform: rotate(45deg); font-size: 16px;">
          ${icon}
        </div>
      </div>
    `,
    className: "custom-marker",
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -30],
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
}: SpotMapProps) => {
  const offsettedSpots = offsetDuplicateLocations(spots);

  return (
    <MapContainer
      center={position}
      zoom={13}
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
          return (
            <Marker
              key={spot.id}
              position={[lat, lng]}
              zIndexOffset={index} // Ensure newer markers appear on top
              // স্পটের ক্যাটাগরি অনুযায়ী রঙ ও আইকন সেট করুন
              icon={createCustomIcon(spot.description)}
              eventHandlers={{
                click: () => onSpotClick?.(spot),
              }}
            >
              <Popup>
                <div className="text-center min-w-[200px]">
                  {groupSize > 1 && (
                    <div className="mb-2 px-2 py-1 bg-orange-100 border border-orange-300 rounded text-xs text-orange-700 font-medium">
                      📍 এই স্থানে {groupSize}টি স্পট আছে
                    </div>
                  )}
                  <p className="font-bold text-sm mb-1">🍛 {spot.name}</p>
                  <p className="text-xs text-gray-600 mb-1">
                    📍 {spot.address}
                  </p>
                  {spot.description && (
                    <p className="text-xs text-orange-600 font-medium mb-2">
                      {spot.description}
                    </p>
                  )}
                  {isOld && (
                    <p className="text-xs text-gray-500 mb-2">
                      ⏰ এই স্পটটি পুরানো (গত দিনের) হতে পারে
                    </p>
                  )}

                  {/* Like/Dislike buttons */}
                  <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-200">
                    <button
                      disabled={isOld || isInactive}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLike?.(spot.id);
                      }}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        userVotes[spot.id] === "like"
                          ? "bg-green-600 text-white border-green-600"
                          : "text-green-600 hover:bg-green-50 border-green-200"
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      সত্যি {spot.likes}
                    </button>
                    <button
                      disabled={isOld || isInactive}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDislike?.(spot.id);
                      }}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        userVotes[spot.id] === "dislike"
                          ? "bg-red-600 text-white border-red-600"
                          : "text-red-600 hover:bg-red-50 border-red-200"
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      মিথ্যা {spot.dislikes}
                    </button>
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
          <Popup>নতুন স্পট এখানে</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default SpotMap;
