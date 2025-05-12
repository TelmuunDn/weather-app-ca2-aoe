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
      const latitude = "53.3498";
      const longitude = "-6.2603";
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString("default", { month: "long" })}`;
  };

  const getWeatherEmoji = (code: number): string => {
    const map: { [key: number]: string } = {
      0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
      51: "🌦️", 53: "🌦️", 55: "🌦️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
      80: "🌧️", 81: "🌧️", 82: "🌧️", 95: "🌩️", 96: "🌩️", 99: "🌩️",
    };
    return map[code] || "❓";
  };

  return (
    <LinearGradient colors={["#FFDEE9", "#A0CCDA"]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>5-Day Weather Forecast</Text>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={forecast}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.forecastItemContainer}>
              <View style={styles.forecastItem}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.emoji}>{getWeatherEmoji(item.weatherCode)}</Text>
                <Text style={styles.temp}>
                  {Math.round(item.maxTemp)}°C / {Math.round(item.minTemp)}°C
                </Text>
                <Text style={styles.precipitation}>💧 {Math.round(item.precipitationProbability)}%</Text>
              </View>
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
    marginBottom: 18,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  forecastItemContainer: {
    marginVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  forecastItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  emoji: {
    fontSize: 24,
  },
  temp: {
    fontSize: 18,
    color: "#555",
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
  },
  precipitation: {
    fontSize: 16,
    color: "#007BFF",
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },
});
