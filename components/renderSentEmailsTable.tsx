import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const renderTable = (items, toggleSelection, setItems, formatDate, formatKey) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(items.slice(0, 10));
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDetailPane, setShowDetailPane] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (showDetailPane) {
      setTimeout(() => setOpacity(1), 0);
    } else {
      setOpacity(0);
    }
  }, [showDetailPane]);

  console.log(items);

  const checkIfExcludedKey = (key) => {
    const excludedKeys = ["id"];
    return excludedKeys.includes(key) ? null : key;
  };

  const itemsPerPage = 10;

  const handleRowClick = (item) => {
    if (setSelectedRow) {
      setSelectedRow(item);
      setShowDetailPane(true); // Show the detail pane when a row is clicked
    }
  };

  // Function to close the detail pane
  const closeDetailPane = () => {
    setShowDetailPane(false);
  };

  useEffect(() => {
    if (toggleSelection) {
      const newItems = items.map((item) => ({ ...item, selected: selectAll }));
      setItems(newItems);
    }
  }, [selectAll]);

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const filtered = items
      .filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(search))
      )
      .slice(startIndex, startIndex + itemsPerPage);
    setFilteredItems(filtered);
  }, [items, searchTerm, currentPage]);

  const SortIcon = ({ direction }) => {
    return (
      <span style={{ marginLeft: "auto" }}>
        <span className=" ml-5"></span>
        {direction === "asc" ? "🡩" : direction === "desc" ? "🡣" : null}
      </span>
    );
  };

  const handleSort = (column) => {
    let direction = "asc";
    if (sortColumn === column && sortDirection === "asc") {
      direction = "desc";
    }
    setSortColumn(column);
    setSortDirection(direction);
    const sortedItems = [...items].sort((a, b) => {
      if (a[column] === null) return 1;
      if (b[column] === null) return -1;
      if (a[column] === b[column]) return 0;
      return a[column] > b[column] ? 1 : -1;
    });
    if (direction === "desc") sortedItems.reverse();
    setItems(sortedItems); // Sort the entire dataset
  };
  

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const pageCount = Math.ceil(items.length / itemsPerPage);
    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < pageCount ? currentPage + 1 : null;

    return (
      <div className="flex items-center justify-center space-x-1">
        {prevPage && (
          <button
            className="rounded-full bg-[#505050] p-2 text-white hover:bg-[#404040]"
            onClick={() => handlePageChange(prevPage)}
          >
            {"<"}
          </button>
        )}
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            className={`rounded-full px-3 py-2 text-white hover:bg-[#404040] ${
              currentPage === number ? "bg-[#303030]" : "bg-[#505050]"
            }`}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        ))}
        {nextPage && (
          <button
            className="rounded-full bg-[#505050] p-2 text-white hover:bg-[#404040]"
            onClick={() => handlePageChange(nextPage)}
          >
            {">"}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {items.length > 0 && (
        <input
          className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}
      <div className="overflow-x-auto rounded-lg" style={{ overflow: "auto" }}>
        <table className="w-full text-white">
          <thead className="bg-[#505050]">
            <tr>
              {items.length > 0 && (items[0].name || items[0].title) && (
                <>
                  <th
                    className="border-b border-[#404040] p-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
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
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Name</span>
                        {sortColumn === "name" && <SortIcon direction={sortDirection} />}
                      </div>
                    </th>
                  )}
                  {items[0].title && (
                    <th
                      className="cursor-pointer border-b border-[#404040] p-3"
                      onClick={() => handleSort("title")}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <div className="flex items-center justify-between">
                        <span>Title</span>
                        {sortColumn === "title" && <SortIcon direction={sortDirection} />}
                      </div>
                    </th>
                  )}
                </>
              )}
              {items.length > 0 &&
                Object.keys(items[0]).map((key) => {
                  if (key !== "name" && key !== "title" && key !== "body") {
                    const formattedKey = checkIfExcludedKey(formatKey(key));
                    return (
                      formattedKey &&
                      !key.toLowerCase().includes("id") && (
                        <th
                          key={key}
                          className="cursor-pointer border-b border-[#404040] p-3"
                          onClick={() => handleSort(key)}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{formattedKey}</span>
                            {sortColumn === key && <SortIcon direction={sortDirection} />}
                          </div>
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
                className={`${index % 2 === 0 ? "bg-[#505050]" : "bg-[#404040]"} ${setSelectedRow ? "cursor-pointer" : ""}`}
                onClick={() => handleRowClick(item)}
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
                  <td className="border-b border-[#404040] p-3">
                    {item.name && item.name.length > 30
                      ? `${item.name.substring(0, 30)}...`
                      : item.name || ""}
                  </td>
                )}
                {item.title && (
                  <td className="border-b border-[#404040] p-3">
                    {item.title && item.title.length > 30
                      ? `${item.title.substring(0, 30)}...`
                      : item.title || ""}
                  </td>
                )}
                {Object.entries(item).map(([key, value]) => {
                  if (
                    key !== "name" &&
                    key !== "title" &&
                    key !== "body" &&
                    !key.toLowerCase().includes("id")
                  ) {
                    const formattedKey = checkIfExcludedKey(formatKey(key));
                    let displayValue = value || "";
                    if (key.toLowerCase().includes("date") && value) {
                      displayValue = formatDate(value);
                    } else if (key === "address" && value) {
                      displayValue =
                        `${value.addressLine1 || ""} ${value.addressLine2 || ""}, ${value.city || ""}, ${value.stateProvince || ""}, ${value.country || ""}`.trim();
                    } else if (value) {
                      displayValue =
                        value.length > 50
                          ? `${String(value).substring(0, 50)}...`
                          : String(value);
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
      {items.length > 10 && (
        <div className="my-4 flex justify-center">{renderPageNumbers()}</div>
      )}

      {showDetailPane &&
        selectedRow &&
        createPortal(
          <div
            className="fixed inset-0 z-10 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              transition: "opacity 0.5s",
              opacity: opacity,
            }}
          >
            <div
              className="w-full max-w-sm space-y-4 overflow-auto rounded-lg bg-gray-900 p-4 shadow-lg md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
              style={{ color: "white", maxHeight: "90vh" }}
            >
              <h3 className="text-2xl font-semibold text-white">Details</h3>
              <table className="mt-4 space-y-4" style={{ width: "100%" }}>
                {Object.entries(selectedRow)
                  .filter(([key]) => key !== "id")
                  .map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          wordWrap: "break-word",
                          width: "30%",
                          paddingBottom: "10px",
                          paddingTop: "10px",
                        }}
                      >
                        <strong>{formatKey(key)}</strong>
                      </td>
                      <td
                        style={{
                          wordWrap: "break-word",
                          width: "70%",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                          paddingBottom: "10px",
                          paddingTop: "10px",
                        }}
                      >
                        {key === "body" ? (
                          <div dangerouslySetInnerHTML={{ __html: String(value) }} />
                        ) : (
                          <div>{String(value)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
              </table>
              <button
                onClick={closeDetailPane}
                style={{
                  color: "white",
                  backgroundColor: "gray",
                  borderRadius: "5px",
                  marginTop: "10px",
                  padding: "10px 20px",
                }}
              >
                Back
              </button>
            </div>
          </div>,
          document.body // Assuming your app is mounted on document.body
        )}
    </>
  );
};

export default renderTable;
