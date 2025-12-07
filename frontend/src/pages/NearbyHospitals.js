import { useEffect, useState } from "react";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Blocked keywords
  const blockedWords = ["psychiatry", "psychiatric", "psych", "mental"];
  const isBlocked = (name) => {
    if (!name) return false;
    const lower = name.toLowerCase();
    return blockedWords.some((word) => lower.includes(word));
  };

  // ✅ Load Google Maps script (async loader)
  const loadMapsScript = (callback) => {
    if (document.getElementById("google-maps-script")) {
      callback();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.onload = callback;
    document.body.appendChild(script);
  };

  // ✅ Fetch hospitals using Places API
  const fetchNearbyHospitals = async (location, mapObj) => {
    try {
      setError("");
      setHospitals([]);

      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.location",
          },
          body: JSON.stringify({
            includedTypes: ["hospital"],
            maxResultCount: 10,
            locationRestriction: {
              circle: {
                center: {
                  latitude: location.lat,
                  longitude: location.lng,
                },
                radius: 5000,
              },
            },
          }),
        }
      );

      const data = await response.json();
      if (!data.places || !data.places.length) {
        setError("No hospitals found nearby.");
        return;
      }

      const selected = [];

      for (const place of data.places) {
        const name = place.displayName?.text;
        if (!name || isBlocked(name)) continue;

        const detailsRes = await fetch(
          `https://places.googleapis.com/v1/places/${place.id}?fields=displayName,formattedAddress,internationalPhoneNumber,location&key=${apiKey}`
        );
        const details = await detailsRes.json();

        selected.push({
          name: details.displayName?.text,
          address: details.formattedAddress,
          phone: details.internationalPhoneNumber || "Phone not listed",
          place_id: place.id,
          location: details.location,
        });

        // Add marker on map
        if (mapObj && details.location) {
          new window.google.maps.Marker({
            map: mapObj,
            position: {
              lat: details.location.latitude,
              lng: details.location.longitude,
            },
            title: details.displayName?.text,
          });
        }

        if (selected.length === 3) break;
      }

      setHospitals(selected);
    } catch (err) {
      console.error(err);
      setError("Error fetching hospitals.");
    }
  };

  // ✅ Initialize Google Maps script
  useEffect(() => {
    loadMapsScript(() => {});
  }, []);

  // ✅ Handle manual search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!address) return;

    try {
      setError("");
      setHospitals([]);

      // Geocode user input
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${apiKey}`
      );
      const data = await res.json();
      if (data.status !== "OK" || !data.results.length) {
        setError("Address not found.");
        return;
      }

      const loc = data.results[0].geometry.location;

      const mapObj = new window.google.maps.Map(
        document.getElementById("map"),
        {
          center: loc,
          zoom: 14,
        }
      );

      fetchNearbyHospitals(loc, mapObj);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch location.");
    }
  };

  return (
    <div className="page-container" style={{ color: "white" }}>
      <h2>🏥 Nearby Hospitals</h2>
      <p>Find trusted hospitals and clinics near your location.</p>

      {/* Manual input */}
      <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address or ZIP code"
          style={{ padding: "5px", width: "250px", marginRight: "10px" }}
        />
        <button type="submit">Search</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        id="map"
        style={{
          width: "100%",
          height: "350px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      ></div>

      <h3>Top Nearby Hospitals</h3>
      <ul>
        {hospitals.map((h, i) => (
          <li key={i} style={{ marginBottom: "15px" }}>
            <strong>{h.name}</strong>
            <br />
            📍 {h.address}
            <br />
            📞 {h.phone}
            <br />
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${h.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3478f6" }}
            >
              🔗 View on Google Maps
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
