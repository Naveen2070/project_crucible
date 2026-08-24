import React from 'react';
import { ScrollView, Text, View } from 'react-native';

// NativeWind-styled generated kit (className-based)
import { Button as NwButton } from './components/nativewind/Button/Button';
import { Input as NwInput } from './components/nativewind/Input/Input';
import { Card as NwCard } from './components/nativewind/Card/Card';
import { Badge as NwBadge } from './components/nativewind/Badge/Badge';
import { Alert as NwAlert } from './components/nativewind/Alert/Alert';
import { Label as NwLabel } from './components/nativewind/Label/Label';
import { Avatar as NwAvatar } from './components/nativewind/Avatar/Avatar';
import { Progress as NwProgress } from './components/nativewind/Progress/Progress';
import { Separator as NwSeparator } from './components/nativewind/Separator/Separator';
import { Skeleton as NwSkeleton } from './components/nativewind/Skeleton/Skeleton';
import { Switch as NwSwitch } from './components/nativewind/Switch/Switch';
import { Checkbox as NwCheckbox } from './components/nativewind/Checkbox/Checkbox';
import { RadioGroup as NwRadioGroup } from './components/nativewind/RadioGroup/RadioGroup';
import { Textarea as NwTextarea } from './components/nativewind/Textarea/Textarea';

// StyleSheet-styled generated kit (theme-object-based)
import { Button as SsButton } from './components/stylesheet/Button/Button';
import { Input as SsInput } from './components/stylesheet/Input/Input';
import { Card as SsCard } from './components/stylesheet/Card/Card';
import { Badge as SsBadge } from './components/stylesheet/Badge/Badge';
import { Alert as SsAlert } from './components/stylesheet/Alert/Alert';
import { Label as SsLabel } from './components/stylesheet/Label/Label';
import { Avatar as SsAvatar } from './components/stylesheet/Avatar/Avatar';
import { Progress as SsProgress } from './components/stylesheet/Progress/Progress';
import { Separator as SsSeparator } from './components/stylesheet/Separator/Separator';
import { Skeleton as SsSkeleton } from './components/stylesheet/Skeleton/Skeleton';
import { Switch as SsSwitch } from './components/stylesheet/Switch/Switch';
import { Checkbox as SsCheckbox } from './components/stylesheet/Checkbox/Checkbox';
import { RadioGroup as SsRadioGroup } from './components/stylesheet/RadioGroup/RadioGroup';
import { Textarea as SsTextarea } from './components/stylesheet/Textarea/Textarea';

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
        <NwLabel size="lg" required>Email</NwLabel>
        <NwAlert variant="destructive" title="Heads up">
          Something needs your attention.
        </NwAlert>
      </Section>

      <Section title="NativeWind · Controls">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <NwSwitch defaultChecked onCheckedChange={() => {}} />
          <NwCheckbox label="Subscribe" />
        </View>
        <NwRadioGroup defaultValue="email">
          <NwRadioGroup.Item value="email" label="Email" description="Digest weekly" />
          <NwRadioGroup.Item value="push" label="Push" />
        </NwRadioGroup>
        <NwTextarea placeholder="Bio" rows={3} />
      </Section>

      <Section title="NativeWind · Display">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <NwAvatar alt="Ada Lovelace" />
          <NwAvatar alt="Grace Hopper" variant="square" size="lg" />
          <NwProgress value={70} style={{ flex: 1 }} />
        </View>
        <NwSkeleton width={220} height={16} />
        <NwSeparator />
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
        <SsLabel required>Workspace name</SsLabel>
        <SsAlert title="Heads up">Something happened.</SsAlert>
      </Section>

      <Section title="StyleSheet · Controls">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <SsSwitch defaultChecked onCheckedChange={() => {}} />
          <SsCheckbox label="Subscribe" />
        </View>
        <SsRadioGroup defaultValue="email">
          <SsRadioGroup.Item value="email" label="Email" description="Digest weekly" />
          <SsRadioGroup.Item value="push" label="Push" />
        </SsRadioGroup>
        <SsTextarea placeholder="Bio" rows={3} />
      </Section>

      <Section title="StyleSheet · Display">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SsAvatar alt="Alan Turing" />
          <SsAvatar alt="Edsger Dijkstra" variant="square" size="lg" />
          <SsProgress value={40} style={{ flex: 1 }} />
        </View>
        <SsSkeleton width={220} height={16} />
        <SsSeparator />
      </Section>
    </ScrollView>
  );
}
