import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Check, Navigation } from 'lucide-react';
import L from 'leaflet';
import { TahfidCenter } from '../types';

interface InteractiveMapProps {
  centers: TahfidCenter[];
  selectedCenter: TahfidCenter | null;
  onSelectCenter: (center: TahfidCenter) => void;
  darkMode?: boolean;
}

const createCustomIcon = (isSelected: boolean, name: string) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        ${isSelected ? `
          <div class="absolute -top-10 bg-[#064E3B] text-white font-bold text-[10px] px-2.5 py-1 rounded-xl shadow-lg border border-emerald-600 whitespace-nowrap z-50">
            ${name}
          </div>
          <div class="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white shadow-xl border-2 border-white ring-4 ring-amber-500/30 animate-pulse">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
        ` : `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-800 text-white shadow-md border-2 border-white hover:bg-emerald-700 transition-colors duration-200">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            </svg>
          </div>
        `}
      </div>
    `,
    className: 'custom-leaflet-marker-wrapper',
    iconSize: isSelected ? [36, 36] : [28, 28],
    iconAnchor: isSelected ? [18, 18] : [14, 14],
  });
};

export default function InteractiveMap({
  centers,
  selectedCenter,
  onSelectCenter,
  darkMode = false
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing map if any
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const defaultLat = selectedCenter ? selectedCenter.lat : 31.7917;
    const defaultLng = selectedCenter ? selectedCenter.lng : -7.0926;
    const defaultZoom = selectedCenter ? 12 : 5.8;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    mapRef.current = map;

    // Add zoom control at the top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Apply CartoDB elegant open tile maps
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [darkMode]);

  // Handle markers update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    Object.keys(markersRef.current).forEach(key => {
      markersRef.current[key].remove();
    });
    markersRef.current = {};

    // Add markers for current centers
    centers.forEach(center => {
      if (!center.lat || !center.lng) return;

      const isSelected = selectedCenter?.id === center.id;
      const markerIcon = createCustomIcon(isSelected, center.name);

      const marker = L.marker([center.lat, center.lng], { icon: markerIcon })
        .addTo(map)
        .on('click', () => {
          onSelectCenter(center);
        });

      markersRef.current[center.id] = marker;
    });
  }, [centers, selectedCenter, onSelectCenter]);

  // Handle selected center panning
  useEffect(() => {
    const map = mapRef.current;
    if (map && selectedCenter && selectedCenter.lat && selectedCenter.lng) {
      map.flyTo([selectedCenter.lat, selectedCenter.lng], 13, {
        duration: 1.5,
        animate: true
      });
    }
  }, [selectedCenter]);

  const fitAllMarkers = () => {
    const map = mapRef.current;
    if (!map || centers.length === 0) return;

    const activeCenters = centers.filter(c => c.lat && c.lng);
    if (activeCenters.length === 0) return;

    const group = L.featureGroup(
      activeCenters.map(c => L.marker([c.lat, c.lng]))
    );

    if (group.getBounds().isValid()) {
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 12 });
    }
  };

  return (
    <div 
      className={`relative w-full h-[400px] md:h-[450px] rounded-[2.5rem] overflow-hidden border transition-all duration-350 shadow-sm z-0 ${
        darkMode 
          ? 'bg-[#181817] border-stone-800' 
          : 'bg-[#F2F1EE] border-stone-200'
      }`}
    >
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Recenter Button */}
      <div className="absolute top-20 right-4 z-10">
        <button
          onClick={fitAllMarkers}
          className={`p-2.5 rounded-full border transition shadow-md flex items-center justify-center cursor-pointer ${
            darkMode 
              ? 'bg-stone-800 border-stone-700 hover:bg-stone-700 text-stone-200 hover:text-white' 
              : 'bg-white border-stone-200 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900'
          }`}
          title="Fit All Centers"
          id="recenter-btn"
        >
          <Navigation className="w-5 h-5 rotate-45" />
        </button>
      </div>

      {/* Map Helper Info */}
      <div className={`absolute bottom-4 left-4 z-[400] flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-sans font-semibold shadow-sm transition-colors duration-300 pointer-events-none ${
        darkMode 
          ? 'bg-stone-900/95 border-stone-800 text-stone-300' 
          : 'bg-white/95 border-stone-200 text-stone-600'
      }`}>
        <Info className="w-3.5 h-3.5 text-emerald-500" />
        {darkMode ? 'تصفح الخريطة التفاعلية والمسافات الحقيقية' : 'Explore with real interactive maps'}
      </div>

      {/* Selected Center Preview Widget overlay */}
      <AnimatePresence>
        {selectedCenter && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`absolute bottom-4 right-4 left-4 md:left-auto md:w-80 border p-5 rounded-[2rem] shadow-xl z-[400] transition-colors duration-300 ${
              darkMode 
                ? 'bg-stone-900 border-stone-800 text-stone-100' 
                : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                  darkMode ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  📍 {selectedCenter.city}, {selectedCenter.country}
                </span>
                <h4 className={`text-sm font-bold font-serif tracking-tight mt-1.5 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  {selectedCenter.name}
                </h4>
              </div>
              <button
                onClick={() => onSelectCenter(selectedCenter)}
                className={`p-1 rounded-full transition font-bold w-6 h-6 flex items-center justify-center cursor-pointer ${
                  darkMode ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900'
                }`}
                id="close-preview-btn"
              >
                &times;
              </button>
            </div>
            
            <p className={`text-xs line-clamp-2 leading-relaxed mb-3 font-sans ${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
              {selectedCenter.description}
            </p>
            
            <div className={`flex gap-2 items-center text-[11px] font-medium p-2 rounded-xl mb-3 border ${
              darkMode ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50' : 'bg-emerald-50/50 text-stone-700 border-emerald-100/50'
            }`}>
              <span className={`font-bold flex items-center gap-1 shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-900'}`}>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Drop-in:
              </span>
              <span className={darkMode ? 'text-stone-300' : 'text-stone-600'}>{darkMode ? 'مرحب بالزوار دون تعقيدات' : 'Welcomed without paperwork'}</span>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <span className="text-amber-500">★</span>
                <span className={`font-bold font-serif ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                  {selectedCenter.averageRating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-[10px]">({selectedCenter.reviewsCount || 0} reviews)</span>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById(`center-card-${selectedCenter.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Give visual highlight
                    el.classList.add('ring-2', 'ring-emerald-700', 'ring-offset-2');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-700', 'ring-offset-2'), 2000);
                  }
                }}
                className={`text-xs font-bold transition flex items-center gap-0.5 cursor-pointer hover:underline ${
                  darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-900 hover:text-emerald-950'
                }`}
                id="view-details-btn"
              >
                {darkMode ? 'عرض التفاصيل ←' : 'View Details \u2192'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
