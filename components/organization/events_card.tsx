const EventsCard = ({ event }) => {
  const { imageUrl, title, description, registrationfee, location } = event;
  const hasImageUrl = !!imageUrl; // Check if imageUrl is provided
  const truncatedDescription =
    description.length > 250 ? `${description.slice(0, 250)}...` : description;

  // const truncatedDescription = description;

  // Determine the content for the registration tag
  const registrationTagContent =
    registrationfee && parseFloat(registrationfee) !== null
      ? `$${registrationfee}`
      : "Free";

  // Determine the content for the location tag
  const locationTagContent =
    location && location.startsWith("http") ? "Virtual" : "On-Site";

  // Define the base URL for your Supabase storage bucket
  const supabaseStorageBaseUrl =
    "https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public";

  return (
    <div className="mb-4 flex max-h-96 flex-col overflow-hidden rounded-lg bg-raisinblack shadow-lg lg:w-96">
      <div className="h-40 overflow-hidden">
        {hasImageUrl ? (
          <img
            src={`${supabaseStorageBaseUrl}/${imageUrl}`} // Combine the base URL and image URL
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-white" /> // Render white background if no imageUrl
        )}
      </div>
      <div className="flex flex-grow flex-col justify-between p-4">
        <div>
          <h3 className="text-lg font-semibold text-light">{title}</h3>
          <p className="mt-2 text-justify text-sm text-light">{truncatedDescription}</p>
        </div>
        <div className="mt-3 flex items-center">
          {/* Registration Tag */}
          <div className="mr-2 rounded-lg bg-charleston px-2 py-1 text-sm font-semibold text-white ring-1 ring-primary">
            {registrationTagContent}
          </div>
          {/* Location Tag */}
          <div className="rounded-lg bg-charleston px-2 py-1 text-sm font-semibold text-white ring-1 ring-primary">
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
