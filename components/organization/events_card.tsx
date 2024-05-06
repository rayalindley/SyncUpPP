const EventsCard = ({ event }) => {
  const { imageUrl, title, description, registrationfee, location } = event;
  const hasImageUrl = !!imageUrl; // Check if imageUrl is provided
  const truncatedDescription =
    description.length > 50 ? `${description.slice(0, 50)}...` : description;

  // Determine the content for the registration tag
  const registrationTagContent =
    registrationfee && parseFloat(registrationfee) !== null
      ? `$${registrationfee}`
      : "Free";

  // Determine the content for the location tag
  const locationTagContent =
    location && location.startsWith("http") ? "Virtual" : "On-Site";

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
          {/* Registration Tag */}
          <div className="mr-2 rounded-lg bg-blue-500 px-2 py-1 text-sm font-semibold text-white">
            {registrationTagContent}
          </div>
          {/* Location Tag */}
          <div className="rounded-lg bg-green-500 px-2 py-1 text-sm font-semibold text-white">
            {locationTagContent}
          </div>
          <button className="ml-auto rounded bg-primary px-4 py-2 font-semibold text-white hover:bg-primarydark focus:outline-none">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsCard;
