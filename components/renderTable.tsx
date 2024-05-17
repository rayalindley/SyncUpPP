import React, { useState, useEffect } from "react";
import { set } from "zod";

const renderTable = (items, toggleSelection, setItems, formatDate, formatKey) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (toggleSelection) {
      const newItems = items.map((item) => ({ ...item, selected: selectAll }));
      setItems(newItems);
    }
  }, [selectAll]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    setFilteredItems(
      items.filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(search))
      )
    );
  }, [items, searchTerm]);

  const handleSort = (column) => {
    let direction = "asc";
    if (sortColumn === column && sortDirection === "asc") {
      direction = "desc";
    }
    setSortColumn(column);
    setSortDirection(direction);
    const sortedItems = [...filteredItems].sort((a, b) => {
      if (a[column] === null) return 1;
      if (b[column] === null) return -1;
      if (a[column] === b[column]) return 0;
      return a[column] > b[column] ? 1 : -1;
    });
    if (direction === "desc") sortedItems.reverse();
    setItems(sortedItems);
  };

  return (
    <>
      <input
        className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-white">
          <thead className="bg-[#505050]">
            <tr>
              {items.length > 0 && (items[0].name || items[0].title) && (
                <>
                  <th className="border-b border-[#404040] p-3">
                    {toggleSelection !== null && (
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={() => setSelectAll(!selectAll)}
                      />
                    )}
                  </th>
                  {items[0].name && (
                    <th
                      className="cursor-pointer border-b border-[#404040] p-3"
                      onClick={() => handleSort("name")}
                    >
                      Name
                    </th>
                  )}
                  {items[0].title && (
                    <th
                      className="cursor-pointer border-b border-[#404040] p-3"
                      onClick={() => handleSort("title")}
                    >
                      Title
                    </th>
                  )}
                </>
              )}
              {items.length > 0 &&
                Object.keys(items[0]).map((key) => {
                  if (key !== "name" && key !== "title") {
                    const formattedKey = formatKey(key);
                    return (
                      formattedKey &&
                      !key.toLowerCase().includes("id") && (
                        <th
                          key={key}
                          className="cursor-pointer border-b border-[#404040] p-3"
                          onClick={() => handleSort(key)}
                        >
                          {formattedKey}
                        </th>
                      )
                    );
                  }
                  return null;
                })}
            </tr>
          </thead>
          <tbody className="bg-[#404040]">
            {filteredItems.map((item, index) => (
              <tr
                key={index}
                className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"}`}
              >
                {toggleSelection !== null && (
                  <td className="border-b border-[#404040] p-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => setItems(toggleSelection(items, item.id))}
                    />
                  </td>
                )}
                {item.name && (
                  <td className="border-b border-[#404040] p-3">{item.name}</td>
                )}
                {item.title && (
                  <td className="border-b border-[#404040] p-3">{item.title}</td>
                )}
                {Object.entries(item).map(([key, value]) => {
                  if (
                    key !== "name" &&
                    key !== "title" &&
                    !key.toLowerCase().includes("id")
                  ) {
                    const formattedKey = formatKey(key);
                    let displayValue = value;
                    if (key.toLowerCase().includes("date")) {
                      displayValue = formatDate(value);
                    } else if (key === "address") {
                      displayValue =
                        `${value.addressLine1 || ""} ${value.addressLine2 || ""}, ${value.city || ""}, ${value.stateProvince || ""}, ${value.country || ""}`.trim();
                    } else {
                      // Limit the display value to 50 characters
                      displayValue = String(value).substring(0, 50);
                    }
                    return (
                      formattedKey && (
                        <td
                          key={`${item.id}-${key}`}
                          className="border-b border-[#404040] p-3"
                        >
                          {displayValue}
                        </td>
                      )
                    );
                  }
                  return null;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default renderTable;
