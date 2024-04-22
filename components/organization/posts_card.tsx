const PostsCard = ({ post }) => {
  const { imageUrl, title, description } = post;

  return (
    <div className="mb-4 overflow-hidden rounded-lg bg-raisinblack shadow-lg">
      {/* Check if the post has an image */}
      {imageUrl && (
        <div className="h-40 overflow-hidden">
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-light">{title}</h3>
        <p className="mt-2 text-sm text-light">{description}</p>
      </div>
    </div>
  );
};

export default PostsCard;
