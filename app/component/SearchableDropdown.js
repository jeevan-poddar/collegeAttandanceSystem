import React, { useState } from "react";
import { useForm } from "react-hook-form";

const SearchAbleDropdown = ({
  options = [],
  index,
  searchFor,
  insert,
  defaultValue,
  updateRow,
  mode, // accepts: "option", "custom", or "both"
  placeholder,
}) => {
  const [showDrop, setShowDrop] = useState(false);

  const { register, watch, setValue } = useForm({
    defaultValues: { search: defaultValue },
  });

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
    setValue("search", option[searchFor[0]]);
    updateRow(index, Object.keys(insert)[0], option[Object.values(insert)[0]]);
  };

  const handleInputChange = (e) => {
    // 👇 UPDATED LINE: Update parent row on typing ONLY if mode is "custom" or "both"
    if (mode === "custom" || mode === "both") {
      updateRow(index, Object.keys(insert)[0], e.target.value);
    }
  };

  return (
    <div>
      <form action="" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder={placeholder || "Search..."}
          className="border border-gray-300 p-2 w-full"
          autoComplete="off"
          // 👇 UPDATED LINE: Only open the dropdown menu if mode is "option" or "both"
          onFocus={() => {
            if (mode === "option" || mode === "both") {
              setShowDrop(true);
            }
          }}
          {...register("search", {
            onChange: handleInputChange,
            onBlur: () => setShowDrop(false),
          })}
        />
      </form>
      <div className="dropDownMenu">
        {showDrop && (
          <div>
            {filteredOptions.map((option, idx) => (
              <div
                key={idx}
                className="dropDownItem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectOption(option)}
              >
                {searchFor.map((title) => option[title]).join(", ")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAbleDropdown;
