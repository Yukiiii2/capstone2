import "react-native";

declare module "react-native" {
  interface ScrollViewProps {
    contentContainerClassName?: string;
  }
}

declare module "nativewind" {
  export const NativeWindStyleSheet: {
    setOutput: (options: { default: "native" | "web" }) => void;
  };
}
