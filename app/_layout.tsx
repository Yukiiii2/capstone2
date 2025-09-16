import React, { Component, ReactNode, useEffect, useState } from "react";
import { Stack } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Image,
  Platform,
  StatusBar
} from "react-native";
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
            }}
            onPress={this.handleRefresh}
            activeOpacity={0.7}
          >
            <Text
              style={{ color: "white", fontWeight: "600", fontSize: 16 }}
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
    <Image 
      source={require('../assets/Speaksy.png')} 
      style={{ width: 120, height: 120, marginBottom: 16 }}
      resizeMode="contain"
    />
    <Text style={{color: "white", marginTop: 16, fontSize: 16}}>Voclaria is Ready</Text>
  </View>
);

// 4. Layout component
export default function Layout() {
  const [isReady, setIsReady] = useState(false);

  // Initialize app and set up UI
  useEffect(() => {
    // Set up UI for Android
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content');
      NavigationBar.setBackgroundColorAsync('#1A1F2E');
      NavigationBar.setButtonStyleAsync('light');
    }
    let mounted = true;
    
    async function prepare() {
      try {
        // Lock orientation
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        if (mounted) {
          setIsReady(true);
          await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Screen options for the stack navigator
  const screenOptions = React.useMemo(() => ({
    headerShown: false,
    animation: 'none' as const,
    contentStyle: { backgroundColor: '#1A1F2E' },
    statusBarStyle: 'light' as const,
  }), []);

  if (!isReady) {
    return <LoadingOverlay />;
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#1A1F2E' }}>
        <ExpoStatusBar style="light" />
        <NetworkStatus />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1F2E' }} edges={['right', 'left', 'bottom'] as any}>
          <Stack screenOptions={screenOptions}>
            <Stack.Screen name="index" />
            <Stack.Screen name="StudentScreen/HomePage/home-page" />
            <Stack.Screen name="StudentScreen/SpeakingExercise/exercise-speaking" />
            <Stack.Screen name="StudentScreen/ReadingExercise/basic-exercise-reading" />
            <Stack.Screen name="StudentScreen/StudentCommunity/community-selection" />
            <Stack.Screen name="StudentScreen/StudentLiveSession/live-sessions-select" />
            <Stack.Screen name="CreateAccount/create-account-student" />
            <Stack.Screen name="CreateAccount/create-account-teacher" />
            <Stack.Screen name="StudentScreen/SpeakingExercise/advanced-contents" />
            <Stack.Screen name="StudentScreen/SpeakingExercise/lessons-basic" />
            <Stack.Screen name="StudentScreen/SpeakingExercise/lessons-advanced" />
            <Stack.Screen name="TeacherScreen/TeacherDashboard/teacher-dashboard" />
            <Stack.Screen name="TeacherScreen/TeacherLiveSession/teacher-live-session" />
            <Stack.Screen name="TeacherScreen/TeacherLiveSession/teacher-live-sessions" />
            <Stack.Screen name="ProfileMenu/logout" />
          </Stack>
        </SafeAreaView>
      </View>
    </ErrorBoundary>
  );
}