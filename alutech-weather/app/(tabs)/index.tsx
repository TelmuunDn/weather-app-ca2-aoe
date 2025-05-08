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
  );
}

const getWeatherEmoji = (symbol: number): string => {
  const map: { [key: number]: string } = {
    1: "☀️",
    2: "🌤️",
    3: "⛅",
    4: "☁️",
    5: "🌧️",
    6: "🌦️",
    7: "🌩️",
    8: "🌨️",
    9: "🌫️",
  };
  return map[symbol] || "❓";
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    padding: 20,
    backgroundColor: "#fff",
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
