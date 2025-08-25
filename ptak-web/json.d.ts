/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.json' {
  const value: Record<string, any>;
  export default value;
}