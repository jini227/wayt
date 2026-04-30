import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const TRACK_PADDING = 3;

export function SegmentedControl({
  options,
  selectedIndex = 0,
  onChange
}: {
  options: string[];
  selectedIndex?: number;
  onChange?: (index: number) => void;
}) {
  const indicator = useRef(new Animated.Value(selectedIndex)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const itemWidth = options.length > 0 ? Math.max(trackWidth - TRACK_PADDING * 2, 0) / options.length : 0;
  const translateX = indicator.interpolate({
    inputRange: options.map((_, index) => index),
    outputRange: options.map((_, index) => index * itemWidth)
  });

  useEffect(() => {
    Animated.timing(indicator, {
      toValue: selectedIndex,
      duration: 180,
      useNativeDriver: true
    }).start();
  }, [indicator, selectedIndex]);

  return (
    <View style={styles.wrap} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
      {itemWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.activeIndicator, { width: itemWidth, transform: [{ translateX }] }]}
        />
      ) : null}
      {options.map((option, index) => {
        const active = index === selectedIndex;
        return (
          <Pressable
            key={option}
            onPress={() => onChange?.(index)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          >
            <Text style={[styles.text, active && styles.activeText]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E3E6EC",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    padding: TRACK_PADDING,
    overflow: "hidden"
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  activeIndicator: {
    position: "absolute",
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#CFE1FF",
    backgroundColor: "#FFFFFF"
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600"
  },
  activeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  }
});
