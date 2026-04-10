import React, { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

interface EventFilters {
  privacy: string[];
  status: string[];
  location: string[];
  dateRange: "all" | "upcoming" | "past" | "today";
}

interface EventsFilterDropdownProps {
  onFiltersChange: (filters: EventFilters) => void;
  locations: string[];
}

const EventsFilterDropdown: React.FC<EventsFilterDropdownProps> = ({
  onFiltersChange,
  locations,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    privacy: [],
    status: [],
    location: [],
    dateRange: "all",
  });

  const privacyOptions = ["Public", "Private"];
  const statusOptions = ["Open", "Ongoing", "Closed"];
  const dateRangeOptions = [
    { value: "all", label: "All Dates" },
    { value: "upcoming", label: "Upcoming Events" },
    { value: "past", label: "Past Events" },
    { value: "today", label: "Today's Events" },
  ];

  const handlePrivacyChange = (privacy: string) => {
    const updatedPrivacy = filters.privacy.includes(privacy)
      ? filters.privacy.filter((p) => p !== privacy)
      : [...filters.privacy, privacy];

    const updatedFilters = { ...filters, privacy: updatedPrivacy };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleStatusChange = (status: string) => {
    const updatedStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    const updatedFilters = { ...filters, status: updatedStatus };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleLocationChange = (location: string) => {
    const updatedLocation = filters.location.includes(location)
      ? filters.location.filter((l) => l !== location)
      : [...filters.location, location];

    const updatedFilters = { ...filters, location: updatedLocation };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleDateRangeChange = (value: string) => {
    const updatedFilters = {
      ...filters,
      dateRange: value as "all" | "upcoming" | "past" | "today",
    };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const resetFilters = () => {
    const emptyFilters: EventFilters = {
      privacy: [],
      status: [],
      location: [],
      dateRange: "all",
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount =
    filters.privacy.length +
    filters.status.length +
    filters.location.length +
    (filters.dateRange !== "all" ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition-colors"
      >
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDownIcon
          className={`h-5 w-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg bg-charleston shadow-lg border border-white/10">
          <div className="p-4 space-y-4">
            {/* Privacy Filter */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Privacy</h3>
              <div className="space-y-2">
                {privacyOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.privacy.includes(option)}
                      onChange={() => handlePrivacyChange(option)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Status</h3>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option)}
                      onChange={() => handleStatusChange(option)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            {locations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Location
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {locations.map((location) => (
                    <label
                      key={location}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.location.includes(location)}
                        onChange={() => handleLocationChange(location)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-300 truncate">
                        {location}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range Filter */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Date Range
              </h3>
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {dateRangeOptions.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    className="bg-charleston text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Fix for dropdown visibility */}
              <style jsx>{`
                select {
                  color: white;
                  background-color: rgb(33, 33, 33);
                }
                
                select option {
                  background-color: rgb(33, 33, 33);
                  color: white;
                  padding: 8px;
                }
                
                select option:checked {
                  background: linear-gradient(#379a7b, #379a7b);
                  background-color: #379a7b !important;
                  color: white;
                }
                
                select option:hover {
                  background-color: rgb(50, 50, 50);
                  color: white;
                }
              `}</style>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="w-full rounded-md bg-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsFilterDropdown;
