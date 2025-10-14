declare module 'react-native-simple-markdown' {
  import { StyleProp, TextStyle } from 'react-native';
  import React from 'react';

  interface MarkdownProps {
    children: string;
    styles?: {
      [key: string]: StyleProp<TextStyle>;
    };
  }

  const Markdown: React.FC<MarkdownProps>;
  export default Markdown;
}