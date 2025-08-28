import 'react-native';

declare module 'react-native' {
  // Extend all relevant component props with className
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface TouchableNativeFeedbackProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface ModalProps {
    className?: string;
  }
}

declare module "nativewind" {
  export const NativeWindStyleSheet: {
    setOutput: (options: { default: "native" | "web" }) => void;
  };
}
