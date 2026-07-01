import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Info } from 'lucide-react';

interface LocationPickerMapProps {
  lat: number | string;
  lng: number | string;
  onChange: (lat: number, lng: number) => void;
  darkMode?: boolean;
  lang?: 'ar' | 'en';
}

const createPickerIcon = (lang: 'ar' | 'en') => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -top-10 bg-[#064E3B] text-white font-bold text-[10.5px] px-2.5 py-1 rounded-xl shadow-lg border border-emerald-600 whitespace-nowrap z-50">
          ${lang === 'ar' ? '📍 اسحبني لتحديد الموقع' : '📍 Drag me to place'}
        </div>
        <div class="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white shadow-xl border-2 border-white ring-4 ring-amber-500/30">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
      </div>
    `,
    className: 'custom-leaflet-marker-wrapper',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  darkMode = false,
  lang = 'ar'
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const parsedLat = parseFloat(String(lat)) || 31.7917;
  const parsedLng = parseFloat(String(lng)) || -7.0926;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [parsedLat, parsedLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    mapRef.current = map;

    // Add zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Apply beautiful CartoDB tile maps
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // Create Marker
    const markerIcon = createPickerIcon(lang);
    const marker = L.marker([parsedLat, parsedLng], {
      icon: markerIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // Handle drag end
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(position.lat, position.lng);
    });

    // Handle map click to reposition marker
    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      onChange(clickLat, clickLng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [darkMode]);

  // Handle external coordinates update (e.g. city select changes)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const currentMarkerLatLng = marker.getLatLng();
    // Update marker if the discrepancy is high (meaning it changed from city select)
    const diffLat = Math.abs(currentMarkerLatLng.lat - parsedLat);
    const diffLng = Math.abs(currentMarkerLatLng.lng - parsedLng);

    if (diffLat > 0.0001 || diffLng > 0.0001) {
      marker.setLatLng([parsedLat, parsedLng]);
      map.panTo([parsedLat, parsedLng], { animate: true });
    }
  }, [parsedLat, parsedLng]);

  return (
    <div className="space-y-2">
      <div 
        className={`relative w-full h-[220px] rounded-2xl overflow-hidden border transition-all duration-300 shadow-sm z-0 ${
          darkMode 
            ? 'bg-[#181817] border-stone-800' 
            : 'bg-[#F2F1EE] border-stone-200'
        }`}
      >
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instruction overlay */}
        <div className={`absolute bottom-3 right-3 left-3 z-[400] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[10px] font-sans font-bold shadow-sm pointer-events-none ${
          darkMode 
            ? 'bg-stone-900/95 border-stone-800 text-stone-300' 
            : 'bg-white/95 border-stone-200 text-stone-700'
        }`}>
          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
          <span>
            {lang === 'ar' 
              ? 'انقر على الخريطة أو اسحب الدبوس لتحديد الموقع بدقة' 
              : 'Click on the map or drag the pin to set precise location'}
          </span>
        </div>
      </div>
    </div>
  );
}
