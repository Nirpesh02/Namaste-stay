import { Search, X } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ placeholder = "Search...", onSearch = null, onClear = null, icon: Icon = Search, size = "md" }) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onSearch) onSearch(newValue);
  };

  const handleClear = () => {
    setValue("");
    if (onClear) onClear();
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  return (
    <div
      className={`flex items-center gap-2 border ${isFocused ? "border-red-600 scale-102" : "border-gray-300"} rounded-full bg-white ${sizes[size]} transition-all shadow-sm`}
    >
      <Icon size={18} className="text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="grow outline-none bg-transparent text-gray-800 placeholder-gray-500"
      />
      {value && (
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600 hover:scale-110 transition-all"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
