// index.tsx
import "expo-router/entry";
import { NativeWindStyleSheet } from "nativewind";
import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";

NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/landing-page");
    }, 500); // Redirect after 0.5s
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-[#0A0A0F]">
      <ActivityIndicator size="large" color="#8A5CFF" />
      <Text className="text-white mt-3 text-base">Loading...</Text>
    </View>
  );
}