import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [city, setCity] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const saveSearchHistory = async (city: string) => {
    const updated = [city, ...searchHistory.filter((c) => c !== city)];
    setSearchHistory(updated.slice(0, 5));
    await AsyncStorage.setItem("history", JSON.stringify(updated.slice(0, 5)));
  };

  const loadSearchHistory = async () => {
    const history = await AsyncStorage.getItem("history");
    if (history) setSearchHistory(JSON.parse(history));
  };

  const clearSearchHistory = async () => {
    await AsyncStorage.removeItem("history");
    setSearchHistory([]);
  };

  const fetchWeatherByCity = async () => {
    if (!city) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setTemperature(null);

    try {
      const geocodeRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1`
      );
      const geoData = await geocodeRes.json();
      const location = geoData.results?.[0];

      if (!location) {
        setError("City not found.");
        return;
      }

      const now = new Date().toISOString().split(".")[0] + "Z";
      const weatherUrl = `https://api.meteomatics.com/${now}/t_2m:C/${location.latitude},${location.longitude}/json`;

      const response = await fetch(weatherUrl, {
        headers: {
          Authorization: "Basic " + btoa("cct_dunia_telmuun:8sMvCtA7A8"),
        },
      });

      const data = await response.json();
      const value = data?.data?.[0]?.coordinates?.[0]?.dates?.[0]?.value;

      if (value !== undefined) {
        setTemperature(value);
        await saveSearchHistory(city);
      } else {
        setError("Temperature data unavailable.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FFDEE9", "#A0CCDA"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>🌦️ City Weather Search</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Enter city name"
        />
        <Button title="Search Weather" onPress={fetchWeatherByCity} />

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {temperature !== null && (
          <Text style={styles.result}>Temperature: {temperature}°C</Text>
        )}

        {searchHistory.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.subtitle}>Search History</Text>
            <FlatList
              data={searchHistory}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setCity(item);
                    fetchWeatherByCity();
                  }}
                >
                  <Text style={styles.historyItem}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Clear History" onPress={clearSearchHistory} />
          </View>
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
    textAlign: "center",
  },
  result: {
    fontSize: 20,
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  historyItem: {
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    textAlign: "center",
  },
});
