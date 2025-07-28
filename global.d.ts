// Add support for require.context (used by expo-router)
declare interface NodeRequire {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
}
