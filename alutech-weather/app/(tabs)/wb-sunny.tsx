import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

export default function TabTwoScreen() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchForecast = async () => {
    setLoading(true);
    setError("");

    try {
      const latitude = "53.3498"; // Example latitude for Dublin
      const longitude = "-6.2603"; // Example longitude for Dublin
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_mean&timezone=auto`;

      const response = await fetch(forecastUrl);
      const data = await response.json();

      if (data?.daily) {
        setForecast(
          data.daily.time.map((date: string, index: number) => ({
            date,
            maxTemp: data.daily.temperature_2m_max[index],
            minTemp: data.daily.temperature_2m_min[index],
            weatherCode: data.daily.weathercode[index],
            precipitationProbability: data.daily.precipitation_probability_mean[index],
          }))
        );
      } else {
        setError("Forecast data unavailable.");
      }
    } catch (err) {
      console.error("Failed to fetch forecast", err);
      setError("Error fetching forecast data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const getWeatherEmoji = (code: number): string => {
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
      61: "🌧️", // Rain: Slight
      63: "🌧️", // Rain: Moderate
      65: "🌧️", // Rain: Heavy
      80: "🌧️", // Rain showers: Slight
      81: "🌧️", // Rain showers: Moderate
      82: "🌧️", // Rain showers: Violent
      95: "🌩️", // Thunderstorm: Slight or moderate
      96: "🌩️", // Thunderstorm with slight hail
      99: "🌩️", // Thunderstorm with heavy hail
    };
    return map[code] || "❓"; // Default to ❓ if the code is not mapped
  };

  return (
    <LinearGradient
      colors={["#FFDEE9", "#A0CCDA"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>5-Day Weather Forecast</Text>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={forecast}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.forecastItem}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.emoji}>{getWeatherEmoji(item.weatherCode)}</Text>
              <Text style={styles.temp}>{item.maxTemp}°C / {item.minTemp}°C</Text>
              <Text style={styles.precipitation}>💧 {item.precipitationProbability}%</Text>
            </View>
          )}
        />
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
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  forecastItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  date: {
    fontSize: 16,
    color: "#333",
  },
  emoji: {
    fontSize: 24,
  },
  temp: {
    fontSize: 16,
    color: "#555",
  },
  precipitation: {
    fontSize: 14,
    color: "#007BFF",
  },
});
