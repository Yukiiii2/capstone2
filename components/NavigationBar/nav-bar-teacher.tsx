import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

interface NavigationBarProps {
  defaultActiveTab?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ defaultActiveTab }) => {
  const router = useRouter();
  const pathname = usePathname() || "";

  const navItems = [
    {
      icon: "stats-chart-outline",
      label: "Dashboard",
      route: "/TeacherScreen/TeacherDashboard/teacher-dashboard",
      onPress: () =>
        router.replace("/TeacherScreen/TeacherDashboard/teacher-dashboard"),
    },
    {
      icon: "people-outline",
      label: "Classes",
      route: "/TeacherScreen/TeacherClasses/teacher-classes",
      onPress: () =>
        router.replace("/TeacherScreen/TeacherClasses/teacher-classes"),
    },
    {
      icon: "mic-circle-outline",
      label: "Live Session",
      route: "/TeacherScreen/TeacherLiveSession/teacher-live-sessions",
      onPress: () =>
        router.replace("/TeacherScreen/TeacherLiveSession/teacher-live-sessions"),
    },
  ];

  return (
    <>
      {/* bottom spacer so content doesn't hide behind the bar */}
      <View style={{ height: 76 }} />

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15,23,42,0.95)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          zIndex: 999,
          elevation: 20,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-around" }}>
            {navItems.map((item) => {
              const isActive = defaultActiveTab
                ? item.label === defaultActiveTab
                : pathname.startsWith(item.route);

              let activeStyle: {
                backgroundColor: string;
                paddingVertical: number;
                paddingHorizontal: number;
                borderRadius: number;
                minWidth?: number;
              } = {
                backgroundColor: "transparent",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
              };

              if (isActive) {
                activeStyle = {
                  ...activeStyle,
                  backgroundColor: "rgba(255,255,255,0.14)",
                };

                switch (item.label) {
                  case "Dashboard":
                    activeStyle.paddingHorizontal = 15;
                    activeStyle.borderRadius = 16;
                    activeStyle.minWidth = 64;
                    break;
                  case "Classes":
                    activeStyle.paddingHorizontal = 8;
                    activeStyle.borderRadius = 14;
                    activeStyle.minWidth = 50;
                    break;
                  case "Live Session":
                    activeStyle.paddingHorizontal = 7;
                    activeStyle.borderRadius = 14;
                    activeStyle.minWidth = 36;
                    break;
                  default:
                    activeStyle.paddingHorizontal = 10;
                }
              }

              return (
                <TouchableOpacity
                  key={item.route}
                  style={{ alignItems: "center", ...activeStyle }}
                  onPress={item.onPress}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={isActive ? "#A78BFA" : "rgb(255, 255, 255)"}
                  />
                  <Text
                    style={{
                      color: isActive ? "#A78BFA" : "rgb(255, 255, 255)",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </>
  );
};

export default NavigationBar;
