import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent, Marker as LeafletMarker } from "leaflet";
import L from "leaflet";

// Fix default icon URLs broken by webpack/vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface DraggableMarkerProps {
  position: LatLng;
  onChange: (pos: LatLng) => void;
}

function DraggableMarker({ position, onChange }: DraggableMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <Marker
      draggable
      position={[position.lat, position.lng]}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const { lat, lng } = marker.getLatLng();
            onChange({ lat, lng });
          }
        },
      }}
    />
  );
}

interface MapPickerProps {
  value: LatLng;
  onChange: (pos: LatLng) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={14}
      style={{ height: "300px", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker position={value} onChange={onChange} />
    </MapContainer>
  );
}
