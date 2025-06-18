const axios = require('axios');

// Convert coordinates to location name using OpenStreetMap
exports.getLocationName = async (latitude, longitude) => {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?` + 
            `format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            {
                headers: {
                    'User-Agent': 'ManyStack/1.0'
                }
            }
        );

        const address = response.data.address;
        
        // Format: "City, State, Country"
        const location = [
            address.city || address.town || address.village,
            address.state,
            address.country
        ]
            .filter(Boolean)
            .join(', ');

        return location || 'Unknown Location';
    } catch (error) {
        console.error('Geocoding error:', error);
        return 'Unknown Location';
    }
};