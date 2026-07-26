import { createTheme } from '@reactive/silk-core';
import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Box, Button, Stack, Text } from './src/components';
import { ThemeProvider } from './src/theme/ThemeProvider';

const light = createTheme({ colorScheme: 'light' });

/**
 * Minimal Expo surface proving silk-core Theme + recipes can drive RN styles
 * for Box / Stack / Text / Button without @reactive/silk or CSS variables.
 */
export function App(): JSX.Element {
  return (
    <ThemeProvider theme={light} density="comfortable">
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <Box padding="4">
            <Stack gap="4">
              <Text role="headingLg">Silk native spike</Text>
              <Text tone="secondary">
                Theme object from createTheme; styles from core recipes/tokens.
              </Text>
              <Stack gap="2" align="start">
                <Button tone="accent">Accent</Button>
                <Button variant="outline" tone="neutral">
                  Outline
                </Button>
                <Button variant="soft" tone="danger" size="sm">
                  Soft danger
                </Button>
                <Button variant="ghost" density="compact">
                  Compact ghost
                </Button>
              </Stack>
              <Text role="caption" tone="secondary">
                lineHeight = unitless multiplier × font size (RN absolute).
              </Text>
            </Stack>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
});

export default App;
