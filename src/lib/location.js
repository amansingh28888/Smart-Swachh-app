export function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = "";
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const j = await r.json();
          address = [j.locality, j.city, j.principalSubdivision].filter(Boolean).join(", ");
        } catch (e) {
          // reverse geocoding is a nicety only — ignore failure
        }
        resolve({ lat: latitude, lng: longitude, address });
      },
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}
