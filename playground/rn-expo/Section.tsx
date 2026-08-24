import React from 'react';
import { Text, View } from 'react-native';

export function Section({
  title,
  dark,
  children,
}: {
  title: string;
  dark: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          opacity: 0.55,
          color: dark ? '#a8a8c0' : '#55556b',
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
