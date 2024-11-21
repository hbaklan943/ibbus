"use client";

import { createRoot } from "react-dom/client";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

import { useRef, useEffect, useState } from "react";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import { VehiclePosition } from "./api/api";

import "mapbox-gl/dist/mapbox-gl.css";
import { Marker } from "mapbox-gl";
import { pink } from "@mui/material/colors";

const INITIAL_CENTER: LngLatLike = [29.09639, 41.12451];

const INITIAL_ZOOM = 12.76;

const getLineVehiclePosition = async () => {
  try {
    const response = await fetch("/api/proxyVehiclePosition?hatNo=15A", {
      method: "POST", // If you prefer, you can use GET instead
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error fetching vehicle position:", data.error);
    } else {
      console.log("Parsed JSON:", data);
      return data;
    }
    return data;
  } catch (error) {
    console.error("Error fetching line vehicle position:", error);
  }
};

export default function Home() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>();

  // In your frontend code

  useEffect(() => {
    getLineVehiclePosition().then((data) => {
      setVehiclePositions(data);
    });

    mapboxgl.accessToken =
      "pk.eyJ1IjoiaGFydW4tYmFrbGFuIiwiYSI6ImNtM3E2NDY0bjBsa28ya3NhMnM0bWpqNTYifQ.DB6xtdb0Q0HAYDW3vYkmng";
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    // If vehicle positions are available, add markers to the map
    if (vehiclePositions && mapRef.current) {
      // Remove existing markers if any
      const existingMarkers = document.querySelectorAll(".mapboxgl-marker");
      existingMarkers.forEach((marker) => marker.remove());

      vehiclePositions.forEach((vehicle) => {
        const { enlem: lat, boylam: lng } = vehicle; // Assuming your VehiclePosition has lat and lng properties

        // Create a new marker with an MUI icon
        const markerElement = document.createElement("div");
        const icon = createRoot(markerElement);
        icon.render(
          <DirectionsBusIcon sx={{ color: pink.A400, fontSize: 40 }} />
        );

        new Marker(markerElement)
          .setLngLat([parseFloat(lng), parseFloat(lat)]) // Set the position of the marker
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                `<h3>Yon: ${vehicle.yon}</h3><h3>Son konum zamani: ${vehicle.son_konum_zamani}</h3>
                <h3>Yakin durak kodu: ${vehicle.yakinDurakKodu}</h3>
                <h3>Hat ad: ${vehicle.hatad}</h3>
                <h3>Hat kodu: ${vehicle.hatkodu}</h3>
                <h3>Guzergah kodu: ${vehicle.guzergahkodu}</h3>`
              )
          )
          .addTo(mapRef.current!); // Add the marker to the map
      });
    }
  }, [vehiclePositions]);

  const handleButtonClick = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
      });
      console.log("Data:", vehiclePositions);
    }
  };

  return (
    <>
      <button id="reset-button" onClick={handleButtonClick}>
        Reset
      </button>
      <div id="map-container" ref={mapContainerRef} />
    </>
  );
}
