import React, { useState } from "react";

const tabs = [{ name: "Role1" }, { name: "Role2" }, { name: "Role3" }, { name: "Role4" }];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PermissionsTabs() {
  const [currentTab, setCurrentTab] = useState(tabs[0]); // Set the first tab as the default current tab

  const handleClick = (tab) => {
    setCurrentTab(tab);
  };

  return (
    <div className="flex flex-col">
      <p className="mb-3">Roles/Members</p>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          value={currentTab ? currentTab.name : ""} // Check if currentTab is not undefined before accessing its name property
          onChange={(e) => {
            const selectedTab = tabs.find((tab) => tab.name === e.target.value);
            setCurrentTab(selectedTab);
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav className="flex flex-col space-y-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <a
              key={tab.name}
              href={tab.href}
              className={classNames(
                tab === currentTab
                  ? "bg-indigo-100 text-primary"
                  : "text-gray-500 hover:text-primarydark",
                "rounded-md px-3 py-2 text-sm font-medium"
              )}
              aria-current={tab === currentTab ? "page" : undefined}
              onClick={() => handleClick(tab)}
            >
              {tab.name}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
