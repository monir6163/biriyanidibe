import { BiryaniSpot } from "@/types/spot";

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

const SpotCounter = ({ count, spots }: SpotCounterProps) => {
  const popularLocations = countPopularLocations(spots);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105">
        <span>🍛</span>
        <span>সর্বমোট স্পট: {count}টি</span>
      </button>

      <button className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105">
        <span>🔥</span>
        <span>নিশ্চিত স্পট: {popularLocations}টি</span>
      </button>
    </div>
  );
};

export default SpotCounter;
