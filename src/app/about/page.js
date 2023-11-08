import Link from "next/link";
import "../globals.css";

export default function Page() {
  return (
    <div className="relative isolate h-screen overflow-hidden pt-14">
      <div
        className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%]  bg-white shadow-xl sm:-mr-80 lg:-mr-96"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-7xl px-6 py-4 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
          <h1 className=" max-w-2xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:col-span-2 xl:col-auto">
            Search Epic and Ikon Resorts with an Intuitive Interface.
          </h1>
          <div className="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
            <p className="text-lg leading-8 text-gray-600">
              Skimail shows you all of the Epic and Ikon ski resorts on a world
              map. Customize the map view by toggling data rich layers. Quickly
              fly to regions using the airplane dropdown. Select a resort to
              view a 3D map of the ski slope and additional resort information.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Explore
              </Link>
            </div>
          </div>

          <img
            src="https://ik.imagekit.io/bamlnhgnz/skimail-hero.png"
            alt=""
            className="my-8 mt-10 aspect-[1/1] w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36"
          />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24  from-white sm:h-32" />
    </div>
  );
}
