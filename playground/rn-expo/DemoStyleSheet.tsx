import React from 'react';
import { Text, View } from 'react-native';

import { Section } from './Section';

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
import { Accordion as SsAccordion } from './components/stylesheet/Accordion/Accordion';
import { Tabs as SsTabs } from './components/stylesheet/Tabs/Tabs';
import { Dialog as SsDialog } from './components/stylesheet/Dialog/Dialog';
import { Form as SsForm } from './components/stylesheet/Form/Form';

export function DemoStyleSheet({ dark }: { dark: boolean }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <View>
      <Section title="Button" dark={dark}>
        <SsButton><Text>Primary</Text></SsButton>
        <SsButton variant="secondary" size="lg"><Text>Secondary lg</Text></SsButton>
        <SsButton variant="outline"><Text>Outline</Text></SsButton>
        <SsButton loading><Text>Loading</Text></SsButton>
        <SsButton disabled><Text>Disabled</Text></SsButton>
      </Section>

      <Section title="Input" dark={dark}>
        <SsInput>
          <SsInput.Field placeholder="Email address" />
        </SsInput>
        <SsInput size="sm">
          <SsInput.Field placeholder="Search" />
        </SsInput>
      </Section>

      <Section title="Card" dark={dark}>
        <SsCard title="Themed card">
          <Text>Body content styled via the JS theme object.</Text>
        </SsCard>
      </Section>

      <Section title="Badge · Label · Alert" dark={dark}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <SsBadge>Beta</SsBadge>
          <SsLabel required>Workspace name</SsLabel>
        </View>
        <SsAlert title="Heads up">
          <Text>Something happened.</Text>
        </SsAlert>
      </Section>

      <Section title="Controls" dark={dark}>
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

      <Section title="Dialog · Form" dark={dark}>
        <SsButton variant="outline" onPress={() => setDialogOpen(true)}>
          <Text>Open dialog</Text>
        </SsButton>
        <SsDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} variant="confirm">
          <SsDialog.Content accessibilityLabel="Confirm deployment">
            <SsDialog.Header>
              <SsDialog.Title>Deploy to production?</SsDialog.Title>
              <SsDialog.Close />
            </SsDialog.Header>
            <SsDialog.Body>
              <Text>The build will go live immediately.</Text>
            </SsDialog.Body>
            <SsDialog.Footer>
              <SsButton size="sm" variant="ghost" onPress={() => setDialogOpen(false)}>
                <Text>Cancel</Text>
              </SsButton>
              <SsButton size="sm" onPress={() => setDialogOpen(false)}>
                <Text>Deploy</Text>
              </SsButton>
            </SsDialog.Footer>
          </SsDialog.Content>
        </SsDialog>
        <SsForm onSubmit={() => {}}>
          <SsForm.Field name="environment" label="Environment" required>
            <SsForm.Control>
              <Text>field value slot</Text>
            </SsForm.Control>
          </SsForm.Field>
        </SsForm>
      </Section>

      <Section title="Tabs · Accordion" dark={dark}>
        <SsTabs defaultValue="overview">
          <SsTabs.List>
            <SsTabs.Trigger value="overview"><Text>Overview</Text></SsTabs.Trigger>
            <SsTabs.Trigger value="settings"><Text>Settings</Text></SsTabs.Trigger>
          </SsTabs.List>
          <SsTabs.Content value="overview">
            <Text>Overview panel content.</Text>
          </SsTabs.Content>
          <SsTabs.Content value="settings">
            <Text>Settings panel content.</Text>
          </SsTabs.Content>
        </SsTabs>
        <SsAccordion type="single" collapsible defaultValue="intro" variant="separated">
          <SsAccordion.Item value="intro">
            <SsAccordion.Trigger><Text>Getting started</Text></SsAccordion.Trigger>
            <SsAccordion.Content>
              <Text>Run crucible add and own every emitted file.</Text>
            </SsAccordion.Content>
          </SsAccordion.Item>
        </SsAccordion>
      </Section>

      <Section title="Display" dark={dark}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SsAvatar alt="Alan Turing" />
          <SsAvatar alt="Edsger Dijkstra" variant="square" size="lg" />
          <SsProgress value={40} style={{ flex: 1 }} />
        </View>
        <SsSkeleton width={220} height={16} />
        <SsSeparator />
      </Section>
    </View>
  );
}
