"use client";
import React, { useState, Fragment, useMemo } from "react";
import { Email } from "@/types/email";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";
import { Disclosure, Switch } from "@headlessui/react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import { Dialog, Transition } from "@headlessui/react";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";

interface EmailsProps {
  sentEmails: Email[];
  incomingEmails: Email[];
  organizationName: string;
  organizationId: string;
  hasPermission: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const customStyles: TableStyles = {
  table: {
    style: {
      tableLayout: "fixed",
      width: "100%",
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#212121",
      color: "#ffffff",
    },
  },
  headCells: {
    style: {
      color: "#ffffff",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      padding: "12px",
      backgroundColor: "#212121",
      borderRadius: "8px",
    },
  },
  cells: {
    style: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      padding: "12px",
      backgroundColor: "transparent",
      color: "#ffffff",
    },
  },
  rows: {
    style: {
      backgroundColor: "#2a2a2a",
      color: "#ffffff",
      "&:hover": { backgroundColor: "#3e3e3e" },
    },
  },
  pagination: {
    style: {
      backgroundColor: "transparent",
      color: "#ffffff",
      justifyContent: "center",
    },
  },
  noData: {
    style: {
      backgroundColor: "transparent",
      color: "#ffffff",
    },
  },
};

const cssColorToRgb = (color: string): { r: number; g: number; b: number } | null => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = color;
  const computedColor = ctx.fillStyle;
  const match = computedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  }
  return null;
};

const getLuminance = (r: number, g: number, b: number): number => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

const isBackgroundLight = (backgroundColor: string): boolean => {
  const rgb = cssColorToRgb(backgroundColor);
  if (!rgb) return false; // Default to dark if unable to parse
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5; // Threshold for light vs dark
};

const adjustTextColors = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const defaultBgColor = "rgb(31, 31, 31)";
  const traverse = (element: HTMLElement, parentBgColor: string) => {
    let bgColor = parentBgColor;
    const inlineStyle = element.getAttribute("style");
    if (inlineStyle) {
      const bgMatch = inlineStyle.match(/background-color\s*:\s*([^;]+)/i);
      if (bgMatch) {
        bgColor = bgMatch[1].trim();
      }
    }
    if (
      !bgColor ||
      bgColor.toLowerCase() === "transparent" ||
      bgColor.toLowerCase() === "inherit"
    ) {
      bgColor = parentBgColor;
    }
    const isLight = isBackgroundLight(bgColor);
    if (isLight) {
      element.style.color = "#000000"; // Dark text
    } else {
      element.style.color = "#FFFFFF"; // Light text
    }
    Array.from(element.children).forEach((child) => {
      traverse(child as HTMLElement, bgColor);
    });
  };
  traverse(doc.body, defaultBgColor);
  return doc.body.innerHTML;
};

