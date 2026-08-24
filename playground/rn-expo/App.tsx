import './global.css';
import React from 'react';
import { ScrollView, Switch, Text, Pressable, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { DemoNativeWind } from './DemoNativeWind';
import { DemoStyleSheet } from './DemoStyleSheet';

type Tab = 'nativewind' | 'stylesheet';

const COLORS = {
  light: { bg: '#f8f9fa', text: '#1a1a2e', muted: '#6b6b8a', tabInactive: '#55556b', border: '#e2e1f0' },
  dark: { bg: '#12121c', text: '#f0f0f5', muted: '#a8a8c0', tabInactive: '#8f8fa8', border: '#2a2a3d' },
};

export default function App() {
  const [dark, setDark] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>('nativewind');
  const c = dark ? COLORS.dark : COLORS.light;

  const tabStyle = (active: boolean) => ({
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center' as const,
    backgroundColor: active ? '#6c63ff' : 'transparent',
  });

  const tabText = (active: boolean) => ({
    color: active ? '#ffffff' : c.tabInactive,
    fontWeight: '600' as const,
    fontSize: 14,
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'bottom']}>
        {/* Header: title + dark-mode toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>⚗ Crucible RN</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 13, color: c.muted }}>{dark ? 'Dark' : 'Light'}</Text>
            <Switch
              value={dark}
              onValueChange={setDark}
              trackColor={{ false: '#c9c9dd', true: '#6c63ff' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Style-system tabs */}
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            marginHorizontal: 16,
            marginTop: 8,
            padding: 4,
            borderRadius: 12,
            backgroundColor: dark ? '#1d1d2e' : '#ececf4',
          }}
        >
          <Pressable style={tabStyle(tab === 'nativewind')} onPress={() => setTab('nativewind')}>
            <Text style={tabText(tab === 'nativewind')}>NativeWind</Text>
          </Pressable>
          <Pressable style={tabStyle(tab === 'stylesheet')} onPress={() => setTab('stylesheet')}>
            <Text style={tabText(tab === 'stylesheet')}>StyleSheet</Text>
          </Pressable>
        </View>

        {/* ponytail: generated components keep their generated token palette (light) -
            the toggle themes the app shell; regenerate with dark tokens for a dark kit. */}
        <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
          {tab === 'nativewind' ? <DemoNativeWind dark={dark} /> : <DemoStyleSheet dark={dark} />}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
