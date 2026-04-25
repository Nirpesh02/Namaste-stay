export default function PriceDisplay({ amount, currency = "NPR", size = "md", showPerNight = true }) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount).replace('$', '');

  return (
    <div className="inline-block hover:scale-105 transition-transform">
      <div className="flex items-baseline gap-2">
        <span className={`font-bold text-red-700 ${sizes[size]}`}>
          {currency} {formattedPrice}
        </span>
        {showPerNight && (
          <span className="text-gray-600 text-sm font-medium">/ night</span>
        )}
      </div>
    </div>
  );
}
