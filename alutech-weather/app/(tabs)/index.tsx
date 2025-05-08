import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WeatherScreen() {
  const [lat, setLat] = useState<string | null>(null);
  const [lon, setLon] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [conditionSymbol, setConditionSymbol] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async (latitude: string, longitude: string) => {
    setLoading(true);
    setError("");
    setTemperature(null);

    const now = new Date().toISOString().split(".")[0] + "Z";
    const params =
      "t_2m:C,weather_symbol_1h:idx,wind_speed_10m:ms,relative_humidity_2m:pct";

    // Updated URL to fetch parameters from a different source
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode`;

    try {
      console.log("Request URL:", url);

      const response = await fetch(url);

      const contentType = response.headers.get("content-type");
      const rawText = await response.text();

      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Raw Response:", rawText);

      if (!contentType?.includes("application/json")) {
        throw new Error("Expected JSON but got something else");
      }

      const data = JSON.parse(rawText);

      // Adjusted to match the new API's response structure
      const getValue = (param: string) => data?.hourly?.[param]?.[0];

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
    } catch (err: any) {
      console.error("Weather fetch error:", err);
      setError("Error fetching weather: " + err.message);
    } finally {
      setLoading(false);
    }
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
      fetchWeather(latitude, longitude);
    };

    getLocation();
  }, []);

  return (
    <LinearGradient
    colors={["#FFDEE9", "#A0CCDA"]} // Background gradient colors
    style={{ flex: 1 }}
  >
    <View style={styles.container}>
      <Text style={styles.title}>🌡️ Current Weather</Text>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {temperature !== null && (
        <>
          <Text style={styles.result}>
            Temperature:{" "}
            {isFahrenheit
              ? ((temperature * 9) / 5 + 32).toFixed(1)
              : temperature.toFixed(1)}
            °{isFahrenheit ? "F" : "C"}
          </Text>
          <Text style={styles.result}>Humidity: {humidity}%</Text>
          <Text style={styles.result}>Wind Speed: {windSpeed} m/s</Text>
          {conditionSymbol !== null && (
            <Text style={styles.result}>
              Condition: {getWeatherEmoji(conditionSymbol)}
            </Text>
          )}
          <Text style={styles.timestamp}>As of: {timestamp}</Text>
          <TouchableOpacity onPress={() => setIsFahrenheit(!isFahrenheit)}>
            <Text style={styles.toggle}>
              Show in {isFahrenheit ? "Celsius" : "Fahrenheit"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
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
    paddingTop: 80,
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  result: {
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  timestamp: {
    fontSize: 14,
    color: "#555",
    marginTop: 10,
    textAlign: "center",
  },
  toggle: {
    color: "#007bff",
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
});
