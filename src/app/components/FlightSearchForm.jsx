import React, { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";

export function FlightSearchForm({ flightDates, setFlightDates }) {
  const handleValueChange = (newValue) => {
    console.log("newValue:", newValue);
    setFlightDates(newValue);
  };

  return (
    <div className="flex mx-auto w-5/12 relative z-30 gap-2 my-6">
      <input
        type="text"
        id="first-name"
        name="first-name"
        defaultValue="BZN"
        autoComplete="given-name"
        className=" w-3/12  rounded-md bg-gray-800 p-2 text-gray-300 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />
      <Datepicker
        value={flightDates}
        onChange={handleValueChange}
        className="w-3/4"
      />
      <button
        type="submit"
        onSumb
        className="w-3/12 rounded-md border border-transparent bg-gray-800 p-2 text-sm font-medium text-gray-300 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
      >
        Search
      </button>
    </div>
  );
}
