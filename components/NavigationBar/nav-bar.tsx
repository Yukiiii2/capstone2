// components/NavigationBar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import LevelSelectionModal from "../StudentModal/LevelSelectionModal";
import LivesessionCommunityModal from "../StudentModal/LivesessionCommunityModal";

interface NavigationBarProps {
  defaultActiveTab?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ defaultActiveTab }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const navItems = [
    {
      icon: "home-outline",
      label: "Home",
      route: "StudentScreen/HomePage/home-page",
      onPress: () => router.push("/StudentScreen/HomePage/home-page"),
    },
    {
      icon: "mic-outline",
      label: "Speaking",
      route: "StudentScreen/SpeakingExercise/exercise-speaking",
      onPress: () => router.push("/StudentScreen/SpeakingExercise/exercise-speaking"),
    },
    {
      icon: "book-outline",
      label: "Reading",
      route: "components/LevelSelectionModal",
      onPress: () => setShowLevelModal(true),
    },
    {
      icon: "people-outline",
      label: "Community",
      route: "components/LivesessionCommunityModal",
      onPress: () => setShowCommunityModal(true),
    },
  ];

  return (
    <>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.95)', borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 50 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 8 }}>
          {navItems.map((item) => {
            const isActive = defaultActiveTab
              ? item.label === defaultActiveTab
              : pathname.includes(item.route);
            // Make the active background for Home tab wider
            const isCommunity = item.label === "Community";
            const isSpeaking = item.label === "Speaking";
            const isHome = item.label === "Home";
            const activeStyle = isActive && isHome
              ? { backgroundColor: 'rgba(255,255,255,0.14)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 16, minWidth: 64 }
              : isActive && isCommunity
                ? { backgroundColor: 'rgba(255,255,255,0.14)', paddingVertical: 8, paddingHorizontal: 2, borderRadius: 14, minWidth: 20 }
                : isActive && isSpeaking
                  ? { backgroundColor: 'rgba(255,255,255,0.14)', paddingVertical: 8, paddingHorizontal: 7, borderRadius: 14, minWidth: 36 }
                  : isActive
                    ? { backgroundColor: 'rgba(255,255,255,0.14)', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 }
                    : { backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 };
            return (
              <TouchableOpacity
                key={item.route}
                style={{ alignItems: 'center', ...activeStyle }}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? "#A78BFA" : "rgb(255, 255, 255)"}
                />
                <Text
                  style={{ color: isActive ? "#A78BFA" : "rgb(255, 255, 255)", fontSize: 12, marginTop: 4 }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={(level) => {
          setShowLevelModal(false);
          if (level === "Basic") {
            router.push("/StudentScreen/SpeakingExercise/basic-contents");
          } else if (level === "Advanced") {
            router.push("/StudentScreen/SpeakingExercise/advanced-contents");
          }
        }}
      />
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={(option) => {
          setShowCommunityModal(false);
          if (option === "Live Session") {
            router.push("/StudentScreen/StudentLiveSession/live-sessions-select");
          } else if (option === "Community Post") {
            router.push("/StudentScreen/StudentCommunity/community-selection");
          }
        }}
      />
    </>
  );
};

export default NavigationBar;