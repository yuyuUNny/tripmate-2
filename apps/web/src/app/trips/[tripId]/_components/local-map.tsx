"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Destination, ItineraryStop } from "../workspace-context";

function FitLocalMap({ destination, stops }: { destination: Destination; stops: ItineraryStop[] }) {
  const map = useMap();

  useEffect(() => {
    const points = stops.map((stop) => L.latLng(stop.latitude!, stop.longitude!));
    if (!points.length) map.setView([destination.latitude, destination.longitude], 12);
    else if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
  }, [destination.latitude, destination.longitude, map, stops]);

  return null;
}

export default function LocalMap({ destination, stops }: { destination: Destination; stops: ItineraryStop[] }) {
  const mappedStops = useMemo(() => stops.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)), [stops]);
  const icons = useMemo(() => mappedStops.map((_, index) => L.divIcon({
    className: "tmw-leaflet-pin-shell",
    html: `<span class="tmw-leaflet-pin"><b>${index + 1}</b></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    popupAnchor: [0, -34],
  })), [mappedStops]);
  const route = mappedStops.map((stop) => [stop.latitude!, stop.longitude!] as [number, number]);

  return (
    <MapContainer center={[destination.latitude, destination.longitude]} zoom={12} className="tmw-local-leaflet-map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!mappedStops.length && <CircleMarker center={[destination.latitude, destination.longitude]} radius={7} pathOptions={{ color: "#39776a", fillColor: "#39776a", fillOpacity: 0.8 }}><Popup>{destination.city}</Popup></CircleMarker>}
      {route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#39776a", weight: 3, opacity: 0.82, dashArray: "8 8" }} />}
      {mappedStops.map((stop, index) => (
        <Marker key={stop.id} position={[stop.latitude!, stop.longitude!]} icon={icons[index]}>
          <Popup><strong>{stop.title}</strong><br />{stop.detail}</Popup>
        </Marker>
      ))}
      <FitLocalMap destination={destination} stops={mappedStops} />
    </MapContainer>
  );
}
