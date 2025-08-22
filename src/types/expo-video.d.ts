declare module 'expo-video' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export type ResizeMode = 'contain' | 'cover' | 'stretch';

  export interface VideoProps extends ViewProps {
    source: { uri: string } | number;
    resizeMode?: ResizeMode;
    useNativeControls?: boolean;
    isLooping?: boolean;
    shouldPlay?: boolean;
    isMuted?: boolean;
    volume?: number;
    rate?: number;
    onPlaybackStatusUpdate?: (status: VideoStatus) => void;
    onError?: (error: Error) => void;
  }

  export interface VideoStatus {
    isLoaded: boolean;
    isPlaying: boolean;
    duration: number;
    position: number;
    shouldPlay: boolean;
    didJustFinish: boolean;
  }

  export interface VideoRef {
    playAsync: () => Promise<void>;
    pauseAsync: () => Promise<void>;
    setPositionAsync: (position: number) => Promise<void>;
    setStatusAsync: (status: Partial<VideoStatus>) => Promise<VideoStatus>;
    getStatusAsync: () => Promise<VideoStatus>;
  }

  const Video: ComponentType<VideoProps>;
  export default Video;
}
