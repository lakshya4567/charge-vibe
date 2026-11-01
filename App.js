import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import * as Battery from 'expo-battery';
import { StatusBar } from 'expo-status-bar';

const BLUE = '#69DFFF';
const moods = [
  { h: [58, 58], w: [39, 39], mouth: 'smile' },
  { h: [68, 68], w: [43, 43], mouth: 'small' },
  { h: [13, 13], w: [52, 52], mouth: 'sleep' },
  { h: [72, 72], w: [45, 45], mouth: 'open' },
  { h: [58, 28], w: [40, 43], mouth: 'grin' },
  { h: [48, 48], w: [34, 34], mouth: 'tiny' },
];

function Eye({ width, height, glow }) {
  return (
    <Animated.View style={[styles.eye, {
      width, height, opacity: glow,
      borderRadius: Math.min(width, height) * 0.42,
    }]}>
      <View style={styles.shine} />
    </Animated.View>
  );
}

function Mouth({ type }) {
  const shape = type === 'open' ? styles.open
    : type === 'small' ? styles.small
    : type === 'tiny' ? styles.tiny
    : type === 'sleep' ? styles.sleep
    : type === 'grin' ? styles.grin : styles.smile;
  return <View style={[styles.mouth, shape]} />;
}

export default function App() {
  const [mood, setMood] = useState(0);
  const [charging, setCharging] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;
  const gaze = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.85)).current;
  const wasCharging = useRef(false);
  const manualUntil = useRef(0);

  useEffect(() => {
    let sub;
    let alive = true;
    Battery.getBatteryStateAsync().then((state) => {
      if (!alive) return;
      const active = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
      setCharging(active);
      wasCharging.current = active;
      sub = Battery.addBatteryStateListener(({ batteryState }) => {
        setCharging(batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL);
      });
    }).catch(() => {});
    return () => { alive = false; sub?.remove(); };
  }, []);

  useEffect(() => {
    if (charging && !wasCharging.current) {
      setMood(3);
      manualUntil.current = Date.now() + 5000;
    } else if (!charging && wasCharging.current) {
      setMood(1);
      manualUntil.current = Date.now() + 5000;
    }
    wasCharging.current = charging;
  }, [charging]);

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.7, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const look = Animated.loop(Animated.sequence([
      Animated.delay(1900),
      Animated.timing(gaze, { toValue: 8, duration: 300, useNativeDriver: true }),
      Animated.delay(650),
      Animated.timing(gaze, { toValue: -7, duration: 420, useNativeDriver: true }),
      Animated.delay(650),
      Animated.timing(gaze, { toValue: 0, duration: 320, useNativeDriver: true }),
      Animated.delay(2100),
    ]));
    const blinkLoop = Animated.loop(Animated.sequence([
      Animated.delay(2800),
      Animated.timing(blink, { toValue: 0.05, duration: 85, useNativeDriver: true }),
      Animated.delay(90),
      Animated.timing(blink, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.delay(3000),
    ]));
    pulse.start(); look.start(); blinkLoop.start();
    const timer = setInterval(() => {
      if (Date.now() < manualUntil.current) return;
      setMood((current) => {
        const options = moods.map((_, i) => i).filter((i) => i !== current && i !== 2);
        return options[Math.floor(Math.random() * options.length)];
      });
    }, 11000);
    return () => { pulse.stop(); look.stop(); blinkLoop.stop(); clearInterval(timer); };
  }, [blink, gaze, glow]);

  const tap = () => {
    manualUntil.current = Date.now() + 9000;
    setMood((current) => (current + 1) % moods.length);
    Animated.sequence([
      Animated.timing(blink, { toValue: 0.05, duration: 65, useNativeDriver: true }),
      Animated.spring(blink, { toValue: 1, useNativeDriver: true, speed: 22 }),
    ]).start();
  };

  const hold = () => {
    manualUntil.current = Date.now() + 12000;
    setMood(2);
    Animated.sequence([
      Animated.timing(blink, { toValue: 0.05, duration: 180, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 0.55, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const face = moods[mood];
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden />
      <Pressable style={styles.screen} onPress={tap} onLongPress={hold} delayLongPress={450}
        accessibilityRole="button" accessibilityLabel="Tap to change expression or hold to sleep">
        <Animated.View style={[styles.face, { transform: [{ translateX: gaze }] }]}>
          <Animated.View style={[styles.eyes, { transform: [{ scaleY: blink }] }]}>
            <Eye width={face.w[0]} height={face.h[0]} glow={glow} />
            <Eye width={face.w[1]} height={face.h[1]} glow={glow} />
          </Animated.View>
          <Mouth type={face.mouth} />
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  screen: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  face: { alignItems: 'center', justifyContent: 'center' },
  eyes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 42 },
  eye: {
    backgroundColor: BLUE, padding: 7, alignItems: 'flex-start',
    shadowColor: BLUE, shadowOpacity: 0.85, shadowRadius: 23,
    shadowOffset: { width: 0, height: 0 }, elevation: 16,
  },
  shine: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#DDF9FF', opacity: 0.85 },
  mouth: {
    marginTop: 27, borderColor: BLUE, borderWidth: 4,
    shadowColor: BLUE, shadowOpacity: 0.85, shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  smile: { width: 55, height: 27, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  grin: { width: 43, height: 23, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  open: { width: 27, height: 34, borderRadius: 18, backgroundColor: 'rgba(105,223,255,0.12)' },
  small: { width: 13, height: 13, borderRadius: 10 },
  tiny: { width: 24, height: 5, borderRadius: 5, borderWidth: 3 },
  sleep: { width: 28, height: 12, borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderBottomWidth: 3 },
});
