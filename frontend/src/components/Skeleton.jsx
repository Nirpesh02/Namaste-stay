export default function Skeleton({ width = "w-full", height = "h-6", count = 1, rounded = "rounded-lg" }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${width} ${height} ${rounded} bg-gray-300 animate-pulse`}
        />
      ))}
    </div>
  );
}
