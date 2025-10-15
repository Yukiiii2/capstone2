import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabaseClient";

/**
 * Handles both:
 * - new Supabase "code" (PKCE): /auth/callback?code=...
 * - older "access_token/refresh_token" in URL (hash or query)
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let done = false;

    (async () => {
      try {
        // 1) PKCE flow (recommended): /auth/callback?code=...
        if (code && typeof code === "string") {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          done = true;
          router.replace("/StudentScreen/HomePage/home-page");
          return;
        }

        // 2) Legacy hash/query tokens (fallback)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          // Support tokens in hash (#access_token=) or query (?access_token=)
          const parse = (u: string) => {
            const q = u.includes("#") ? u.split("#")[1] : u.split("?")[1];
            const params = new URLSearchParams(q ?? "");
            return {
              access_token: params.get("access_token"),
              refresh_token: params.get("refresh_token"),
            };
          };
          const { access_token, refresh_token } = parse(initialUrl);
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            done = true;
            router.replace("/StudentScreen/HomePage/home-page");
            return;
          }
        }

        setMessage("Invalid or expired confirmation link.");
      } catch (e: any) {
        setMessage(e?.message ?? "Sign-in failed.");
      }
    })();

    return () => {
      done = true;
    };
  }, [code]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      {message.startsWith("Finishing") ? <ActivityIndicator /> : null}
      <Text style={{ color: "white", marginTop: 10, textAlign: "center" }}>{message}</Text>
    </View>
  );
}
