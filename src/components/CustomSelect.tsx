import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  onChange: (option: Option) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, onChange }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);

  const handleSelect = (option: Option) => {
    setSelected(option);
    onChange(option);
    setOpen(false);
  };

  return (
    <div className="w-full relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-3 border border-neutral-800 rounded-md bg-white text-left flex justify-between items-center"
      >
        <span>{selected ? selected.label : "Select a quiz"}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-neutral-800" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-800" />
        )}
      </button>

      {open && (
        <ul className="absolute z-10 mt-1 w-full h-32 border border-neutral-800 rounded-md bg-white max-h-60 overflow-auto">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-2 py-1 cursor-pointer hover:bg-accent"
              role="option"
              aria-selected={selected?.value === option.value}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
