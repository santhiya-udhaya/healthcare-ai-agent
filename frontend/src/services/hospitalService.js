export async function getNearbyHospitals(lat, lng) {
  const query = `
    [out:json];
    (
      node["amenity"="hospital"](around:5000,${lat},${lng});
      way["amenity"="hospital"](around:5000,${lat},${lng});
      relation["amenity"="hospital"](around:5000,${lat},${lng});
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

  const data = await response.json();

  return data.elements;
}