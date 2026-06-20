/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/beneficiaries` | `/(tabs)/cards` | `/(tabs)/profile` | `/(tabs)/transactions` | `/(tabs)/wallet` | `/_sitemap` | `/beneficiaries` | `/bill-payment` | `/cards` | `/login` | `/notifications` | `/profile` | `/register` | `/statement` | `/ticket-booking` | `/transactions` | `/transfer` | `/wallet`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
