"use client";
export function Card({ name, description, url }) {
  return (
    <div>
      <a href={url} target="_blank">
        <div className=" lg:w-full w-72 h-full mx-2 rounded overflow-hidden shadow-lg border-solid border-2">
          <div className="px-6 py-4">
            <div className="text-gray-700 ml-1 font-semibold text-xl mb-2">
              {name}
            </div>
            <p className="text-gray-700 text-base">{description}</p>
          </div>
          <div className="px-6 pt-4 pb-2">
            <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"></span>
          </div>
        </div>
      </a>
    </div>
  );
}
