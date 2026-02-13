"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom HTML for the Numbered Pin
const markerHtml = (number: any) => `
<div class="relative flex items-center justify-center">
    <div class="h-8 w-8 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-sm transition-transform group-hover:scale-110">
        ${number || ''}
    </div>
    <div class="absolute -top-1 -right-1 h-2.5 w-2.5 bg-cyan-400 rounded-full border border-white animate-pulse"></div>
</div>
`;

function MapUpdater({ bounds }: { bounds: L.LatLngBoundsExpression }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

export default function TravelMap({ plans }: { plans: any[] }) {
    const [markers, setMarkers] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (!plans) return;

        const newMarkers: any[] = [];
        const usedPositions = new Map<string, number>();

        let stopCounter = 1;
        plans.forEach((day: any) => {
            day.activities?.forEach((act: any) => {
                if (act.coordinates && act.coordinates.lat && act.coordinates.lng && (act.coordinates.lat !== 0 || act.coordinates.lng !== 0)) {
                    let lat = act.coordinates.lat;
                    let lng = act.coordinates.lng;
                    let key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

                    if (usedPositions.has(key)) {
                        const count = usedPositions.get(key)!;
                        const angle = count * 0.7;
                        const radius = 0.00015 * count;
                        lat += Math.cos(angle) * radius;
                        lng += Math.sin(angle) * radius;
                        usedPositions.set(key, count + 1);
                    } else {
                        usedPositions.set(key, 1);
                    }

                    newMarkers.push({
                        id: stopCounter++,
                        position: [lat, lng],
                        description: act.description || "",
                        day: day.day || 1,
                        location: act.location || "Stop",
                        time: act.time || ""
                    });
                }
            });
        });
        setMarkers(newMarkers);
    }, [plans]);

    if (!isMounted || markers.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-[500px] bg-slate-900/50 rounded-2xl border border-slate-800 p-8 text-center text-slate-500 uppercase font-black text-[10px] tracking-widest">
                Loading Map...
            </div>
        );
    }

    const positions = markers.map(m => m.position);
    const lats = positions.map((p: any) => p[0]);
    const lngs = positions.map((p: any) => p[1]);
    const bounds = L.latLngBounds(
        L.latLng(Math.min(...lats), Math.min(...lngs)),
        L.latLng(Math.max(...lats), Math.max(...lngs))
    );

    return (
        <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl z-0">
            {typeof window !== 'undefined' && (
                <MapContainer
                    style={{ height: "100%", width: "100%", background: "#0f172a" }}
                    center={positions[0]}
                    zoom={13}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; Esri'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    {markers.map((marker, idx) => (
                        <Marker
                            key={idx}
                            position={marker.position}
                            icon={L.divIcon({
                                html: markerHtml(marker.id),
                                className: 'custom-div-icon group',
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            })}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -15]}
                                permanent={false}
                                className="bg-white/95 border-2 border-indigo-600 px-3 py-1.5 rounded-lg shadow-2xl"
                            >
                                <div className="text-slate-900 leading-none">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase mb-0.5">STOP {marker.id} • DAY {marker.day}</p>
                                    <p className="text-xs font-black uppercase tracking-tight">{marker.location || ""}</p>
                                </div>
                            </Tooltip>
                            <Popup>
                                <div className="p-1 max-w-[200px]">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">STOP {marker.id} • {marker.time || ""}</p>
                                    <p className="font-extrabold text-slate-900 mb-1 leading-tight">{marker.location || ""}</p>
                                    <p className="text-slate-600 text-[11px] leading-relaxed italic border-l-2 border-indigo-500/20 pl-2">
                                        {marker.description || ""}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    {/* @ts-ignore */}
                    <Polyline
                        positions={positions}
                        pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.5, dashArray: '8, 16' }}
                    />
                    <MapUpdater bounds={bounds} />
                </MapContainer>
            )}

            <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl z-[1000]">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Itinerary Route</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{markers.length}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Strategic Stops</span>
                </div>
            </div>
        </div>
    );
}
