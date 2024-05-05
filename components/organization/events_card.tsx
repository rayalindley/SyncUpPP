import { UserGroupIcon } from "@heroicons/react/24/outline";

const EventsCard = ({ event }) => {
  const { imageUrl, title, description, attendees } = event;
  const hasImageUrl = !!imageUrl; // Check if imageUrl is provided
  const truncatedDescription =
    description.length > 50 ? `${description.slice(0, 50)}...` : description;
  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-raisinblack shadow-lg lg:w-96">
      <div className="h-40 overflow-hidden">
        {hasImageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-white" /> // Render white background if no imageUrl
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-light">{title}</h3>
        <p className="mt-2 text-sm text-light">{truncatedDescription}</p>
        <div className="mt-3 flex items-center">
          <UserGroupIcon className="mr-2 h-5 w-5 text-primary" />
          <span className="text-sm text-light">Attendees: {attendees}</span>
          <button className="ml-auto rounded bg-primary px-4 py-2 font-semibold text-white hover:bg-primarydark focus:outline-none">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsCard;
