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

const LIME = '#C5F66B';

const expressions = [
  { eyes: '•     •', mouth: 'ᴗ', mood: 'feeling good', line: 'Hey! You came back.' },
  { eyes: '◉     ◉', mouth: 'o', mood: 'curious', line: 'What are we doing?' },
  { eyes: '—     —', mouth: 'ᴗ', mood: 'sleepy', line: 'Five more minutes…' },
  { eyes: '✦     ✦', mouth: 'ᴗ', mood: 'excited', line: 'LET’S GOOO!' },
  { eyes: '⌁     ⌁', mouth: '﹏', mood: 'silly', line: 'Boop! Hehe.' },
];

export default function App() {
  const [battery, setBattery] = useState(0.68);
  const [charging, setCharging] = useState(false);
  const [moodIndex, setMoodIndex] = useState(0);
  const [batteryAvailable, setBatteryAvailable] = useState(true);
  const bob = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -7, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.035, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    bobLoop.start();
    pulseLoop.start();

    let stateSub;
    let levelSub;
    const loadBattery = async () => {
      try {
        const [level, state] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);
        if (level >= 0) setBattery(level);
        setCharging(state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL);
        setBatteryAvailable(level >= 0);
        stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
          setCharging(batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL);
        });
        levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          if (batteryLevel >= 0) setBattery(batteryLevel);
        });
      } catch (e) {
        setBatteryAvailable(false);
      }
    };
    loadBattery();

    return () => {
      bobLoop.stop();
      pulseLoop.stop();
      stateSub?.remove();
      levelSub?.remove();
    };
  }, [bob, pulse]);

  const react = () => {
    setMoodIndex((current) => (current + 1) % expressions.length);
    Animated.sequence([
      Animated.spring(blink, { toValue: 0.88, useNativeDriver: true, speed: 25 }),
      Animated.spring(blink, { toValue: 1, useNativeDriver: true, speed: 18 }),
    ]).start();
  };

  const mood = expressions[moodIndex];
  const percent = batteryAvailable ? Math.round(battery * 100) : '--';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>YOUR LITTLE CHARGING COMPANION</Text>
            <Text style={styles.brand}>charge vide</Text>
          </View>
          <View style={styles.livePill}>
            <View style={[styles.liveDot, charging && styles.liveDotOn]} />
            <Text style={styles.liveText}>{charging ? 'CHARGING' : 'IDLE'}</Text>
          </View>
        </View>

        <View style={styles.stage}>
          <Text style={styles.speech}>{charging ? 'Yay! More energy!' : mood.line}</Text>
          <Pressable onPress={react} accessibilityRole="button" accessibilityLabel="Tap Charge Vide bot to change its expression">
            <Animated.View style={[styles.petWrap, { transform: [{ translateY: bob }, { scale: pulse }] }]}>
              <View style={styles.botShadow} />
              <View style={styles.bot}>
                <View style={styles.antennaStem} />
                <View style={styles.antennaBall} />
                <Animated.View style={[styles.face, { transform: [{ scaleY: blink }] }]}>
                  <Text style={styles.eyes}>{mood.eyes}</Text>
                  <Text style={styles.mouth}>{mood.mouth}</Text>
                  <View style={styles.cheekLeft} />
                  <View style={styles.cheekRight} />
                </Animated.View>
                <View style={styles.botBadge}><Text style={styles.bolt}>ϟ</Text></View>
              </View>
            </Animated.View>
          </Pressable>
          <Text style={styles.moodLabel}>{charging ? 'EXCITED TO BE CHARGING' : mood.mood.toUpperCase()}</Text>
          <Text style={styles.tapHint}>TAP YOUR LITTLE BOT</Text>
        </View>

        <View style={styles.batteryCard}>
          <View style={styles.batteryHead}>
            <Text style={styles.cardTitle}>BATTERY LEVEL</Text>
            <Text style={styles.percent}>{percent}<Text style={styles.percentSign}>%</Text></Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: batteryAvailable ? `${Math.max(0, Math.min(1, battery)) * 100}%` : '68%' }]} />
          </View>
          <View style={styles.batteryFoot}>
            <Text style={styles.footText}>{batteryAvailable ? 'Live battery reading' : 'Battery reading unavailable'}</Text>
            <Text style={styles.footText}>{charging ? 'Powering up ⚡' : 'Waiting for a little energy'}</Text>
          </View>
        </View>

        <Text style={styles.footer}>A tiny spark of personality. ⚡</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080D0A' },
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: '#829187', fontSize: 9, letterSpacing: 1.7, fontWeight: '800' },
  brand: { color: '#F2F8F3', fontSize: 29, fontWeight: '900', letterSpacing: -1.2, marginTop: 3 },
  livePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#17231B', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 30 },
  liveDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#829187', marginRight: 7 },
  liveDotOn: { backgroundColor: LIME },
  liveText: { color: LIME, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  speech: { color: '#E6F1E8', fontSize: 17, fontWeight: '700', marginBottom: 26 },
  petWrap: { alignItems: 'center', justifyContent: 'center', width: 260, height: 290 },
  botShadow: { position: 'absolute', bottom: 5, width: 185, height: 22, borderRadius: 100, backgroundColor: '#000', opacity: 0.45 },
  bot: { width: 218, height: 235, borderRadius: 76, backgroundColor: LIME, borderWidth: 3, borderColor: '#E2FFB5', alignItems: 'center', justifyContent: 'center', shadowColor: LIME, shadowOpacity: 0.2, shadowRadius: 28, elevation: 15 },
  antennaStem: { position: 'absolute', top: -24, width: 7, height: 29, borderRadius: 8, backgroundColor: LIME },
  antennaBall: { position: 'absolute', top: -31, width: 16, height: 16, borderRadius: 10, backgroundColor: '#E2FFB5' },
  face: { width: 172, height: 132, borderRadius: 46, backgroundColor: '#142019', borderWidth: 2, borderColor: '#304A35', alignItems: 'center', justifyContent: 'center' },
  eyes: { color: '#D1FF9B', fontSize: 32, fontWeight: '900', letterSpacing: 4, marginTop: 5 },
  mouth: { color: '#D1FF9B', fontSize: 30, fontWeight: '800', marginTop: -1 },
  cheekLeft: { position: 'absolute', left: 13, top: 83, width: 13, height: 7, borderRadius: 10, backgroundColor: '#8DCB55', opacity: 0.7 },
  cheekRight: { position: 'absolute', right: 13, top: 83, width: 13, height: 7, borderRadius: 10, backgroundColor: '#8DCB55', opacity: 0.7 },
  botBadge: { position: 'absolute', bottom: 12, width: 29, height: 23, borderRadius: 10, backgroundColor: '#9BDD50', alignItems: 'center', justifyContent: 'center' },
  bolt: { color: '#426B28', fontSize: 18, fontWeight: '900' },
  moodLabel: { color: LIME, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 18 },
  tapHint: { color: '#66736A', fontSize: 9, letterSpacing: 1.5, marginTop: 9 },
  batteryCard: { backgroundColor: '#121A15', borderColor: '#26362A', borderWidth: 1, borderRadius: 22, padding: 18 },
  batteryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  cardTitle: { color: '#92A296', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  percent: { color: '#DFFFB6', fontSize: 25, fontWeight: '900' },
  percentSign: { fontSize: 14, color: '#A7D66E' },
  track: { height: 8, borderRadius: 8, backgroundColor: '#29352C', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: LIME, borderRadius: 8 },
  batteryFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  footText: { color: '#748178', fontSize: 9 },
  footer: { color: '#66736A', textAlign: 'center', fontSize: 11, marginTop: 15 },
});
