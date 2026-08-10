import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineLocalHospital, MdOutlineDirections, MdOutlinePhone, MdOutlineWarningAmber } from 'react-icons/md';

import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function HospitalFinder() {
  const [coords, setCoords] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError(true);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLocError(true);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
  if (!coords) return;

  const loadHospitals = async () => {
    setLoading(true);

    try {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:5000,${coords.lat},${coords.lng});
          way["amenity"="hospital"](around:5000,${coords.lat},${coords.lng});
          relation["amenity"="hospital"](around:5000,${coords.lat},${coords.lng});
        );
        out center;
      `;

      const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          body: query,
        }
      );

      const result = await response.json();

      let hospitalList = result.elements.map((item) => ({
        id: item.id,
        name: item.tags?.name || "Hospital",
        address:
          item.tags?.["addr:full"] ||
          item.tags?.["addr:street"] ||
          "Address not available",
        latitude: item.lat || item.center?.lat,
        longitude: item.lon || item.center?.lon,
        phone: item.tags?.phone || "",
        is_emergency: false,
      }));

      if (emergencyOnly) {
        hospitalList = hospitalList.filter((h) => h.is_emergency);
      }

      setHospitals(hospitalList);

    } catch (error) {
      console.error(error);
      toast.error("Unable to load nearby hospitals");
    } finally {
      setLoading(false);
    }
  };

  loadHospitals();

}, [coords, emergencyOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Hospital Finder</h1>
          <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Nearby hospitals with distance and directions.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={emergencyOnly} onChange={(e) => setEmergencyOnly(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Emergency hospitals only
        </label>
      </div>

      {locError && (
        <Card className="flex items-center gap-3 border-l-4 border-amber-400">
          <MdOutlineWarningAmber className="text-xl text-amber-500" />
          <p className="text-sm text-ink-800/80 dark:text-ink-50/80">Location access is off — enable it in your browser to see hospitals ranked by distance.</p>
        </Card>
      )}

      {coords && (
        <Card className="overflow-hidden p-0">
          <iframe
            title="Nearby hospitals map"
            className="h-72 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={
              MAPS_KEY
                ? `https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=hospitals&center=${coords.lat},${coords.lng}&zoom=13`
                : `https://maps.google.com/maps?q=hospitals+near+${coords.lat},${coords.lng}&z=13&output=embed`
            }
          />
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : hospitals.length === 0 ? (
          <Card><p className="text-sm text-ink-800/60 dark:text-ink-50/60">No hospitals found nearby yet.</p></Card>
        ) : (
          hospitals.map((h) => (
            <Card key={h.id} className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-white/5"><MdOutlineLocalHospital /></div>
                <div>
                  <p className="font-medium">{h.name} {h.is_emergency && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Emergency</span>}</p>
                  <p className="text-sm text-ink-800/70 dark:text-ink-50/70">{h.address}</p>
                  {h.distanceKm != null && <p className="text-xs text-brand-600">{h.distanceKm} km away</p>}
                </div>
              </div>
              <div className="flex gap-2">
                {h.phone && (
                  <a href={`tel:${h.phone}`}><Button variant="outline"><MdOutlinePhone /> Call</Button></a>
                )}
               <a
  href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
  target="_blank"
  rel="noopener noreferrer"
>
  <Button>
    <MdOutlineDirections className="mr-1" />
    Directions
  </Button>
</a>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
