"use client";
import React, { useCallback, useEffect } from "react";
import { Drawer } from "vaul";
import { SearchBar } from "./SearchBar.jsx";
import { ResultsContainer } from "./ResultsContainer.jsx";
import useMapStore from "../store/useMapStore";

const SNAP_POINTS = [0.15, 0.5, 1];

export function MobileDrawer({ resorts, displayedResorts, setSearchResults }) {
  const selectedResort = useMapStore((s) => s.selectedResort);
  const setSelectedResort = useMapStore((s) => s.setSelectedResort);
  const setDrawerSnap = useMapStore((s) => s.setDrawerSnap);
  const drawerSnap = useMapStore((s) => s.drawerSnap);

  const onSnapChange = useCallback(
    (snap) => {
      if (snap !== undefined && snap !== null) {
        setDrawerSnap(snap);
      }
    },
    [setDrawerSnap]
  );

  // When a resort is selected (from map tap), snap to half
  useEffect(() => {
    if (selectedResort && drawerSnap < 0.5) {
      setDrawerSnap(0.5);
    }
  }, [selectedResort]);

  return (
    <Drawer.Root
      snapPoints={SNAP_POINTS}
      activeSnapPoint={drawerSnap}
      setActiveSnapPoint={onSnapChange}
      modal={false}
      dismissible={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" style={{ display: drawerSnap >= 1 ? "block" : "none" }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl backdrop-blur-xl bg-slate-900/95 outline-none"
          style={{ height: "100dvh" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
          </div>

          {/* Search bar — always visible in peek */}
          <div className="px-4 pb-2">
            <SearchBar data={resorts} setSearchResults={setSearchResults} variant="dark" />
          </div>

          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto px-4 pb-8"
            style={{ pointerEvents: drawerSnap <= 0.15 ? "none" : "auto" }}
          >
            <ResultsContainer
              resorts={displayedResorts}
              setSelectedResort={(resort) => {
                setSelectedResort(resort);
                setDrawerSnap(0.5);
              }}
              selectedResort={selectedResort}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
