import React from 'react';
import { Text, View } from 'react-native';

import { Section } from './Section';

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
import { Dialog as NwDialog } from './components/nativewind/Dialog/Dialog';
import { Form as NwForm } from './components/nativewind/Form/Form';
import { Accordion as NwAccordion } from './components/nativewind/Accordion/Accordion';
import { Tabs as NwTabs } from './components/nativewind/Tabs/Tabs';

// ponytail: compound-mode roots (Button/Card/etc.) render children inside Pressable/View
// containers - strings must always be wrapped in <Text> per RN rules.
export function DemoNativeWind({ dark }: { dark: boolean }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <View>
      <Section title="Button" dark={dark}>
        <NwButton><Text>Primary</Text></NwButton>
        <NwButton variant="secondary" size="sm"><Text>Secondary sm</Text></NwButton>
        <NwButton variant="outline"><Text>Outline</Text></NwButton>
        <NwButton variant="ghost"><Text>Ghost</Text></NwButton>
        <NwButton variant="destructive"><Text>Destructive</Text></NwButton>
        <NwButton loading><Text>Loading</Text></NwButton>
        <NwButton disabled><Text>Disabled</Text></NwButton>
      </Section>

      <Section title="Input" dark={dark}>
        <NwInput>
          <NwInput.Field placeholder="Email address" />
        </NwInput>
        <NwInput size="sm">
          <NwInput.Field placeholder="Search" />
        </NwInput>
      </Section>

      <Section title="Card" dark={dark}>
        <NwCard title="Compound card">
          <Text>Body content inside a NativeWind card.</Text>
        </NwCard>
      </Section>

      <Section title="Badge · Label · Alert" dark={dark}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <NwBadge>New</NwBadge>
          <NwLabel size="lg" required>Email</NwLabel>
        </View>
        <NwAlert variant="destructive" title="Heads up">
          <Text>Something needs your attention.</Text>
        </NwAlert>
      </Section>

      <Section title="Controls" dark={dark}>
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

      <Section title="Dialog · Form" dark={dark}>
        <NwButton variant="outline" onPress={() => setDialogOpen(true)}>
          <Text>Open dialog</Text>
        </NwButton>
        <NwDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
          <NwDialog.Content accessibilityLabel="Delete workspace">
            <NwDialog.Header>
              <NwDialog.Title>Delete workspace</NwDialog.Title>
              <NwDialog.Close />
            </NwDialog.Header>
            <NwDialog.Body>
              <Text>This action cannot be undone.</Text>
            </NwDialog.Body>
            <NwDialog.Footer>
              <NwButton size="sm" variant="ghost" onPress={() => setDialogOpen(false)}>
                <Text>Cancel</Text>
              </NwButton>
              <NwButton size="sm" variant="destructive" onPress={() => setDialogOpen(false)}>
                <Text>Delete</Text>
              </NwButton>
            </NwDialog.Footer>
          </NwDialog.Content>
        </NwDialog>
        <NwForm onSubmit={() => {}}>
          <NwForm.Field name="projectName" label="Project name" required>
            <NwForm.Control>
              <Text>field value slot</Text>
            </NwForm.Control>
            <NwForm.Message>This field is required.</NwForm.Message>
          </NwForm.Field>
        </NwForm>
      </Section>

      <Section title="Tabs · Accordion" dark={dark}>
        <NwTabs defaultValue="one">
          <NwTabs.List>
            <NwTabs.Trigger value="one"><Text>Overview</Text></NwTabs.Trigger>
            <NwTabs.Trigger value="two"><Text>Activity</Text></NwTabs.Trigger>
          </NwTabs.List>
          <NwTabs.Content value="one">
            <Text>Overview panel content.</Text>
          </NwTabs.Content>
          <NwTabs.Content value="two">
            <Text>Activity panel content.</Text>
          </NwTabs.Content>
        </NwTabs>
        <NwAccordion type="single" collapsible defaultValue="faq1" variant="bordered">
          <NwAccordion.Item value="faq1">
            <NwAccordion.Trigger><Text>What is Crucible?</Text></NwAccordion.Trigger>
            <NwAccordion.Content>
              <Text>A code generation engine for multi-framework design systems.</Text>
            </NwAccordion.Content>
          </NwAccordion.Item>
          <NwAccordion.Item value="faq2">
            <NwAccordion.Trigger><Text>Who owns the output?</Text></NwAccordion.Trigger>
            <NwAccordion.Content>
              <Text>You do — every generated file is yours to edit.</Text>
            </NwAccordion.Content>
          </NwAccordion.Item>
        </NwAccordion>
      </Section>

      <Section title="Display" dark={dark}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <NwAvatar alt="Ada Lovelace" />
          <NwAvatar alt="Grace Hopper" variant="square" size="lg" />
          <NwProgress value={70} style={{ flex: 1 }} />
        </View>
        <NwSkeleton width={220} height={16} />
        <NwSeparator />
      </Section>
    </View>
  );
}
