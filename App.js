import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Battery from 'expo-battery';
import { StatusBar } from 'expo-status-bar';

// Charge Vide is a face-first digital pet: the screen is its face.
// The visual design is original and uses simple glowing OLED-style features.
const expressions = [
  { name: 'HAPPY', line: 'Hey! You’re back.', eyeW: 34, eyeH: 54, radius: 22, mouth: '⌣' },
  { name: 'CURIOUS', line: 'Hmm? What’s that?', eyeW: 39, eyeH: 64, radius: 22, mouth: 'o' },
  { name: 'SLEEPY', line: 'Just five more minutes…', eyeW: 48, eyeH: 12, radius: 12, mouth: 'ᴗ' },
  { name: 'SURPRISED', line: 'Whoa! Hello!', eyeW: 43, eyeH: 67, radius: 24, mouth: 'O' },
  { name: 'PLAYFUL', line: 'Boop! Do it again.', eyeW: 37, eyeH: 47, radius: 22, mouth: 'ω' },
];

const CYAN = '#72DFFF';

export default function App() {
  const [battery, setBattery] = useState(0.68);
  const [charging, setCharging] = useState(false);
  const [moodIndex, setMoodIndex] = useState(0);
  const [batteryAvailable, setBatteryAvailable] = useState(true);
  const blink = useRef(new Animated.Value(1)).current;
  const gaze = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.72)).current;
  const previousCharging = useRef(false);
  const manualMoodUntil = useRef(0);

  useEffect(() => {
    let stateSub;
    let levelSub;
    let alive = true;

    const loadBattery = async () => {
      try {
        const [level, state] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);
        if (!alive) return;
        if (level >= 0) setBattery(level);
        setBatteryAvailable(level >= 0);
        const isCharging = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
        setCharging(isCharging);
        previousCharging.current = isCharging;

        stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
          const next = batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;
          setCharging(next);
        });
        levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          if (batteryLevel >= 0) setBattery(batteryLevel);
        });
      } catch (error) {
        if (alive) setBatteryAvailable(false);
      }
    };

    loadBattery();
    return () => {
      alive = false;
      stateSub?.remove();
      levelSub?.remove();
    };
  }, []);

  // React to plugging in and unplugging with a distinct expression.
  useEffect(() => {
    if (charging && !previousCharging.current) setMoodIndex(3);
    if (!charging && previousCharging.current) setMoodIndex(2);
    previousCharging.current = charging;
  }, [charging]);

  // Gentle OLED eye glow and occasional glance/blink keep the face alive.
  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.68, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const gazeLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(gaze, { toValue: 7, duration: 260, useNativeDriver: true }),
        Animated.delay(650),
        Animated.timing(gaze, { toValue: -6, duration: 420, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(gaze, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(2200),
      ])
    );
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(blink, { toValue: 0.08, duration: 85, useNativeDriver: true }),
        Animated.delay(90),
        Animated.timing(blink, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.delay(3200),
      ])
    );
    glowLoop.start();
    gazeLoop.start();
    blinkLoop.start();
    // Give the pet a little life even when nobody is touching the screen.
    const moodTimer = setInterval(() => {
      if (Date.now() < manualMoodUntil.current) return;
      setMoodIndex((current) => {
        const choices = expressions.map((_, index) => index).filter((index) => index !== current && index !== 2);
        return choices[Math.floor(Math.random() * choices.length)];
      });
    }, 11000);
    return () => {
      glowLoop.stop();
      gazeLoop.stop();
      blinkLoop.stop();
      clearInterval(moodTimer);
    };
  }, [blink, gaze, glow]);

  const tapFace = () => {
    manualMoodUntil.current = Date.now() + 9000;
    setMoodIndex((current) => (current + 1) % expressions.length);
    Animated.sequence([
      Animated.timing(blink, { toValue: 0.08, duration: 65, useNativeDriver: true }),
      Animated.spring(blink, { toValue: 1, useNativeDriver: true, speed: 22 }),
    ]).start();
  };

  const holdFace = () => {
    manualMoodUntil.current = Date.now() + 12000;
    setMoodIndex(2); // A long press makes the little pet sleepy.
    Animated.sequence([
      Animated.timing(blink, { toValue: 0.06, duration: 180, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 0.35, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const mood = expressions[moodIndex];
  const percent = batteryAvailable ? Math.round(battery * 100) : '--';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" backgroundColor="#000000" />
      <View style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>charge vide</Text>
            <Text style={styles.subtitle}>YOUR POCKET-SIZED DIGITAL PET</Text>
          </View>
          <View style={styles.status}>
            <View style={[styles.statusDot, charging && styles.statusDotOn]} />
            <Text style={styles.statusText}>{charging ? 'CHARGING' : 'IDLE'}</Text>
          </View>
        </View>

        <View style={styles.faceStage}>
          <Text style={styles.speech}>{charging ? 'Yesss! Power time!' : mood.line}</Text>
          <Pressable
            onPress={tapFace}
            onLongPress={holdFace}
            delayLongPress={450}
            accessibilityRole="button"
            accessibilityLabel="Tap to change Charge Vide's expression, or press and hold to make it sleepy"
            style={styles.faceTapArea}
          >
            <Animated.View style={[styles.faceFeatures, { transform: [{ translateX: gaze }] }]}>
              <Animated.View style={[styles.eyesRow, { transform: [{ scaleY: blink }] }]}>
                {[0, 1].map((eye) => (
                  <Animated.View
                    key={eye}
                    style={[
                      styles.eye,
                      {
                        width: mood.eyeW,
                        height: mood.eyeH,
                        borderRadius: mood.radius,
                        opacity: glow,
                        shadowOpacity: 0.35,
                      },
                    ]}
                  />
                ))}
              </Animated.View>
              <Text style={styles.mouth}>{mood.mouth}</Text>
            </Animated.View>
          </Pressable>
          <Text style={styles.mood}>{charging ? '⚡ FULL OF ENERGY' : mood.name}</Text>
          <Text style={styles.tapHint}>TAP TO PLAY  ·  HOLD TO SLEEP</Text>
        </View>

        <View style={styles.bottomPanel}>
          <View style={styles.batteryTop}>
            <Text style={styles.panelLabel}>PHONE BATTERY</Text>
            <Text style={styles.percent}>{percent}<Text style={styles.percentUnit}>%</Text></Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: batteryAvailable ? `${Math.max(0, Math.min(1, battery)) * 100}%` : '68%' }]} />
          </View>
          <View style={styles.batteryBottom}>
            <Text style={styles.hint}>{batteryAvailable ? 'Live battery level' : 'Battery status unavailable'}</Text>
            <Text style={styles.hint}>{charging ? 'Getting energized' : 'Waiting for a charger'}</Text>
          </View>
        </View>
        <Text style={styles.footer}>A little personality, on a black screen.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  page: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 25, paddingTop: 18, paddingBottom: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#F4FAFF', fontSize: 27, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: '#56616D', fontSize: 8, letterSpacing: 1.8, fontWeight: '700', marginTop: 4 },
  status: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#202A32', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  statusDot: { width: 6, height: 6, borderRadius: 5, backgroundColor: '#65717B', marginRight: 7 },
  statusDotOn: { backgroundColor: CYAN },
  statusText: { color: '#A9B8C4', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  faceStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  speech: { color: '#AAB8C4', fontSize: 15, fontWeight: '600', marginBottom: 48 },
  faceTapArea: { width: '100%', minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  faceFeatures: { alignItems: 'center', justifyContent: 'center' },
  eyesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 42 },
  eye: {
    backgroundColor: CYAN,
    shadowColor: CYAN,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  mouth: {
    color: CYAN,
    fontSize: 43,
    lineHeight: 58,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: CYAN,
    textShadowRadius: 15,
    marginTop: 10,
  },
  mood: { color: CYAN, fontSize: 9, fontWeight: '800', letterSpacing: 2.6, marginTop: 36 },
  tapHint: { color: '#4C5964', fontSize: 8, letterSpacing: 1.8, marginTop: 12 },
  bottomPanel: { backgroundColor: '#090D11', borderColor: '#18222B', borderWidth: 1, borderRadius: 18, padding: 17 },
  batteryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  panelLabel: { color: '#71808C', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  percent: { color: '#E8F7FF', fontSize: 23, fontWeight: '800' },
  percentUnit: { color: '#8297A5', fontSize: 12 },
  track: { height: 5, backgroundColor: '#1C2932', borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: CYAN, borderRadius: 6 },
  batteryBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  hint: { color: '#65737D', fontSize: 9 },
  footer: { color: '#3E4A54', fontSize: 9, textAlign: 'center', marginTop: 14 },
});
