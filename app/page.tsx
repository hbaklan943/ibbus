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
import { LineList, Line } from "./api/proxyLineList/route";

const INITIAL_CENTER: LngLatLike = [29.09639, 41.12451];
const INITIAL_ZOOM = 11.1;
const DEFAULT_LINE = "15A";

const getLineVehiclePosition = async (lineCode: string | null) => {
  try {
    if (!lineCode) {
      console.error("Line code is required");
      return [];
    }
    const response = await fetch(
      `/api/proxyVehiclePosition?hatNo=${lineCode}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("Error fetching vehicle position:", data.error);
    }
    return data;
  } catch (error) {
    console.error("Error fetching line vehicle position:", error);
    return [];
  }
};

const getLineList = async (): Promise<LineList> => {
  try {
    const response = await fetch("/api/proxyLineList", {
      method: "POST",
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error fetching line list:", data.error);
      return [];
    }
    return data;
  } catch (error) {
    console.error("Error fetching line list:", error);
    return [];
  }
};

export default function Home() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>(
    []
  );
  const [lineList, setLineList] = useState<LineList>([]);
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize map
  useEffect(() => {
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

  // Fetch line list and set default line
  useEffect(() => {
    const initializeData = async () => {
      const lines = await getLineList();
      setLineList(lines);

      // Set default line after getting the line list
      const defaultLine = lines.find((line) => line.SHATKODU === DEFAULT_LINE);
      if (defaultLine) {
        setSelectedLine(defaultLine);
      }
    };

    initializeData();
  }, []);

  // Fetch vehicle positions when selected line changes
  useEffect(() => {
    const fetchVehiclePositions = async () => {
      if (selectedLine) {
        setLoading(true);
        try {
          const data = await getLineVehiclePosition(selectedLine.SHATKODU);
          setVehiclePositions(data || []);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVehiclePositions();
  }, [selectedLine]);

  // Update markers when vehicle positions change
  useEffect(() => {
    if (vehiclePositions && mapRef.current) {
      const existingMarkers = document.querySelectorAll(".mapboxgl-marker");
      existingMarkers.forEach((marker) => marker.remove());

      vehiclePositions.forEach((vehicle) => {
        const { enlem: lat, boylam: lng } = vehicle;
        const markerElement = document.createElement("div");
        const icon = createRoot(markerElement);
        icon.render(
          <DirectionsBusIcon sx={{ color: pink.A400, fontSize: 40 }} />
        );

        new Marker(markerElement)
          .setLngLat([parseFloat(lng), parseFloat(lat)])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h3>Yon: ${vehicle.yon}</h3>
                <h3>Son konum zamani: ${vehicle.son_konum_zamani}</h3>
                <h3>Yakin durak kodu: ${vehicle.yakinDurakKodu}</h3>
                <h3>Hat ad: ${vehicle.hatad}</h3>
                <h3>Hat kodu: ${vehicle.hatkodu}</h3>
                <h3>Guzergah kodu: ${vehicle.guzergahkodu}</h3>`
            )
          )
          .addTo(mapRef.current!);
      });
    }
  }, [vehiclePositions]);

  const handleRefreshClick = () => {
    if (selectedLine) {
      getLineVehiclePosition(selectedLine.SHATKODU).then((data) => {
        setVehiclePositions(data);
      });
    }
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
        onClick={handleRefreshClick}
      />
      <Autocomplete
        className="line-select"
        disablePortal
        options={lineList}
        getOptionLabel={(option: Line) => option.SHATKODU}
        isOptionEqualToValue={(option: Line, value: Line) =>
          option.SHATKODU === value.SHATKODU
        }
        value={selectedLine}
        onChange={(event, value: Line | null) => {
          setSelectedLine(value);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Hat Kodu"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#000",
                fontFamily: "monospace",
                fontWeight: "bold",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#000",
                  borderWidth: "2px",
                },
              },
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
