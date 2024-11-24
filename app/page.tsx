"use client";

import { createRoot } from "react-dom/client";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

import { useRef, useEffect, useState } from "react";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import { VehiclePosition } from "./api/api";

import "mapbox-gl/dist/mapbox-gl.css";
import { Marker } from "mapbox-gl";
import { pink } from "@mui/material/colors";

import { LineList } from "./api/proxyLineList/route";

const INITIAL_CENTER: LngLatLike = [29.09639, 41.12451];

const INITIAL_ZOOM = 11.1;

const getLineVehiclePosition = async () => {
  try {
    const response = await fetch("/api/proxyVehiclePosition?hatNo=15A", {
      method: "POST", // If you prefer, you can use GET instead
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error fetching vehicle position:", data.error);
    } else {
      //console.log("Parsed JSON:", data);
      return data;
    }
    return data;
  } catch (error) {
    console.error("Error fetching line vehicle position:", error);
  }
};

const getLineList = async (): Promise<LineList> => {
  try {
    const response = await fetch("/api/proxyLineList", {
      method: "POST", // If you prefer, you can use GET instead
    });

    const data = await response.json();
    console.log("Data:", data[0]);

    if (data.error) {
      console.error("Error fetching line list:", data.error);
      return [];
    } else {
      return data;
    }
  } catch (error) {
    console.error("Error fetching line list:", error);
    return [];
  }
};

export default function Home() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>();
  const [lineList, setLineList] = useState<LineList>([]);

  useEffect(() => {
    getLineList().then((data) => {
      setLineList(data);
    });

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
        attributionControl: false,
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
    /* if (mapRef.current) {
      mapRef.current.flyTo({
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
      });
      console.log("Data:", vehiclePositions);
    } */
    getLineVehiclePosition().then((data) => {
      setVehiclePositions(data);
    });
  };

  return (
    <>
      <RefreshRounded
        sx={{
          position: "absolute",
          zIndex: 1,
          right: 24,
          bottom: 24,
          color: "white",
          borderRadius: "50%",
          backgroundColor: "#000",
          boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
          fontSize: 40,
        }}
      />
      <Autocomplete
        className="line-select"
        disablePortal
        options={lineList.map((line) => {
          return { ...line, label: line.SHATKODU };
        })}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Hat Kodu"
            sx={{
              // Root class for the input field
              "& .MuiOutlinedInput-root": {
                color: "#000",
                fontFamily: "monospace",
                fontWeight: "bold",
                // Class for the border around the input field
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                  borderWidth: "2px",
                },
              },
              // Class for the label of the input field
              "& .MuiInputLabel-outlined": {
                color: "#000",
                fontWeight: "bold",
              },
            }}
          />
        )}
      />
      <div id="map-container" ref={mapContainerRef} />
    </>
  );
}