const Emails: React.FC<EmailsProps> = ({
  sentEmails,
  incomingEmails,
  organizationName,
  organizationId,
  hasPermission,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [outgoingSearch, setOutgoingSearch] = useState("");
  const [incomingSearch, setIncomingSearch] = useState("");
  const [isLightMode, setIsLightMode] = useState(false);

  const outgoingEmailColumns: TableColumn<Email>[] = [
    {
      name: "Subject",
      selector: (row: Email) => row.subject,
      sortable: true,
      id: "subject",
      width: "250px",
    },
    {
      name: "To",
      selector: (row: Email) => row.to.join(", "),
      sortable: true,
      id: "to",
      width: "200px",
    },
    {
      name: "Date",
      selector: (row: Email) => new Date(row.date).toLocaleString(),
      sortable: true,
      id: "date",
      width: "180px",
    },
    {
      name: "Actions",
      cell: (row: Email) => (
        <div className="flex space-x-2">
          <button
            className="text-primary underline"
            onClick={() => openEmailPreview(row)}
          >
            Preview
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      id: "actions",
      width: "150px",
    },
  ];

  const incomingEmailColumns: TableColumn<Email>[] = [
    {
      name: "Subject",
      selector: (row: Email) => row.subject,
      sortable: true,
      id: "subject",
      width: "250px",
    },
    {
      name: "From",
      selector: (row: Email) => {
        const emailMatch = row.from.match(/<(.+?)>/);
        return emailMatch ? emailMatch[1] : row.from;
      },
      sortable: true,
      id: "from",
      width: "200px",
    },
    {
      name: "Date",
      selector: (row: Email) => new Date(row.date).toLocaleString(),
      sortable: true,
      id: "date",
      width: "180px",
    },
    {
      name: "Actions",
      cell: (row: Email) => (
        <div className="flex space-x-2">
          <button
            className="text-primary underline"
            onClick={() => openEmailPreview(row)}
          >
            Preview
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      id: "actions",
      width: "150px",
    },
  ];

  const filteredSentEmails = useMemo(() => {
    if (!outgoingSearch) return sentEmails;
    return sentEmails.filter((email) =>
      Object.values(email)
        .join(" ")
        .toLowerCase()
        .includes(outgoingSearch.toLowerCase())
    );
  }, [sentEmails, outgoingSearch]);

  const filteredIncomingEmails = useMemo(() => {
    if (!incomingSearch) return incomingEmails;
    return incomingEmails.filter((email) =>
      Object.values(email)
        .join(" ")
        .toLowerCase()
        .includes(incomingSearch.toLowerCase())
    );
  }, [incomingEmails, incomingSearch]);

  const processedHtml = useMemo(() => {
    if (!selectedEmail) return "";
    const rawHtml = selectedEmail.htmlContent || selectedEmail.body || "";
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    const cleanedHtml = sanitizedHtml.replace(
      new RegExp(`${process.env.NEWSLETTER_EMAIL}`, "g"),
      ""
    );
    if (isLightMode) {
      return cleanedHtml;
    } else {
      const adjustedHtml = adjustTextColors(cleanedHtml);
      return adjustedHtml;
    }
  }, [selectedEmail, isLightMode]);

  const openEmailPreview = (email: Email) => {
    setSelectedEmail(email);
    setIsPreviewOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl rounded-lg bg-[#1f1f1f] p-2 sm:p-4 shadow-lg">
      {!hasPermission ? (
        <div className="text-center text-lg font-semibold text-red-500">
          You do not have permission to view emails.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {/* Outgoing Emails Section */}
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full items-center justify-between rounded bg-[#333333] px-2 sm:px-3 py-2 text-left text-sm font-medium text-white focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                    <span>Outgoing Emails</span>
                    {open ? (
                      <ChevronUpIcon className="h-4 w-4 text-white" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-white" />
                    )}
                  </Disclosure.Button>
                  <Disclosure.Panel className="mt-2 space-y-2">
                    <div className="relative border-b-2 w-full">
                      <svg
                        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search Outgoing Emails..."
                        value={outgoingSearch}
                        onChange={(e) => setOutgoingSearch(e.target.value)}
                        className="w-full rounded-md border-gray-500 border-transparent bg-charleston p-2 pl-10 text-sm text-white placeholder-gray-400 focus:border-primary focus:ring-0"
                      />
                    </div>
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <DataTable
                        keyField="id"
                        columns={outgoingEmailColumns}
                        data={filteredSentEmails}
                        pagination
                        fixedHeader
                        fixedHeaderScrollHeight="calc(50vh - 200px)"
                        customStyles={customStyles}
                        noDataComponent={
                          <div className="text-center text-white">
                            There are no outgoing emails to display.
                          </div>
                        }
                        defaultSortFieldId="date"
                        defaultSortAsc={false}
                        responsive
                      />
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
            {/* Incoming Emails Section */}
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full items-center justify-between rounded bg-[#333333] px-3 py-2 text-left text-sm font-medium text-white focus:outline-none focus-visible:ring focus-visible:ring-opacity-75">
                    <span>Incoming Emails</span>
                    {open ? (
                      <ChevronUpIcon className="h-4 w-4 text-white" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-white" />
                    )}
                  </Disclosure.Button>
                  <Disclosure.Panel className="mt-2 space-y-2">
                    <div className="relative border-b-2">
                      <svg
                        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                      <input
                        type="text"
                        placeholder="Search Incoming Emails..."
                        value={incomingSearch}
                        onChange={(e) => setIncomingSearch(e.target.value)}
                        className="w-full rounded-md border-gray-500 border-transparent bg-charleston p-2 pl-10 text-sm text-white placeholder-gray-400 focus:border-primary focus:ring-0"
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <DataTable
                        keyField="id"
                        columns={incomingEmailColumns}
                        data={filteredIncomingEmails}
                        pagination
                        fixedHeader
                        fixedHeaderScrollHeight="400px"
                        customStyles={customStyles}
                        noDataComponent={
                          <div className="text-center text-white">
                            There are no incoming emails to display.
                          </div>
                        }
                        defaultSortFieldId="date"
                        defaultSortAsc={false}
                      />
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
          {/* Email Preview Modal */}
          {selectedEmail && (
            <Transition appear show={isPreviewOpen} as={Fragment}>
              <Dialog
                as="div"
                className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4"
                onClose={() => setIsPreviewOpen(false)}
              >
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
                </Transition.Child>
                <div className="flex min-h-screen items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  >
                    {/* **Conditional Class Names Based on isLightMode** */}
                    <Dialog.Panel
                      className={classNames(
                        "w-full max-w-4xl transform overflow-hidden rounded-lg shadow-xl transition-all",
                        isLightMode ? "bg-white text-black" : "bg-[#1f1f1f] text-white"
                      )}
                    >
                      {/* Header */}
                      <div
                        className={classNames(
                          "flex items-center justify-between border-b p-2 sm:p-4",
                          isLightMode ? "border-gray-300" : "border-gray-700"
                        )}
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <button
                            className={classNames(
                              "hover:text-gray-700",
                              isLightMode ? "text-gray-700" : "text-gray-400"
                            )}
                            onClick={() => setIsPreviewOpen(false)}
                          >
                            <ArrowLeftIcon className="h-5 w-5" />
                          </button>
                          <Dialog.Title as="h3" className="text-sm sm:text-lg font-semibold truncate">
                            {selectedEmail.subject}
                          </Dialog.Title>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
                          {/* **Toggle Switch for Light Mode** */}
                          <Switch
                            checked={isLightMode}
                            onChange={setIsLightMode}
                            className={`${
                              isLightMode ? "bg-primary" : "bg-gray-500"
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                          >
                            <span
                              className={`${
                                isLightMode ? "translate-x-6" : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </Switch>
                          <label
                            htmlFor="lightModeToggle"
                            className={classNames(
                              "text-sm",
                              isLightMode ? "text-gray-700" : "text-gray-400"
                            )}
                          >
                            View in Light Mode
                          </label>
                          <button
                            className={classNames(
                              "hover:text-gray-700",
                              isLightMode ? "text-gray-700" : "text-gray-400"
                            )}
                            onClick={() => setIsPreviewOpen(false)}
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      {/* Email Body */}
                      <div className="space-y-4 p-2 sm:p-6 text-left overflow-x-auto">
                        <div className="flex flex-col space-y-1">
                          {selectedEmail.from &&
                          organizationName &&
                          selectedEmail.from.includes(organizationName) ? (
                            <span className="text-sm">
                              <strong>To:</strong> {selectedEmail.to.join(", ")}
                            </span>
                          ) : (
                            <span className="text-sm">
                              <strong>From:</strong> {selectedEmail.from}
                            </span>
                          )}
                          <span className="text-xs">
                            {new Date(selectedEmail.date).toLocaleString()}
                          </span>
                        </div>
                        {/* Securely Render Adjusted or Original HTML Content */}
                        <div
                          className={`prose max-w-none ${
                            isLightMode ? "" : "prose-invert"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: processedHtml,
                          }}
                        ></div>
                        {selectedEmail.attachments.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-md mb-2 font-semibold">Attachments:</h4>
                            <ul className="list-inside list-disc space-y-1">
                              {selectedEmail.attachments.map((attachment, index) => (
                                <li key={index}>
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                  >
                                    {attachment.filename}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </Dialog>
            </Transition>
          )}
        </>
      )}
    </div>
  );
};

export default Emails;
