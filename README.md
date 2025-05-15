
# 🌤 Weather App (React Native + Expo)

A beautifully styled weather application built using React Native with Expo. It fetches weather data from **Meteomatics** (primary source), **Open-Meteo** (fallback), and uses **IPAPI** and **Expo Location** to determine the user's current location.

> ⚠️ Some Meteomatics API features require a paid account. This app gracefully falls back to Open-Meteo if premium features are unavailable.

---

## 🚀 Features

- Auto-fetches your current location using GPS or IP address
- Real-time weather data: temperature, humidity, wind speed, rain chance
- Fahrenheit ↔ Celsius toggle
- Emoji-based weather icons 🌦️
- Fallback between weather APIs
- Modern UI using `expo-linear-gradient`, custom fonts, and icons

---

## 🧱 Tech Stack

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Meteomatics API](https://api.meteomatics.com/)
- [Open-Meteo API](https://open-meteo.com/)
- [IPAPI.co](https://ipapi.co/)
- Expo libraries: `expo-location`, `expo-font`, `expo-linear-gradient`
- Icons: `react-native-vector-icons`

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/weather-app.git
cd weather-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Expo CLI (if not installed)

```bash
npm install -g expo-cli
```

### 4. Install required Expo packages

```bash
npx expo install expo-location expo-font expo-linear-gradient
```

### 5. Install additional packages

```bash
npm install @react-native-async-storage/async-storage
npm install lodash
npm install react-native-vector-icons
```

### 6. Start the Expo app

```bash
npx expo start --tunnel
```

Open the QR code in the Expo Go app on your phone or run on an emulator.

---

## 🌐 APIs Used

### 📍 IPAPI (for location by IP)

- Fetches current city/country by user's public IP
- Fallback to this method when GPS is unavailable

### 🌦 Meteomatics API

- **Primary source** for weather data
- Requires API key (base64 encoded `username:password`)
- Set your credentials directly in the `Authorization` header in the request

```ts
Authorization: "Basic " + btoa("your_username:your_password")
```

### 🌤 Open-Meteo API

- **Fallback** API (free & open-source)
- Used when Meteomatics fails or requires paid access

---

## 🔐 Environment Variables (Optional)

You may want to avoid hardcoding credentials. Use a `.env` file and a solution like `react-native-dotenv`:

```env
METEOMATICS_AUTH=Basic <base64-encoded-user:pass>
```

---

## 📁 Fonts & Assets

Ensure the following font is placed in the correct directory:

```bash
/assets/fonts/AlumniSansPinstripe-Regular.ttf
```

And is loaded in your code like:

```ts
Font.loadAsync({
  "AlumniSansPinstripe-Regular": require("../../assets/fonts/AlumniSansPinstripe-Regular.ttf"),
});
```

---

## 📋 Troubleshooting

- **Permission denied**: Make sure to allow location permissions on your device/emulator.
- **API 403 errors**: This likely means Meteomatics credentials are invalid or rate-limited.
- **No fonts showing**: Double-check that the font path is correct and that you’ve loaded it properly.

---

## 📌 TODO / Future Improvements

- Add hourly and daily forecasts
