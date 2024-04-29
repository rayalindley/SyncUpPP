import { UserGroupIcon } from "@heroicons/react/24/outline";

const EventsCard = ({ event }) => {
  const { imageUrl, title, description, attendees } = event;

  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-raisinblack shadow-lg lg:w-96">
      <div className="h-40 overflow-hidden">
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-light">{title}</h3>
        <p className="mt-2 text-sm text-light">{description}</p>
        <div className="mt-3 flex items-center">
          <UserGroupIcon className="mr-2 h-5 w-5 text-primary" />
          <span className="text-sm text-light">Attendees: {attendees}</span>
          <button className="ml-auto rounded bg-primary px-4 py-2 font-semibold text-white hover:bg-primarydark focus:outline-none">
            Join Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsCard;
