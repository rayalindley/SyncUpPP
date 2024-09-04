import React, { useState, useEffect } from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { EventModel } from "@/models/eventModel";
import { styled } from "@mui/material/styles";

const StyledDataGrid = styled(DataGrid)({
  '& .MuiDataGrid-root': {
    color: '#fff',
  },
  '& .MuiDataGrid-cell': {
    color: '#fff',
    borderBottom: '1px solid #404040',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#505050',
    borderBottom: '1px solid #404040',
    color: '#000',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 'bold',
  },
  '& .MuiDataGrid-row': {
    '&:nth-of-type(odd)': {
      backgroundColor: '#505050',
    },
    '&:nth-of-type(even)': {
      backgroundColor: '#404040',
    },
  },
  '& .MuiDataGrid-sortIcon': {
    display: 'none',
  },
  '& .MuiTablePagination-root': {
    color: '#fff',
  },
  '& .MuiTablePagination-caption': {
    color: '#fff',
  },
  '& .MuiTablePagination-selectIcon': {
    color: '#fff',
  },
  '& .MuiTablePagination-displayedRows': {
    color: '#fff',
  },
});

const EventsTable = ({
  events,
  setEvents,
  toggleSelection,
}: {
  events: EventModel[];
  setEvents: React.Dispatch<React.SetStateAction<EventModel[]>>;
  toggleSelection: (list: EventModel[], id: string) => EventModel[];
}) => {
  const [sortModel, setSortModel] = useState<{ field: keyof EventModel; sort: 'asc' | 'desc' }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  useEffect(() => {
    const search = searchTerm.toLowerCase();
    const filtered = events.filter((event) =>
      ["title", "description", "location", "registrationfee", "capacity", "privacy", "tags"].some(
        (field) => {
          const getter = event[`get${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof EventModel] as ((this: EventModel) => string | number | boolean | Date | string[] | undefined);
          if (typeof getter === 'function') {
            const value = getter.call(event);
            if (value != null) {
              if (Array.isArray(value)) {
                return value.some(item => item.toString().toLowerCase().includes(search));
              }
              return value.toString().toLowerCase().includes(search);
            }
          }
          return false;
        }
      )
    );
    setFilteredEvents(filtered);
  }, [events, searchTerm]);

  const handleSortModelChange = (model: { field: keyof EventModel; sort: 'asc' | 'desc' }[]) => {
    setSortModel(model);
    if (model.length > 0) {
      const { field, sort } = model[0];
      setFilteredEvents(
        [...filteredEvents].sort((a, b) => {
          const aGetter = a[`get${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof EventModel] as (this: EventModel) => any;
          const bGetter = b[`get${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof EventModel] as (this: EventModel) => any;
          const aValue = typeof aGetter === 'function' ? aGetter.call(a) : undefined;
          const bValue = typeof bGetter === 'function' ? bGetter.call(b) : undefined;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;
          return sort === "asc" ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
        })
      );
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) ? `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}-${("0" + d.getDate()).slice(-2)}` : "";
  };

  const truncateText = (text: string, maxLength: number) => (text?.length > maxLength ? text.slice(0, maxLength) + "..." : text);

  const columns: GridColDef[] = [
    { 
      field: "title", 
      headerName: "Title", 
      width: 150, 
      sortable: true, 
      valueGetter: (params: GridRenderCellParams<EventModel>) => params.row?.getTitle?.() || ''
    },
    { 
      field: "description", 
      headerName: "Description", 
      width: 150, 
      sortable: true, 
      renderCell: (params: GridRenderCellParams<EventModel>) => truncateText(params.row?.getDescription?.() || '', 30) 
    },
    { 
      field: "location", 
      headerName: "Location", 
      width: 150, 
      sortable: true, 
      renderCell: (params: GridRenderCellParams<EventModel>) => truncateText(params.row?.getLocation?.() || '', 30) 
    },
    { 
      field: "registrationfee", 
      headerName: "Registration Fee", 
      width: 150, 
      sortable: true, 
      valueGetter: (params: GridRenderCellParams<EventModel>) => params.row?.getRegistrationFee?.() || ''
    },
    { 
      field: "createdat", 
      headerName: "Created At", 
      width: 150, 
      sortable: true, 
      renderCell: (params: GridRenderCellParams<EventModel>) => formatDate(params.row?.getCreatedAt?.() || '') 
    },
    { 
      field: "capacity", 
      headerName: "Capacity", 
      width: 150, 
      sortable: true, 
      valueGetter: (params: GridRenderCellParams<EventModel>) => params.row?.getCapacity?.() || ''
    },
    { 
      field: "privacy", 
      headerName: "Privacy", 
      width: 150, 
      sortable: true, 
      valueGetter: (params: GridRenderCellParams<EventModel>) => params.row?.getPrivacy?.() || ''
    },
    { 
      field: "tags", 
      headerName: "Tags", 
      width: 150, 
      sortable: true, 
      renderCell: (params: GridRenderCellParams<EventModel>) => truncateText(params.row?.getTags?.()?.join(", ") || '', 30) 
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        {events.length > 0 && (
          <input
            className="my-2.5 rounded-full border border-gray-300 bg-charleston p-2.5"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPaginationModel({ ...paginationModel, page: 0 });
            }}
            aria-label="Search events"
          />
        )}
      </div>
      <div style={{ height: 400, width: '100%' }}>
        <StyledDataGrid
          rows={filteredEvents.map(event => ({
            id: event.getEventId?.() || '',
            title: event.getTitle?.() || '',
            description: event.getDescription?.() || '',
            location: event.getLocation?.() || '',
            registrationfee: event.getRegistrationFee?.() || '',
            createdat: event.getCreatedAt?.() || '',
            capacity: event.getCapacity?.() || '',
            privacy: event.getPrivacy?.() || '',
            tags: event.getTags?.() || [],
            eventid: event.getEventId?.() || '',
          }))}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={(model) => handleSortModelChange(model as { field: keyof EventModel; sort: "asc" | "desc"; }[])}
          checkboxSelection
          disableRowSelectionOnClick
          getRowId={(row) => row.eventid}
          slots={{
            columnSortedAscendingIcon: () => <span>🡩</span>,
            columnSortedDescendingIcon: () => <span>🡣</span>,
          }}
        />
      </div>
    </div>
  );
};

export default EventsTable;
