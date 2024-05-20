export default function Divider({ width }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className={`w-${width || "full"} border-t border-[#525252]`} />
      </div>
    </div>
  );
}
