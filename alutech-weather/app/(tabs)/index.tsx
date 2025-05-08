import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";

// Replace with your Meteomatics credentials
const METEOMATICS_USER = "your_username";
const METEOMATICS_PASSWORD = "your_password";

export default function HomeScreen() {
  const [lat, setLat] = useState<string | null>(null);
  const [lon, setLon] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch weather for the current location
  const fetchWeather = async (latitude: string, longitude: string) => {
    setLoading(true);
    setError("");
    setTemperature(null);

    const now = new Date().toISOString().split(".")[0] + "Z"; // e.g. 2025-05-08T12:00:00Z
    const url = `https://api.meteomatics.com/${now}/t_2m:C/${latitude},${longitude}/json`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: "Basic " + btoa("cct_dunia_telmuun:8sMvCtA7A8")
,
        },
      });

      const data = await response.json();
      const value = data?.data?.[0]?.coordinates?.[0]?.dates?.[0]?.value;
      if (value !== undefined) {
        setTemperature(value);
      } else {
        setError("No temperature data found.");
      }
    } catch (err) {
      setError("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location when the component mounts
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
      fetchWeather(latitude, longitude); // Fetch weather for the current location
    };

    getLocation();
  }, []);

  return (
    <LinearGradient
    colors={["#FFDEE9", "#A0CCDA"]} // Background gradient colors
    style={{ flex: 1 }}
  >
    <View style={styles.container}>
      <Text style={styles.title}>🌡️ Meteomatics Weather</Text>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {temperature !== null && (
        <Text style={styles.result}>Temperature: {temperature}°C</Text>
      )}
    </View>
    </LinearGradient>
  );
}

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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  result: {
    fontSize: 20,
    marginTop: 20,
    textAlign: "center",
  },
});
