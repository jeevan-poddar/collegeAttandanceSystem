import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";

const SearchAbleDropdown = ({
  options = [],
  index,
  searchFor = [],
  insert = {},
  defaultValue,
  updateRow,
  mode, // accepts: "option", "custom", or "both"
  placeholder,
}) => {
  const [showDrop, setShowDrop] = useState(false);
  const containerRef = useRef(null);

  const { register, watch, setValue } = useForm({
    defaultValues: { search: defaultValue || "" },
  });

  useEffect(() => {
    setValue("search", defaultValue || "");
  }, [defaultValue, setValue]);

  // Listen for clicks outside the dropdown container to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((item) => {
    const inputValue = watch("search")?.toLowerCase() || "";
    return searchFor.some((title) =>
      String(item[title] || "")
        .toLowerCase()
        .includes(inputValue),
    );
  });

  const handleSelectOption = (option) => {
    setShowDrop(false);
    setValue("search", option[searchFor[0]] || "");
    const insertKey = Object.keys(insert)[0];
    const insertValueField = Object.values(insert)[0];
    updateRow(index, insertKey, option[insertValueField]);
  };

  const handleInputChange = (e) => {
    if (mode === "custom" || mode === "both") {
      const insertKey = Object.keys(insert)[0];
      updateRow(index, insertKey, e.target.value);
    }
    if (mode === "option" || mode === "both") {
      setShowDrop(true);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <form action="" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder={placeholder || "Search..."}
          className="border border-gray-300 rounded-lg px-3.5 py-2 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
          autoComplete="off"
          onFocus={() => {
            if (mode === "option" || mode === "both") {
              setShowDrop(true);
            }
          }}
          {...register("search", {
            onChange: handleInputChange,
          })}
        />
      </form>
      {showDrop && (
        <div className="absolute z-50 left-0 min-w-60 w-full mt-1 max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl divide-y divide-gray-100">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <div
                key={idx}
                className="px-3.5 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors select-none"
                onClick={() => handleSelectOption(option)}
              >
                {searchFor
                  .map((title) => option[title])
                  .filter(Boolean)
                  .join(", ")}
              </div>
            ))
          ) : (
            <div className="px-3.5 py-3 text-xs text-gray-400 italic text-center select-none">
              No matching options found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAbleDropdown;
