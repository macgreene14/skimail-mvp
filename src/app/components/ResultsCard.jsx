"use client";
export function ResultsCard({ name, description, url }) {
  return (
    <a href={url} target="_blank">
      <div className="w-full rounded overflow-hidden shadow-lg border border-solid">
        <div className="px-6 py-4">
          <div className="text-gray-700 ml-2 font-semibold text-xl mb-2">
            {name}
          </div>
          <p className="text-gray-700 text-base">{description}</p>
        </div>
        <div className="px-6 pt-4 pb-2">
          <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"></span>
        </div>
      </div>
    </a>
  );
}
