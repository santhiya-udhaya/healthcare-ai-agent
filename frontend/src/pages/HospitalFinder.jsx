import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  MdOutlineLocalHospital,
  MdOutlinePhone,
  MdOutlineWarningAmber,
} from 'react-icons/md';

import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HospitalFinder() {
  const [coords, setCoords] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocError(true);
        setLoading(false);
        toast.error('Please allow location access');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Find real nearby hospitals using OpenStreetMap
  useEffect(() => {
    if (!coords) return;

    const loadHospitals = async () => {
      setLoading(true);

      try {
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="hospital"](around:10000,${coords.lat},${coords.lng});
            way["amenity"="hospital"](around:10000,${coords.lat},${coords.lng});
            relation["amenity"="hospital"](around:10000,${coords.lat},${coords.lng});
          );
          out center;
        `;

        const response = await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: query,
          }
        );

        if (!response.ok) {
          throw new Error(`Overpass API error: ${response.status}`);
        }

        const result = await response.json();

        let hospitalList = (result.elements || [])
          .map((item) => {
            const latitude = item.lat ?? item.center?.lat;
            const longitude = item.lon ?? item.center?.lon;

            if (latitude == null || longitude == null) {
              return null;
            }

            const tags = item.tags || {};

            const distanceKm = calculateDistanceKm(
              coords.lat,
              coords.lng,
              Number(latitude),
              Number(longitude)
            );

            return {
              id: `osm-${item.type}-${item.id}`,
              name: tags.name || 'Hospital',
              address:
                tags['addr:full'] ||
                tags['addr:street'] ||
                tags['addr:city'] ||
                'Address not available',
              latitude: Number(latitude),
              longitude: Number(longitude),
              phone: tags.phone || tags['contact:phone'] || '',
              distanceKm: Number(distanceKm.toFixed(2)),
              is_emergency:
                tags.emergency === 'yes' ||
                tags['healthcare:speciality']?.toLowerCase()?.includes('emergency') ||
                false,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distanceKm - b.distanceKm);

        if (emergencyOnly) {
          hospitalList = hospitalList.filter(
            (hospital) => hospital.is_emergency
          );
        }

        setHospitals(hospitalList);
      } catch (error) {
        console.error('Hospital loading error:', error);
        setHospitals([]);
        toast.error('Unable to load nearby hospitals');
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, [coords, emergencyOnly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">
            Hospital Finder
          </h1>

          <p className="text-sm text-ink-800/70 dark:text-ink-50/70">
            Find real hospitals near your current location.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emergencyOnly}
            onChange={(event) => setEmergencyOnly(event.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />

          Emergency hospitals only
        </label>
      </div>

      {/* Location warning */}
      {locError && (
        <Card className="flex items-center gap-3 border-l-4 border-amber-400">
          <MdOutlineWarningAmber className="text-xl text-amber-500" />

          <p className="text-sm text-ink-800/80 dark:text-ink-50/80">
            Location access is disabled. Please allow location access in your
            browser to find nearby hospitals.
          </p>
        </Card>
      )}

      {/* Map */}
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

      {/* Hospital list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 w-full" />
          ))
        ) : hospitals.length === 0 ? (
          <Card>
            <div className="text-center py-4">
              <MdOutlineLocalHospital className="mx-auto text-4xl text-ink-800/40" />

              <p className="mt-2 text-sm text-ink-800/60 dark:text-ink-50/60">
                No hospitals found nearby.
              </p>

              {!locError && (
                <p className="mt-1 text-xs text-ink-800/50 dark:text-ink-50/50">
                  Try moving to a different location or disable the emergency
                  filter.
                </p>
              )}
            </div>
          </Card>
        ) : (
          hospitals.map((hospital) => (
            <Card
              key={hospital.id}
              className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-white/5">
                  <MdOutlineLocalHospital />
                </div>

                <div>
                  <p className="font-medium text-ink-900 dark:text-white">
                    {hospital.name}

                    {hospital.is_emergency && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                        Emergency
                      </span>
                    )}
                  </p>

                  <p className="text-sm text-ink-800/70 dark:text-ink-50/70">
                    {hospital.address}
                  </p>

                  <p className="text-xs text-brand-600">
                    {hospital.distanceKm} km away
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {hospital.phone && (
                  <a href={`tel:${hospital.phone}`}>
                    <Button variant="outline">
                      <MdOutlinePhone />
                      Call
                    </Button>
                  </a>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
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