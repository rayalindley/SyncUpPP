"use client";

interface LoaderProps {
  /** If true, covers the whole screen and blocks clicks */
  isOverlay?: boolean;
  /** Primary text to display */
  text?: string;
  /** Secondary smaller text (optional) */
  subtext?: string;
}

const Loader = ({ 
  isOverlay = false, 
  text = "Loading...", 
  subtext 
}: LoaderProps) => {

  const spinner = (
    <div
      className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
        {spinner}
        <p className="mt-4 text-lg font-semibold text-white">{text}</p>
        {subtext && <p className="mt-1 text-sm text-gray-300">{subtext}</p>}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {spinner}
      {text !== "Loading..." && <p className="mt-4 text-sm text-gray-400">{text}</p>}
    </div>
  );
};

export default Loader;
