export default function Divider() {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="h-full border-l border-gray-300" />
      </div>
    </div>
  );
}
