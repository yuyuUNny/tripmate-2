"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Destination } from "../workspace-context";

function FitRoute({ destinations }: { destinations: Destination[] }) {
  const map = useMap();

  useEffect(() => {
    const points = destinations.map((destination) => L.latLng(destination.latitude, destination.longitude));
    if (points.length === 1) map.setView(points[0], 9);
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 9 });
  }, [destinations, map]);

  return null;
}

export default function RouteMap({ destinations }: { destinations: Destination[] }) {
  const mappedDestinations = useMemo(() => destinations.filter((destination) => Number.isFinite(destination.latitude) && Number.isFinite(destination.longitude)), [destinations]);
  const icons = useMemo(() => mappedDestinations.map((_, index) => L.divIcon({
    className: "tmw-leaflet-pin-shell",
    html: `<span class="tmw-leaflet-pin"><b>${index + 1}</b></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    popupAnchor: [0, -34],
  })), [mappedDestinations]);
  const route = mappedDestinations.map((destination) => [destination.latitude, destination.longitude] as [number, number]);
  const first = route[0] ?? [20, 0];

  if (!mappedDestinations.length) return <div className="tmw-map-loading">Search for the city again to place it on the map.</div>;

  return (
    <MapContainer center={first} zoom={mappedDestinations.length === 1 ? 9 : 3} className="tmw-leaflet-map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {route.length > 1 && <Polyline positions={route} pathOptions={{ color: "#39776a", weight: 3, opacity: 0.82, dashArray: "8 8" }} />}
      {mappedDestinations.map((destination, index) => (
        <Marker key={destination.id} position={[destination.latitude, destination.longitude]} icon={icons[index]}>
          <Popup><strong>{destination.city}</strong><br />{destination.country}</Popup>
        </Marker>
      ))}
      <FitRoute destinations={mappedDestinations} />
    </MapContainer>
  );
}
