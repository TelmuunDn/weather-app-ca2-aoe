import { StyleSheet } from 'react-native';

import { LinearGradient } from "expo-linear-gradient";

export default function TabTwoScreen() {
  return (
    <LinearGradient
      colors={["#FFDEE9", "#A0CCDA"]}
      style={{ flex: 1 }}
    >
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    padding: 20,
    flex: 1,
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
