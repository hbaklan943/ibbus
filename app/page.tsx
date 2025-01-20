"use client";

import { createRoot } from "react-dom/client";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useRef, useEffect, useState } from "react";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import { VehiclePosition } from "./api/proxyVehiclePosition/route";
import { StopDetail } from "./api/proxyStopDetail/route";
import "mapbox-gl/dist/mapbox-gl.css";
import { Marker } from "mapbox-gl";
import { LineList, Line } from "./api/proxyLineList/route";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import Image from "next/image";

const INITIAL_CENTER: LngLatLike = [29.09639, 41.12451];
const INITIAL_ZOOM = 11.1;
const numberOfSelections = 5; // Number of line selections, should be more than 1
const colors = ["#ec407a", "#2979ff", "#ffab00", "#8d6e63", "#d500f9"];
const TARGET_TIMER = 0;
const INITIAL_TIMER = 25;

const getStopList = async (lineCode: string | null): Promise<StopDetail[]> => {
  try {
    if (!lineCode) {
      console.error("Line code is required");
      return [];
    }
    const response = await fetch(`/api/proxyStopDetail?hatNo=${lineCode}`, {
      method: "POST",
    });

    const data = await response.json();
    if (data.error) {
      console.error("Error fetching stop list:", data.error);
      return [];
    }
    return data;
  } catch (error) {
    console.error("Error fetching stop list:", error);
    return [];
  }
};

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
      return [];
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

// if local storage has saved lines set them
const getInitialselectedLines = (): Line[] => {
  const defaultSelectedLines = [
    {
      HAT_UZUNLUGU: 0,
      SEFER_SURESI: 0,
      SHATADI: "Hat Adı",
      SHATKODU: "",
      TARIFE: "0",
    },
  ];
  if (typeof window !== "undefined") {
    return JSON.parse(
      localStorage.getItem("selectedLines") ||
        JSON.stringify(defaultSelectedLines) // dirty tricks
    ) as Line[];
  } else {
    return defaultSelectedLines;
  }
};

