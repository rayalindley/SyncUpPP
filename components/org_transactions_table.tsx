"use client";
import Preloader from "@/components/preloader";
import { Organization } from "@/types/organization";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useDebounce } from "use-debounce";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { TableColumn } from "react-data-table-component";

const supabase = createClient();

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false });

interface OrganizationPayment {
  paymentId: string;
  amount: number;
  invoiceId: string;
  type: string;
  invoiceUrl: string;
  status: string;
  created_at: string;
  payment_frequency: string;
  organizationId: string;
  organization_slug: string;
  organization_name: string;
  details: {
    membershipId?: string;
    name?: string;
    description?: string;
    registrationFee?: number;
    features?: Record<string, string>;
    eventId?: string;
    title?: string;
    eventDateTime?: string;
    location?: string;
  };
  payer_details: {
    payerId: string;
    payerEmail: string;
    firstName: string;
    lastName: string;
  };
}

interface TransactionTableData extends OrganizationPayment {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface TransactionsTableProps {
  transactions: OrganizationPayment[];
  organization: Organization;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  organization,
}) => {
  const [tableData, setTableData] = useState<TransactionTableData[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [debouncedFilterText] = useDebounce(filterText, 300);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionTableData | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (transactions.length) {
      const data = transactions.map((transaction) => ({
        ...transaction,
        open: false,
        setOpen: (open: boolean) => {
          setTableData((prevData) =>
            prevData.map((item) =>
              item.paymentId === transaction.paymentId ? { ...item, open } : item
            )
          );
        },
      }));
      setTableData(data);
    }
  }, [transactions]);

  const columns = [
    {
      name: "Invoice ID",
      selector: (row: TransactionTableData) => row.invoiceId,
      sortable: true,
    },
    {
      name: "Amount",
      selector: (row: TransactionTableData) => row.amount,
      sortable: true,
      cell: (row: TransactionTableData) => `$${row.amount.toFixed(2)}`,
    },
    {
      name: "Type",
      selector: (row: TransactionTableData) => row.type,
      sortable: true,
      cell: (row: TransactionTableData) => <span className="capitalize">{row.type}</span>,
    },
    {
      name: "Status",
      selector: (row: TransactionTableData) => row.status,
      sortable: true,
      cell: (row: TransactionTableData) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.status === "COMPLETED"
              ? "bg-green-800 text-green-200"
              : "bg-yellow-800 text-yellow-200"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Date",
      selector: (row: TransactionTableData) => row.created_at,
      sortable: true,
      cell: (row: TransactionTableData) =>
        new Date(row.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
    },
  ];

  const handleRowClick = (row: TransactionTableData) => {
    setSelectedTransaction(row);
  };

  const filteredData = useMemo(
    () =>
      tableData.filter((item) => {
        if (!debouncedFilterText) return true;
        return (
          item.invoiceId.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
          item.type.toLowerCase().includes(debouncedFilterText.toLowerCase()) ||
          item.status.toLowerCase().includes(debouncedFilterText.toLowerCase())
        );
      }),
    [debouncedFilterText, tableData]
  );

  const subHeaderComponent = (
    <input
      type="text"
      placeholder="Search..."
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
      className="block rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
    />
  );

  const mobileCard = (row: TransactionTableData) => (
    <div 
      className="bg-charleston p-4 rounded-lg mb-4 border border-[#525252] cursor-pointer hover:bg-[#2c2c2c]"
      onClick={() => handleRowClick(row)}
    >
      <div className="space-y-2">
        <div>
          <span className="text-gray-400">Invoice ID:</span>{" "}
          <span className="text-white">{row.invoiceId}</span>
        </div>
        <div>
          <span className="text-gray-400">Amount:</span>{" "}
          <span className="text-white">${row.amount.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400">Type:</span>{" "}
          <span className="text-white capitalize">{row.type}</span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>{" "}
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              row.status === "COMPLETED"
                ? "bg-green-800 text-green-200"
                : "bg-yellow-800 text-yellow-200"
            }`}
          >
            {row.status}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Date:</span>{" "}
          <span className="text-white">
            {new Date(row.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );

  if (!isMounted) {
    return <Preloader />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">
            {organization.name} Transactions
          </h1>
          <p className="mt-2 text-sm text-light">
            A list of all the transactions for {organization.name} including invoice ID,
            amount, type, status, and date.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 mb-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-[#525252] bg-charleston px-3 py-2 text-light shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>

        {tableData.length > 0 ? (
          <>
            {/* Mobile view */}
            <div className="block sm:hidden">
              {filteredData.map((row, index) => (
                <div key={index}>{mobileCard(row)}</div>
              ))}
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block">
              <DataTable
                columns={columns as TableColumn<unknown>[]}
                data={filteredData}
                pagination
                highlightOnHover
                subHeader
                subHeaderComponent={subHeaderComponent}
                customStyles={{
                  header: {
                    style: {
                      backgroundColor: "rgb(36, 36, 36)",
                      color: "rgb(255, 255, 255)",
                    },
                  },
                  subHeader: {
                    style: {
                      backgroundColor: "none",
                      color: "rgb(255, 255, 255)",
                      padding: 0,
                      marginBottom: 10,
                    },
                  },
                  rows: {
                    style: {
                      minHeight: "6vh",
                      backgroundColor: "rgb(33, 33, 33)",
                      color: "rgb(255, 255, 255)",
                    },
                  },
                  headCells: {
                    style: {
                      backgroundColor: "rgb(36, 36, 36)",
                      color: "rgb(255, 255, 255)",
                    },
                  },
                  cells: {
                    style: {
                      backgroundColor: "rgb(33, 33, 33)",
                      color: "rgb(255, 255, 255)",
                    },
                  },
                  pagination: {
                    style: {
                      backgroundColor: "rgb(33, 33, 33)",
                      color: "rgb(255, 255, 255)",
                    },
                  },
                }}
                onRowClicked={(row) => handleRowClick(row as TransactionTableData)}
                pointerOnHover
                noDataComponent={
                  <div className="p-4 text-center text-light">No transactions found</div>
                }
              />
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-light">No transactions found</div>
        )}
      </div>

      <Transition.Root show={!!selectedTransaction} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setSelectedTransaction(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-eerieblack py-6 shadow-xl">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-xl font-semibold leading-6 text-light">
                            Transaction Details
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md text-gray-400 hover:text-light focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={() => setSelectedTransaction(null)}
                            >
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        {selectedTransaction && (
                          <div className="space-y-6">
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-2 text-lg font-medium text-light">
                                Transaction Information
                              </h3>
                              <div className="space-y-2 text-gray-300">
                                <p>
                                  <span className="font-semibold">Invoice ID:</span>{" "}
                                  {selectedTransaction.invoiceId}
                                </p>
                                <p>
                                  <span className="font-semibold">Amount:</span> $
                                  {selectedTransaction.amount.toFixed(2)}
                                </p>
                                <p>
                                  <span className="font-semibold">Type:</span>{" "}
                                  <span className="capitalize">
                                    {selectedTransaction.type}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-semibold">Status:</span>{" "}
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                      selectedTransaction.status === "COMPLETED"
                                        ? "bg-green-800 text-green-200"
                                        : "bg-yellow-800 text-yellow-200"
                                    }`}
                                  >
                                    {selectedTransaction.status}
                                  </span>
                                </p>
                                <p>
                                  <span className="font-semibold">Date:</span>{" "}
                                  {new Date(
                                    selectedTransaction.created_at
                                  ).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                    hour12: true,
                                  })}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Payment Frequency:
                                  </span>{" "}
                                  <span className="capitalize">
                                    {selectedTransaction.payment_frequency}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-2 text-lg font-medium text-light">
                                Payer Details
                              </h3>
                              <div className="space-y-2 text-gray-300">
                                <p>
                                  <span className="font-semibold">Name:</span>{" "}
                                  {selectedTransaction.payer_details.firstName}{" "}
                                  {selectedTransaction.payer_details.lastName}
                                </p>
                                <p>
                                  <span className="font-semibold">Email:</span>{" "}
                                  {selectedTransaction.payer_details.payerEmail}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-charleston p-4">
                              <h3 className="mb-2 text-lg font-medium text-light">
                                Transaction Details
                              </h3>
                              <div className="space-y-2 text-gray-300">
                                {selectedTransaction.type === "event" && selectedTransaction.details && (
                                  <>
                                    <p>
                                      <span className="font-semibold">Event Title:</span>{" "}
                                      {selectedTransaction.details.title || "N/A"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Description:</span>{" "}
                                      {selectedTransaction.details.description || "N/A"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Event Date:</span>{" "}
                                      {selectedTransaction.details.eventDateTime
                                        ? new Date(selectedTransaction.details.eventDateTime).toLocaleString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "numeric",
                                            hour12: true,
                                          })
                                        : "N/A"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Location:</span>{" "}
                                      {selectedTransaction.details.location || "N/A"}
                                    </p>
                                  </>
                                )}
                                {selectedTransaction.type === "membership" && selectedTransaction.details && (
                                  <>
                                    <p>
                                      <span className="font-semibold">
                                        Membership Name:
                                      </span>{" "}
                                      {selectedTransaction.details.name || "N/A"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Description:</span>{" "}
                                      {selectedTransaction.details.description || "N/A"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        Registration Fee:
                                      </span>{" "}
                                      ${selectedTransaction.details.registrationFee
                                        ? selectedTransaction.details.registrationFee.toFixed(2)
                                        : "N/A"}
                                    </p>
                                    {selectedTransaction.details.features && Object.keys(selectedTransaction.details.features).length > 0 && (
                                      <div>
                                        <span className="font-semibold">Features:</span>
                                        <ul className="list-disc pl-5">
                                          {Object.entries(selectedTransaction.details.features).map(
                                            ([key, value]) => (
                                              <li key={key}>{value}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="mt-6">
                              <a
                                href={selectedTransaction.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              >
                                View Invoice
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default TransactionsTable;
