"use client";

import * as React from "react";
import { IoClose } from "react-icons/io5";
import { useDebouncedCallback } from "use-debounce";

interface TagsInputProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  minItems?: number;
  maxItems?: number;
  placeholder?: string;
  suggestions?: string[];
  allowCustomTags?: boolean;
  disabled?: boolean;
  className?: string;
  tagClassName?: string;
  inputClassName?: string;
  dropdownClassName?: string;
}

export default function TagsInput({
  value,
  onChange,
  minItems = 0,
  maxItems = Infinity,
  placeholder = "Add tags...",
  suggestions = [],
  allowCustomTags = true,
  disabled = false,
  className = "",
  tagClassName = "",
  inputClassName = "",
  dropdownClassName = "",
}: TagsInputProps) {
  const [tags, setTags] = React.useState<string[]>(value || []);
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value) {
      setTags(value);
    }
  }, [value]);

  const filteredSuggestions = React.useMemo(() => {
    try {
      if (!Array.isArray(suggestions)) {
        console.error("Suggestions is not an array:", suggestions);
        return [];
      }
      return suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(suggestion)
      );
    } catch (err) {
      console.error("Error in filteredSuggestions:", err);
      setError("An error occurred while filtering suggestions.");
      return [];
    }
  }, [inputValue, tags, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const debouncedAddTag = useDebouncedCallback((tag: string) => {
    try {
      if (disabled) return;
      if (tags.length >= maxItems) {
        setError(`Maximum of ${maxItems} tags allowed`);
        return;
      }
      if (tag && !tags.includes(tag) && (allowCustomTags || suggestions.includes(tag))) {
        setTags((prevTags) => [...prevTags, tag]);
        setInputValue(""); // Clear input value after adding tag
        setError(null);
        if (onChange) {
          onChange([...tags, tag]);
        }
      } else if (!allowCustomTags && !suggestions.includes(tag)) {
        setError("Custom tags are not allowed");
      }
    } catch (err) {
      console.error("Error in addTag:", err);
      setError("An error occurred while adding a tag.");
    }
  }, 100); // Adjust the debounce delay as needed

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      debouncedAddTag(inputValue);
    } else if (e.key === "Tab" && inputValue) {
      debouncedAddTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputBlur = () => {
    if (inputValue) {
      debouncedAddTag(inputValue);
    }
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const removeTag = (tag: string) => {
    try {
      if (disabled) return;
      if (tags.length <= minItems) {
        setError(`Minimum of ${minItems} tags required`);
        return;
      }
      const newTags = tags.filter((t) => t !== tag);
      setTags(newTags);
      setError(null);
      if (onChange) {
        onChange(newTags);
      }
    } catch (err) {
      console.error("Error in removeTag:", err);
      setError("An error occurred while removing a tag.");
    }
  };

  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
    }
  };

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      <div
        className={`flex flex-wrap gap-2 rounded-md border-0 bg-white/5 p-2  shadow-sm ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary ${
          disabled ? "opacity-50" : ""
        }`}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center rounded-md bg-primary px-2 py-1 text-sm font-medium text-primary-foreground ${tagClassName}`}
          >
            {tag}
            <button
              type="button"
              className="ml-1 inline-flex items-center p-0.5 text-primary-foreground hover:text-primary-foreground/70"
              onClick={() => removeTag(tag)}
              disabled={disabled}
            >
              <IoClose className="h-3 w-3" />
              <span className="sr-only">Remove tag</span>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className={`h-6 w-20 border-0 bg-transparent p-0 text-white outline-none placeholder:text-gray-400 focus:ring-0 ${inputClassName}`}
          placeholder={tags.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleFocus}
          onBlur={handleInputBlur}
          disabled={disabled || tags.length >= maxItems}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {isFocused && filteredSuggestions.length > 0 && tags.length < maxItems && (
        <div className="relative">
          <ul
            className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#525252] bg-charleston shadow-sm ${dropdownClassName}`}
          >
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="cursor-pointer px-3 py-2 text-white hover:bg-primary/10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  debouncedAddTag(suggestion);
                  setInputValue("");
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
