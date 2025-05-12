import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

export default function WeatherScreen() {
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

  const fetchWeather = async (latitude: string, longitude: string) => {
    setLoading(true);
    setError("");
    setTemperature(null);

    const now = new Date().toISOString().split(".")[0] + "Z";
    const meteomaticsParams =
      "t_2m:C,weather_symbol_1h:idx,wind_speed_10m:ms,relative_humidity_2m:pct";
    const meteomaticsUrl = `https://api.meteomatics.com/${now}/${meteomaticsParams}/${latitude},${longitude}/json`;

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode`;

    try {
      console.log("Requesting data from Meteomatics API:", meteomaticsUrl);

      const meteomaticsResponse = await fetch(meteomaticsUrl, {
        headers: {
          Authorization: "Basic " + btoa("cct_dunia_telmuun:8sMvCtA7A8"),
        },
      });

      const meteomaticsContentType = meteomaticsResponse.headers.get("content-type");
      const meteomaticsRawText = await meteomaticsResponse.text();

      console.log("Meteomatics Response Status:", meteomaticsResponse.status);
      console.log("Meteomatics Response Headers:", meteomaticsResponse.headers);
      console.log("Meteomatics Raw Response:", meteomaticsRawText);

      if (meteomaticsResponse.status === 403 || !meteomaticsContentType?.includes("application/json")) {
        console.warn("Meteomatics API failed or is limited. Falling back to Open-Meteo API.");

        const openMeteoResponse = await fetch(openMeteoUrl);
        const openMeteoContentType = openMeteoResponse.headers.get("content-type");
        const openMeteoRawText = await openMeteoResponse.text();

        console.log("Open-Meteo Response Status:", openMeteoResponse.status);
        console.log("Open-Meteo Response Headers:", openMeteoResponse.headers);
        console.log("Open-Meteo Raw Response:", openMeteoRawText);

        if (!openMeteoContentType?.includes("application/json")) {
          throw new Error("Expected JSON but got something else from Open-Meteo");
        }

        const openMeteoData = JSON.parse(openMeteoRawText);

        const getValue = (param: string) => openMeteoData?.hourly?.[param]?.[0];

        const t = getValue("temperature_2m");
        const h = getValue("relativehumidity_2m");
        const w = getValue("windspeed_10m");
        const s = getValue("weathercode");

        if (t !== undefined) {
          setTemperature(t);
          setHumidity(h);
          setWindSpeed(w);
          setConditionSymbol(s);
          setTimestamp(new Date().toLocaleString());
        } else {
          setError("Weather data unavailable.");
        }
      } else {
        const meteomaticsData = JSON.parse(meteomaticsRawText);

        const getValue = (param: string) =>
          meteomaticsData?.data?.find((d: any) => d.parameter === param)?.coordinates?.[0]?.dates?.[0]?.value;

        const t = getValue("t_2m:C");
        const h = getValue("relative_humidity_2m:pct");
        const w = getValue("wind_speed_10m:ms");
        const s = getValue("weather_symbol_1h:idx");

        if (t !== undefined) {
          setTemperature(t);
          setHumidity(h);
          setWindSpeed(w);
          setConditionSymbol(s);
          setTimestamp(new Date().toLocaleString());
        } else {
          setError("Weather data unavailable.");
        }
      }
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      setError("Error fetching weather: " + err.message);
    } finally {
      setLoading(false);
    }
  };

const fetchCity = async () => {
  try {
    const { coords } = await Location.getCurrentPositionAsync({});
    const [place] = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    const cityName = place.city || place.name || "Unknown City";
    const countryName = place.country || "Unknown Country";
    setCity(`${cityName}, ${countryName}`);
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    setCity("Unknown City, Unknown Country");
  }
}

  const onRefresh = async () => {
    setRefreshing(true);
    if (lat && lon) {
      await fetchWeather(lat, lon);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude.toString();
      const longitude = location.coords.longitude.toString();

      setLat(latitude);
      setLon(longitude);
      fetchCity();
      fetchWeather(latitude, longitude);
    };

    getLocation();
  }, []);

  return (
    <LinearGradient
      colors={["#FFDEE9", "#A0CCDA"]} // Background gradient colors
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.container}>
          <Text style={styles.title}>{city || "Loading Local Weather Data..."}</Text>

          {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {temperature !== null && (
            <>
              {/* Emoji condition */}
              {conditionSymbol !== null && (
                <View style={styles.emojiRow}>
                  <Text style={styles.weatherEmoji}>{getWeatherEmoji(conditionSymbol)}</Text>
                </View>
              )}
              {/* Temperature value */}
              <View style={styles.temperatureRow}>
                <Text style={styles.tempValue}>
                  {isFahrenheit
                    ? Math.round((temperature * 9) / 5 + 32)
                    : Math.round(temperature)}
                  °
                  {isFahrenheit ? "F" : "C"}
                </Text>
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                  <Icon name="cloud-rain" size={20} color="#555" />
                  <Text style={styles.infoText}>{conditionSymbol}%</Text>
                  <Text style={styles.infoLabel}>Rain</Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon name="droplet" size={20} color="#555" />
                  <Text style={styles.infoText}>{humidity}%</Text>
                  <Text style={styles.infoLabel}>Humidity</Text>
                </View>
                <View style={styles.infoItem}>
                  <Icon name="wind" size={20} color="#555" />
                  <Text style={styles.infoText}>{windSpeed} m/s</Text>
                  <Text style={styles.infoLabel}>Wind</Text>
                </View>
              </View>

              <Text style={styles.timestamp}>As of: {timestamp}</Text>
              <TouchableOpacity onPress={() => setIsFahrenheit(!isFahrenheit)} style={styles.unitToggle}>
                <Icon name="refresh-ccw" size={16} color="#3366FF" />
                <Text style={styles.toggle}> Show in {isFahrenheit ? "Celsius" : "Fahrenheit"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getWeatherEmoji = (symbol: number): string => {
  const map: { [key: number]: string } = {
    0: "☀️", // Clear sky
    1: "🌤️", // Mainly clear
    2: "⛅", // Partly cloudy
    3: "☁️", // Overcast
    45: "🌫️", // Fog
    48: "🌫️", // Depositing rime fog
    51: "🌦️", // Drizzle: Light
    53: "🌦️", // Drizzle: Moderate
    55: "🌦️", // Drizzle: Dense
    56: "🌧️", // Freezing Drizzle: Light
    57: "🌧️", // Freezing Drizzle: Dense
    61: "🌧️", // Rain: Slight
    63: "🌧️", // Rain: Moderate
    65: "🌧️", // Rain: Heavy
    66: "🌨️", // Freezing Rain: Light
    67: "🌨️", // Freezing Rain: Heavy
    71: "🌨️", // Snow fall: Slight
    73: "🌨️", // Snow fall: Moderate
    75: "🌨️", // Snow fall: Heavy
    77: "🌨️", // Snow grains
    80: "🌧️", // Rain showers: Slight
    81: "🌧️", // Rain showers: Moderate
    82: "🌧️", // Rain showers: Violent
    85: "🌨️", // Snow showers: Slight
    86: "🌨️", // Snow showers: Heavy
    95: "🌩️", // Thunderstorm: Slight or moderate
    96: "🌩️", // Thunderstorm with slight hail
    99: "🌩️", // Thunderstorm with heavy hail
  };
  return map[symbol] || "❓"; // Default to ❓ if the symbol is not mapped
};

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
  },
  
  infoText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginTop: 4,
  },
  
  infoLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  
  
  infoText: {
    fontSize: 16,
    color: "#444",
  },
  
  title: {
    fontSize: 20,
    color: "#444",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
  tempValue: {
    fontSize: 100,
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  result: {
    fontSize: 18,
    color: "#666",
    marginVertical: 4,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  timestamp: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
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
    marginBottom: 20,
  },
  emojiRow: {
    marginVertical: 12,
    alignItems: "center",
  },
  weatherEmoji: {
    fontSize: 120,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    gap: 6,
  },
  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
});