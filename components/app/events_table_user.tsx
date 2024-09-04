"use client";
import { check_permissions } from "@/lib/organization";
import { Event } from "@/types/event";
import { Organization } from "@/types/organization";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EventOptions from "./event_options"; // Assuming you have EventOptions component

export default function EventsTableUser({
  organization,
  events,
  userId,
}: {
  organization: Organization;
  events: Event[];
  userId: string;
}) {
  const router = useRouter();
  const [canCreateEvents, setCanCreateEvents] = useState(false);

  // Redirect to the create event page for the selected organization
  const handleCreateEvent = () => {
    router.push(`/events/create/${organization.slug}`);
  };

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permission = await check_permissions(
          userId || "",
          organization.organizationid,
          "create_events"
        );
        setCanCreateEvents(permission);
      } catch (error) {
        console.error("Failed to check permissions", error);
      }
    };

    checkPermissions();
  }, [userId, organization.organizationid]);

  return (
    <div className="py-4 sm:px-6 lg:px-8">
      <div className="justify-between sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-light">Events</h1>
          <p className="mt-2 text-sm text-light">
            A list of all the events including their title, date and time, location,
            registration fee, capacity, and privacy.
          </p>
        </div>
        <div className="mt-4 sm:flex sm:items-center sm:space-x-2">
          {canCreateEvents && (
            <button
              onClick={handleCreateEvent}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primarydark"
            >
              Create Event
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-[#525252]">
                <thead className="bg-charleston">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light sm:pl-6"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Start Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      End Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Registration Fee
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Capacity
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light"
                    >
                      Privacy
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#525252] bg-raisinblack">
                  {events.map((event, index) => (
                    <EventRow key={index} event={event} userId={userId} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, userId }: { event: Event; userId: string }) {
  const [open, setOpen] = useState(false);
  // Convert eventdatetime to PST
  const formattedDateTime = (utcDateString: string) => {
    const date = new Date(utcDateString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Call the formattedDateTime function with the event's datetime
  const startEventDateTimePST = formattedDateTime(event.starteventdatetime.toString());
  const endEventDateTimePST = formattedDateTime(event.endeventdatetime.toString());
  return (
    <tr key={event.id}>
      <td
        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light sm:pl-6"
        onClick={() => setOpen(!open)}
      >
        <a href="#" className="hover:text-primary" onClick={() => setOpen(!open)}>
          {event.title}
        </a>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {startEventDateTimePST}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {endEventDateTimePST}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">{event.location}</td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {event.registrationfee || "N/A"}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">
        {event.capacity || "N/A"}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-light">{event.privacy}</td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <EventOptions
          selectedEvent={event}
          open={open}
          setOpen={setOpen}
          userId={userId}
        />
      </td>
    </tr>
  );
}
