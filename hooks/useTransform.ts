import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export const useTransform = () => {
  const translateX = useRef(new Animated.Value(0)).current;

  const setTransform = useCallback((toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const resetTransform = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  return {
    translateX,
    setTransform,
    resetTransform,
  };
};

export default useTransform;
