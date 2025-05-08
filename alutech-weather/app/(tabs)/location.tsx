import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Replace with your Meteomatics credentials
const METEOMATICS_USER = "your_username";
const METEOMATICS_PASSWORD = "your_password";

export default function HomeScreen() {
  const [lat, setLat] = useState("47.3769");
  const [lon, setLon] = useState("8.5417");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async () => {
    setLoading(true);
    setError("");
    setTemperature(null);

    const now = new Date().toISOString().split(".")[0] + "Z"; // e.g. 2025-05-08T12:00:00Z
    const url = `https://api.meteomatics.com/${now}/t_2m:C/${lat},${lon}/json`;

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌡️ Meteomatics Weather</Text>
      <TextInput
        style={styles.input}
        value={lat}
        onChangeText={setLat}
        placeholder="Latitude"
      />
      <TextInput
        style={styles.input}
        value={lon}
        onChangeText={setLon}
        placeholder="Longitude"
      />
      <Button title="Get Temperature" onPress={fetchWeather} />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {temperature !== null && (
        <Text style={styles.result}>Temperature: {temperature}°C</Text>
      )}
    </View>
  );
}

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