export default function Home() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[][]>(
    [[]]
  ); // :(  fix this bro (it can be better)
  const [stopList, setStopList] = useState<StopDetail[]>([]);
  const [lineList, setLineList] = useState<LineList>([]);
  const [selectedLines, setSelectedLines] = useState<Line[]>(
    getInitialselectedLines
  );
  const [loading, setLoading] = useState(false);
  const [timeToRefresh, setTimeToRefresh] = useState(INITIAL_TIMER);
  const interval = useRef<NodeJS.Timeout | null>(null);

  // Initialize map and geolocate control and set first selection enabled
  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiaGFydW4tYmFrbGFuIiwiYSI6ImNtM3E2NDY0bjBsa28ya3NhMnM0bWpqNTYifQ.DB6xtdb0Q0HAYDW3vYkmng";
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        attributionControl: false,
        style: "mapbox://styles/mapbox/streets-v12?optimize=true", // optimize=true
      });
    }

    // Add geolocate control to the map.
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    if (mapRef.current) {
      mapRef.current.addControl(geolocate);
    }

    mapRef.current?.on("load", () => {
      geolocate.trigger();
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Fetch line list
  useEffect(() => {
    const initializeData = async () => {
      const lines = await getLineList();
      setLineList(lines);
    };
    initializeData();
  }, []);

  // Fetch vehicle positions when selected line changes
  // Also save selected Line to localstorage
  useEffect(() => {
    const fetchStopList = async () => {
      const newStopList: StopDetail[] = [];
      for (let i = 0; i < numberOfSelections; i++) {
        if (selectedLines[i] && selectedLines[i].SHATKODU) {
          setLoading(true); // TODO: set loading state only once for this whole effect (i mean twice for true and false)
          try {
            const data = await getStopList(selectedLines[i].SHATKODU);
            newStopList.push(...data);
          } catch (error) {
            console.log(error);
          } finally {
            setLoading(false);
          }
        }
      }
      setStopList(newStopList);
    };
    const fetchVehiclePositions = async () => {
      const newVehiclePositions: VehiclePosition[][] = new Array(
        selectedLines.length
      ).fill([]);
      for (let i = 0; i < numberOfSelections; i++) {
        if (selectedLines[i] && selectedLines[i].SHATKODU) {
          setLoading(true);
          try {
            const data = await getLineVehiclePosition(
              selectedLines[i].SHATKODU
            );
            newVehiclePositions[i] = data;
          } catch (error) {
            console.log(error);
          } finally {
            setLoading(false);
          }
        }
      }
      setVehiclePositions(newVehiclePositions);

      setTimeToRefresh(INITIAL_TIMER); // Reset/Start/Trigger timer
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedLines", JSON.stringify(selectedLines));
      //console.log("set key: ", JSON.stringify(selectedLines));
    }

    fetchStopList();
    fetchVehiclePositions();
  }, [selectedLines]);

  useEffect(() => {
    function handleTimer() {
      interval.current = setInterval(() => {
        setTimeToRefresh((time) => time - 1);
      }, 1000);
    }

    if (timeToRefresh <= TARGET_TIMER && interval.current) {
      // if time is up
      handleRefreshClick();
      clearInterval(interval.current);
    }

    if (timeToRefresh === INITIAL_TIMER) {
      if (interval.current) {
        clearInterval(interval.current); // to ensure only one interval is running, I'm pro
      }
      handleTimer();
    }
  }, [timeToRefresh]); // TODO: add missing dependencie "handleRefreshClick"

  // Update markers when vehicle positions change
  useEffect(() => {
    if (vehiclePositions && mapRef.current) {
      const existingMarkers = document.querySelectorAll(".vehicle-marker");
      existingMarkers.forEach((marker) => marker.remove()); // Remove existing markers

      vehiclePositions.forEach((vehicleList, index) => {
        vehicleList.forEach((vehicle) => {
          const { enlem: lat, boylam: lng } = vehicle;
          const markerElement = document.createElement("div");
          const icon = createRoot(markerElement);
          icon.render(
            <DirectionsBusIcon sx={{ color: colors[index], fontSize: 32 }} />
          );

          new Marker({
            className: "vehicle-marker", // oh yeah
            element: markerElement,
          })
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
      });
    }
    if (stopList && mapRef.current) {
      // TODO: Bad performance, fix this(take a look at layers on mapbox docs)
      const existingMarkers = document.querySelectorAll(".stop-marker");
      existingMarkers.forEach((marker) => marker.remove()); // Remove existing markers

      stopList.forEach((stop) => {
        const { XKOORDINATI: lng, YKOORDINATI: lat } = stop;
        const markerElement = document.createElement("div");
        const icon = createRoot(markerElement);
        icon.render(
          <Image
            src={"/stop_circles/pink_circle.svg"}
            alt={""}
            unoptimized
            width={8}
            height={8}
          />
        );

        new Marker({
          className: "stop-marker", // oh yeah
          element: markerElement,
        })
          .setLngLat([parseFloat(lng.toString()), parseFloat(lat.toString())])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<h3>Durak adi: ${stop.DURAKADI}</h3>
              <h3>Durak kodu: ${stop.DURAKKODU}</h3>
              <h3>Durak tipi: ${stop.DURAKTIPI}</h3>
              <h3>Isletme bolge: ${stop.ISLETMEBOLGE}</h3>
              <h3>Isletme alt bolge: ${stop.ISLETMEALTBOLGE}</h3>
              <h3>Ilce adi: ${stop.ILCEADI}</h3>`
            )
          )
          .addTo(mapRef.current!);
      });
    }
  }, [vehiclePositions, stopList]);

  const handleRefreshClick = () => {
    setSelectedLines([...selectedLines]);
  };

  return (
    <>
      {!loading && ( // TODO: Move this to a Seperate file(Component)
        <div // Refresh button
          style={{
            position: "fixed",
            zIndex: 3,
            right: 36,
            bottom: 36,
            color: "white",
            backgroundColor: "#000",
            borderRadius: "50%",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
            padding: 8,
          }}
          onClick={() => {
            if (!loading) {
              // prevent multiple clicks while loading
              handleRefreshClick();
            }
          }}
        >
          {selectedLines.length > 0 && selectedLines[0].SHATKODU && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                fontSize: 10,
                textAlign: "center",
                fontFamily: "monospace",
                fontWeight: "bold",
              }}
            >
              {timeToRefresh}
            </div>
          )}
          <RefreshRounded
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
              color: "white",
              borderRadius: "50%",
              backgroundColor: "#000",
              boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
              fontSize: 50,
              opacity: loading ? 0.5 : 1, // dim when loading
              cursor: loading ? "not-allowed" : "pointer",
            }}
          />
        </div>
      )}
      {loading && (
        <CircularProgress // TODO: Move this to the same component with refresh button and style it same
          sx={{
            position: "absolute",
            zIndex: 2,
            right: 24,
            bottom: 24,
            color: "white",
            borderRadius: "50%",
            backgroundColor: "#000",
            boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.5)",
          }}
        />
      )}
      <div className="selections">
        {
          // Render line selections
          selectedLines.map((line, index) => (
            <div className="selection" key={index}>
              <RemoveRoundedIcon
                sx={{
                  zIndex: 2,
                  right: 24,
                  bottom: 24,
                  color: "white",
                  borderRadius: "50%",
                  backgroundColor: colors[index],
                  boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.5)",
                }}
                onClick={() => {
                  setSelectedLines(
                    selectedLines.filter((line, idx) => idx != index)
                  );
                }}
              />
              <Autocomplete
                className="line-select"
                disablePortal
                loading={loading}
                options={lineList}
                getOptionLabel={(option: Line) => option.SHATKODU}
                isOptionEqualToValue={(option: Line, value: Line) =>
                  option.SHATKODU === value.SHATKODU
                }
                disableClearable={true}
                value={line}
                onChange={(event, value: Line) => {
                  const newSelectedLines = [...selectedLines];
                  newSelectedLines[index] = value;
                  setSelectedLines(newSelectedLines);
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
                        paddingY: "1px",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: colors[index],
                          borderWidth: "2px",
                          boxShadow: "0 0 2px 0 rgba(0, 0, 0, 0.5)",
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
            </div>
          ))
        }
        <AddRoundedIcon
          sx={{
            zIndex: 1,
            color: "white",
            fontSize: 45,
            textShadow: 3,
            cursor: "pointer",
            borderRadius: "20%",
            boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.5)",
            backgroundColor: "#000",
          }}
          onClick={() => {
            if (selectedLines.length < numberOfSelections) {
              setSelectedLines([
                ...selectedLines,
                {
                  HAT_UZUNLUGU: 0,
                  SEFER_SURESI: 0,
                  SHATADI: "Hat Adı",
                  SHATKODU: "",
                  TARIFE: "0",
                },
              ]);
            }
          }}
        />
      </div>
      <div id="map-container" ref={mapContainerRef} />
    </>
  );
}
