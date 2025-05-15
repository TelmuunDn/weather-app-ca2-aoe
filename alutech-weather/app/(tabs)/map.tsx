import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { debounce } from "lodash";
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

// City weather search screen: lets user search for weather by city name
export default function HomeScreen() {
  // State variables for city input, search results, UI state, etc.
  const [city, setCity] = useState("");
  const [queriedCity, setQueriedCity] = useState("");
  const [queriedCountry, setQueriedCountry] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Save a city/country to search history (max 5 entries)
  const saveSearchHistory = async (city: string, country: string) => {
    const cityCountry = `${city}, ${country}`;
    const updated = [cityCountry, ...searchHistory.filter((c) => c !== cityCountry)];
    setSearchHistory(updated.slice(0, 5));
    await AsyncStorage.setItem("history", JSON.stringify(updated.slice(0, 5)));
  };

  // Load search history from AsyncStorage
  const loadSearchHistory = async () => {
    const history = await AsyncStorage.getItem("history");
    if (history) setSearchHistory(JSON.parse(history));
  };

  // Clear search history from AsyncStorage
  const clearSearchHistory = async () => {
    await AsyncStorage.removeItem("history");
    setSearchHistory([]);
  };

  // Fetch weather for the current city input using geocoding and weather APIs
  const fetchWeatherByCity = async () => {
    if (!city) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setTemperature(null);

    try {
      // Geocode city name to get coordinates
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

      setQueriedCity(location.name);
      setQueriedCountry(location.country);

      // Fetch weather for coordinates
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
        await saveSearchHistory(location.name, location.country);
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

  // Fetch city suggestions for autocomplete (debounced)
  const fetchCitySuggestions = debounce(async (query: string) => {
    if (!query) {
      setCitySuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=10`
      ); // Fetch up to 10 cities
      const data = await response.json();
      const suggestions =
        data.results?.map((result: any) => `${result.name}, ${result.country}`) || [];
      setCitySuggestions(suggestions);
    } catch (err) {
      console.error("Failed to fetch city suggestions", err);
      setCitySuggestions([]);
    }
  }, 300);

  // Handle user typing in city input
  const handleCityInputChange = (text: string) => {
    setCity(text);
    fetchCitySuggestions(text);
  };

  // Handle Enter key in city input (search or autocomplete)
  const handleCityInputKeyPress = (event: any) => {
    if (event.nativeEvent.key === "Enter") {
      const selectedCity = citySuggestions.find((suggestion) => suggestion.startsWith(city));
      if (selectedCity) {
        setCity(selectedCity); // Update the search bar with the full city name and country
      }
      fetchWeatherByCity();
    }
  };

  // Handle user selecting a suggestion from the list
  const handleSuggestionSelect = (suggestion: string) => {
    setCity(suggestion);
    setCitySuggestions([]);
    fetchWeatherByCity();
  };

  return (
    // Gradient background for visual appeal
    <LinearGradient
      colors={["#FFDEE9", "#A0CCDA"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Title and city input */}
        <Text style={styles.title}>🌦️ City Weather Search</Text>
        <View>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={handleCityInputChange}
            onKeyPress={handleCityInputKeyPress}
            placeholder="Enter city name"
          />
          {/* City suggestions dropdown */}
          {citySuggestions.length > 0 && (
            <View style={styles.suggestionsBubble}>
              <FlatList
                data={citySuggestions}
                keyExtractor={(item, index) => `${item}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSuggestionSelect(item)}
                  >
                    <Text style={styles.suggestionItem}>{item}</Text>
                  </TouchableOpacity>
                )}
                initialNumToRender={3} // Show 3 cities initially
                style={{ maxHeight: 150 }} // Limit height for scrolling
              />
            </View>
          )}
        </View>
        {/* Loading spinner and error message */}
        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {/* Weather result display */}
        {temperature !== null && (
          <Text style={styles.result}>
            {queriedCity}, {queriedCountry} - Temperature: {temperature}°C
          </Text>
        )}
        {/* Search history list */}
        {searchHistory.length > 0 && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.subtitle}>Search History</Text>
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `${item}-${index}`}
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

// Styles for the city weather search screen
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
    marginBottom: 100, // Increased margin to add more space for the search weather button
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
  suggestionItem: {
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    textAlign: "center",
  },
  suggestionsBubble: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    boxShadow: "0px 2px 3.84px rgba(0,0,0,0.25)",
    elevation: 5,
    zIndex: 100,
    maxHeight: 110, // Reduced height to make the bubble vertically half as tall
  },
});
