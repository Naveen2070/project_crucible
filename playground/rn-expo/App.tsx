import React from 'react';
import { ScrollView, Text, View } from 'react-native';

// NativeWind-styled generated kit (className-based)
import { Button as NwButton } from './components/nativewind/Button/Button';
import { Input as NwInput } from './components/nativewind/Input/Input';
import { Card as NwCard } from './components/nativewind/Card/Card';
import { Badge as NwBadge } from './components/nativewind/Badge/Badge';
import { Alert as NwAlert } from './components/nativewind/Alert/Alert';

// StyleSheet-styled generated kit (theme-object-based)
import { Button as SsButton } from './components/stylesheet/Button/Button';
import { Input as SsInput } from './components/stylesheet/Input/Input';
import { Card as SsCard } from './components/stylesheet/Card/Card';
import { Badge as SsBadge } from './components/stylesheet/Badge/Badge';
import { Alert as SsAlert } from './components/stylesheet/Alert/Alert';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', opacity: 0.5 }}>{title}</Text>
      {children}
    </View>
  );
}

export default function App() {
  return (
    <ScrollView contentContainerStyle={{ paddingVertical: 32 }}>
      <Section title="NativeWind · Button">
        <NwButton>Primary</NwButton>
        <NwButton variant="secondary" size="sm">Secondary sm</NwButton>
        <NwButton variant="outline">Outline</NwButton>
        <NwButton variant="ghost">Ghost</NwButton>
        <NwButton variant="destructive">Destructive</NwButton>
        <NwButton loading>Loading</NwButton>
        <NwButton disabled>Disabled</NwButton>
      </Section>

      <Section title="NativeWind · Input">
        <NwInput>
          <NwInput.Field placeholder="Email address" />
        </NwInput>
        <NwInput size="sm">
          <NwInput.Field placeholder="Search" />
        </NwInput>
      </Section>

      <Section title="NativeWind · Card">
        <NwCard title="Compound card">
          Body content inside a NativeWind card.
        </NwCard>
      </Section>

      <Section title="NativeWind · Badge & Alert">
        <NwBadge>New</NwBadge>
        <NwAlert variant="destructive" title="Heads up">
          Something needs your attention.
        </NwAlert>
      </Section>

      <Section title="StyleSheet · Button">
        <SsButton>Primary</SsButton>
        <SsButton variant="secondary" size="lg">Secondary lg</SsButton>
        <SsButton variant="outline">Outline</SsButton>
        <SsButton loading>Loading</SsButton>
        <SsButton disabled>Disabled</SsButton>
      </Section>

      <Section title="StyleSheet · Input">
        <SsInput>
          <SsInput.Field placeholder="Email address" />
        </SsInput>
        <SsInput size="sm">
          <SsInput.Field placeholder="Search" />
        </SsInput>
      </Section>

      <Section title="StyleSheet · Card">
        <SsCard title="Themed card">
          Body content styled via the JS theme object.
        </SsCard>
      </Section>

      <Section title="StyleSheet · Badge & Alert">
        <SsBadge>Beta</SsBadge>
        <SsAlert title="Heads up">Something happened.</SsAlert>
      </Section>
    </ScrollView>
  );
}
