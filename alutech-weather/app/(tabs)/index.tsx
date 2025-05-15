import * as Font from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

// Main weather screen: shows current weather for user's location
export default function WeatherScreen() {
  // State variables for location, weather data, UI state, etc.
  const [lat, setLat] = useState<string | null>(null);
  const [lon, setLon] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [conditionSymbol, setConditionSymbol] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Helper to format timestamp for display (e.g., May-15 10:26)
  const formatTimestamp = (): string => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    // Format like "May 15, 10:26" then replace space after month with dash and remove comma
    return now
      .toLocaleString("en-US", options)
      .replace(",", "")
      .replace(" ", "-");
  };

  // Update all weather-related state at once
  const updateWeatherState = (t: number, h: number, w: number, s: number) => {
    setTemperature(t);
    setHumidity(h);
    setWindSpeed(w);
    setConditionSymbol(s);
    setTimestamp(formatTimestamp());
  };

  // Fetch weather data from Meteomatics API, fallback to Open-Meteo if needed
  const fetchWeather = async (latitude: string, longitude: string) => {
    setLoading(true);
    setError("");
    setTemperature(null);

    const now = new Date().toISOString().split(".")[0] + "Z";
    const meteomaticsParams =
      "t_2m:C,weather_symbol_1h:idx,wind_speed_10m:ms,relative_humidity_2m:pct";
    const meteomaticsUrl = `https://api.meteomatics.com/${now}/${meteomaticsParams}/${latitude},${longitude}/json`;

    try {
      // Try Meteomatics API first
      const meteomaticsResponse = await fetch(meteomaticsUrl, {
        headers: {
          Authorization: "Basic " + btoa("cct_dunia_telmuun:8sMvCtA7A8"),
        },
      });

      const isJson =
        meteomaticsResponse.headers
          .get("content-type")
          ?.includes("application/json");

      if (!isJson || meteomaticsResponse.status === 403) {
        throw new Error("Meteomatics API unavailable, using fallback");
      }

      const meteomaticsData = await meteomaticsResponse.json();
      const getValue = (param: string) =>
        meteomaticsData?.data?.find((d: any) => d.parameter === param)
          ?.coordinates?.[0]?.dates?.[0]?.value;

      const t = getValue("t_2m:C");
      const h = getValue("relative_humidity_2m:pct");
      const w = getValue("wind_speed_10m:ms");
      const s = getValue("weather_symbol_1h:idx");

      if (t !== undefined) {
        updateWeatherState(t, h, w, s);
      } else {
        throw new Error("Meteomatics data missing values");
      }
    } catch (err) {
      // If Meteomatics fails, fallback to Open-Meteo API
      try {
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode`;
        const openMeteoResponse = await fetch(openMeteoUrl);
        const isJson = openMeteoResponse.headers
          .get("content-type")
          ?.includes("application/json");

        if (!isJson) throw new Error("Open-Meteo response not JSON");

        const data = await openMeteoResponse.json();
        const getValue = (param: string) => data?.hourly?.[param]?.[0];

        const t = getValue("temperature_2m");
        const h = getValue("relativehumidity_2m");
        const w = getValue("windspeed_10m");
        const s = getValue("weathercode");

        if (t !== undefined) {
          updateWeatherState(t, h, w, s);
        } else {
          throw new Error("Open-Meteo missing values");
        }
      } catch (fallbackErr: any) {
        console.error("Weather fetch error:", fallbackErr);
        setError("Error fetching weather: " + fallbackErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch city/country name from coordinates using reverse geocoding
  const fetchCity = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync({});
      if (Platform.OS === "web") {
        // Using Native Geolocation API for mobile, fallback to OpenStreetMap Nominatim for web as Expo Location is not available on web
        // Use OpenStreetMap Nominatim for reverse geocoding on web
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
        );
        if (!response.ok) throw new Error("Nominatim request failed");
        const data = await response.json();
        const cityName =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.hamlet ||
          data.address.county ||
          "Unknown City";
        const countryName = data.address.country || "Unknown Country";
        setCity(`${cityName}, ${countryName}`);
      } else {
        // Use Expo Location reverse geocoding on native
        const [place] = await Location.reverseGeocodeAsync(coords);
        const cityName = place.city || place.name || "Unknown City";
        const countryName = place.country || "Unknown Country";
        setCity(`${cityName}, ${countryName}`);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      setCity("Unknown City, Unknown Country");
    }
  };

  // Pull-to-refresh handler: re-fetch weather
  const onRefresh = async () => {
    setRefreshing(true);
    if (lat && lon) {
      await fetchWeather(lat, lon);
    }
    setRefreshing(false);
  };

  // On mount: request location permission, get location, fetch city and weather
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude.toString();
      const longitude = location.coords.longitude.toString();

      setLat(latitude);
      setLon(longitude);
      fetchCity();
      fetchWeather(latitude, longitude);
    })();
  }, []);

  // Load custom font on mount
  useEffect(() => {
    Font.loadAsync({
      "AlumniSansPinstripe-Regular": require("../../assets/fonts/AlumniSansPinstripe-Regular.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  // Show nothing until font is loaded
  if (!fontsLoaded) return null;

  return (
    // Gradient background for visual appeal
    <LinearGradient colors={["#FFDEE9", "#d8fcff"]} style={{ flex: 1 }}>
      {/* Main scrollable content with pull-to-refresh */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {/* City name and timestamp */}
          <Text style={styles.title}>
            {city || "Loading Local Weather Data..."}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>

          {/* Loading spinner and error message */}
          {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Weather data display */}
          {temperature !== null && (
            <>
              {/* Weather emoji for current condition */}
              {conditionSymbol !== null && (
                <View style={styles.emojiRow}>
                  <Text style={styles.weatherEmoji}>
                    {getWeatherEmoji(conditionSymbol)}
                  </Text>
                </View>
              )}
              {/* Temperature value and unit toggle */}
              <View style={styles.temperatureRow}>
                <Text style={styles.tempValue}>
                  {isFahrenheit
                    ? Math.round((temperature * 9) / 5 + 32)
                    : Math.round(temperature)}
                  °{isFahrenheit ? "F" : "C"}
                </Text>
              </View>

              {/* Weather info: rain, humidity, wind */}
              <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                  <Icon name="cloud-rain" size={20} color="#555" />
                  <Text style={styles.infoText}>{Math.round(conditionSymbol ?? 0)}%</Text>
                  <Text style={styles.infoLabel}>Rain</Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon name="droplet" size={20} color="#555" />
                  <Text style={styles.infoText}>{Math.round(humidity ?? 0)}%</Text>
                  <Text style={styles.infoLabel}>Humidity</Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon name="wind" size={20} color="#555" />
                  <Text style={styles.infoText}>{Math.round(windSpeed ?? 0)} m/s</Text>
                  <Text style={styles.infoLabel}>Wind</Text>
                </View>
              </View>

              {/* Button to toggle between Celsius and Fahrenheit */}
              <TouchableOpacity
                onPress={() => setIsFahrenheit(!isFahrenheit)}
                style={styles.unitToggle}
              >
                <Icon name="refresh-ccw" size={16} color="#3366FF" />
                <Text style={styles.toggle}>
                  {" "}
                  Show in {isFahrenheit ? "Celsius" : "Fahrenheit"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Map weather code to emoji for display
const getWeatherEmoji = (symbol: number): string => {
  const map: { [key: number]: string } = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌦️",
    56: "🌧️",
    57: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    66: "🌨️",
    67: "🌨️",
    71: "🌨️",
    73: "🌨️",
    75: "🌨️",
    77: "🌨️",
    80: "🌧️",
    81: "🌧️",
    82: "🌧️",
    85: "🌨️",
    86: "🌨️",
    95: "🌩️",
    96: "🌩️",
    99: "🌩️",
  };
  return map[symbol] || "❓";
};

// Styles for the weather screen
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 70,
    alignItems: "center",
    padding: 20,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    width: "90%",
  },
  infoItem: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    width: 80,
  },
  infoText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
    fontFamily: "AlumniSansPinstripe-Regular",
    textAlign: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    color: "#444",
    textAlign: "center",
  },
  tempValue: {
    fontSize: 150,
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "AlumniSansPinstripe-Regular",
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  timestamp: {
    fontSize: 18,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
    fontFamily: "System", // this uses the platform’s default sans-serif font
    letterSpacing: 1,
  },
  toggle: {
    color: "#3366FF",
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  temperatureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiRow: {
    marginVertical: 0,
    alignItems: "center",
  },
  weatherEmoji: {
    fontSize: 200,
  },
  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
});
