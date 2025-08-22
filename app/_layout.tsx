// app/_layout.tsx
import React, { Component, ReactNode, useEffect, useState, createContext, useContext, useRef } from "react";
import { Stack } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Animated,
  Dimensions,
} from "react-native";

import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import Logout from './logout';

// Transform Context for managing layout transforms
interface TransformContextType {
  translateX: Animated.Value;
  resetTransform: () => void;
  setTransform: (value: number) => void;
}

const TransformContext = createContext<TransformContextType | null>(null);

export const useTransform = () => {
  const context = useContext(TransformContext);
  if (!context) {
    throw new Error('useTransform must be used within TransformProvider');
  }
  return context;
};

// Transform Provider Component
const TransformProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const resetTransform = () => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,  // Changed to true for better performance
    }).start();
  };

  const setTransform = (value: number) => {
    Animated.timing(translateX, {
      toValue: value,
      duration: 300,
      useNativeDriver: true,  // Changed to true for better performance
    }).start();
  };

  // Apply transform style to children
  const animatedStyle = {
    transform: [
      {
        translateX: translateX.interpolate({
          inputRange: [-500, 0, 500],
          outputRange: [-500, 0, 500],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <TransformContext.Provider value={{ translateX, resetTransform, setTransform }}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </TransformContext.Provider>
  );
};

// 1. Error Boundary for crash handling
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0A0A0F",
            paddingHorizontal: 20,
          }}
        >
          <Ionicons name="warning" size={48} color="#8A5CFF" />
          <Text
            style={{
              color: "white",
              fontSize: 18,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#8A5CFF",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 8,
              marginTop: 12,
              minHeight: 48,
              justifyContent: "center",
            }}
            onPress={this.handleRefresh}
            activeOpacity={0.7}
          >
            <Text
              style={{ color: "white", fontWeight: "600", fontSize: 16 }}
              allowFontScaling={false}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// 2. Connection Status Banner
const NetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={{backgroundColor: "#FF6B6B", padding: 8, flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
      <Ionicons name="wifi-outline" size={16} color="white" />
      <Text style={{color: "white", marginLeft: 8, fontSize: 14}}>No internet connection</Text>
    </View>
  );
};

// 3. Initial loading screen
const LoadingOverlay = () => (
  <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0A0F"}}>
    <Ionicons name="chatbubbles" size={48} color="#8A5CFF" />
    <Text style={{color: "white", marginTop: 16, fontSize: 16}}>Loading Speaksy...</Text>
  </View>
);

// 4. Layout component
export default function Layout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Initialize app
  useEffect(() => {
    async function prepare() {
      try {
        // Lock orientation
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        
        // Add any other initialization here
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // Simple screen options
  const screenOptions = {
    headerShown: false,
    animation: 'fade' as const,
    contentStyle: { backgroundColor: 'transparent' },
  };

  if (!isReady) {
    return <LoadingOverlay />;
  }

  return (
    <TransformProvider>
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: '#1A1F2E' }}>
          <StatusBar style="light" />
          <NetworkStatus />
          <SafeAreaView style={{ flex: 1 }} edges={['right', 'left', 'bottom'] as any}>
            <Stack screenOptions={screenOptions}>
              <Stack.Screen name="index" />
              <Stack.Screen name="advanced-contents" options={{ animation: 'slide_from_right' as const }} />
              <Stack.Screen name="teacher-dashboard" />
              <Stack.Screen name="teacher-community" options={{ animation: 'slide_from_right' as const }} />
              <Stack.Screen name="teacher-live-session" options={{ animation: 'slide_from_right' as const }} />
              <Stack.Screen name="exercise-speaking" options={{ animation: 'slide_from_right' as const }} />
              <Stack.Screen name="home-page" />
              <Stack.Screen 
                name="logout" 
                options={{ 
                  animation: 'slide_from_right' as const,
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' }
                }}
              />
            </Stack>
          </SafeAreaView>
        </View>
      </ErrorBoundary>
    </TransformProvider>
  );
}