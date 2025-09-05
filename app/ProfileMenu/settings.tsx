// app/settings.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";

// ⬇️ keep your project’s import style
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const router = useRouter();

  // ---------- Profile state ----------
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);

  // Local, unsaved image preview (chosen from gallery)
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  // ----- derived initials for fallback avatar -----
  const initials = useMemo(() => {
    if (!fullName) return "U";
    const parts = fullName.trim().split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [fullName]);

  // ---------- load current user + profile ----------
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !mounted) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const nameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      if (!mounted) return;
      setFullName(nameValue);

      // resolve avatar signed URL from "avatars" bucket
      const resolveSigned = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        // if already contains filename (extension), use as is
        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          // otherwise list the latest file in the user's folder
          const { data: list, error: listErr } = await supabase.storage
            .from("avatars")
            .list(normalized, {
              limit: 1,
              sortBy: { column: "created_at", order: "desc" },
            });
          if (listErr) return null;
          if (list && list.length > 0) objectPath = `${normalized}/${list[0].name}`;
        }

        if (!objectPath) return null;

        const { data: signed, error: signErr } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60); // 1 hour

        if (signErr) return null;
        return signed?.signedUrl ?? null;
      };

      const url = await resolveSigned();
      if (!mounted) return;
      setAvatarSignedUrl(url);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGoBack = () => router.back();

  // ---------- image picking (only preview until Save) ----------
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "You need to allow access to your gallery to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  // ✅ Paste this over your existing uploadAvatarIfNeeded
const uploadAvatarIfNeeded = async (userId: string) => {
  if (!localImageUri) return null;

  // 1) Auth token for private bucket
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  // 2) Derive Storage base URL without env vars (works for private buckets too)
  const probe = supabase.storage.from("avatars").getPublicUrl("__probe__").data.publicUrl;
  if (!probe) throw new Error("Could not derive Supabase storage URL");
  // e.g. https://<project>.supabase.co/storage/v1/object/public/avatars/__probe__
  const STORAGE_BASE = probe.split("/object/")[0]; // -> https://<project>.supabase.co/storage/v1

  // 3) Normalize local file URI (Android may return content://)
  let fileUri = localImageUri;
  if (fileUri.startsWith("content://")) {
    const tmp = `${FileSystem.cacheDirectory}avatar_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: fileUri, to: tmp });
    fileUri = tmp;
  }

  // 4) Build destination path + content type
  const ext = (fileUri.split("?")[0].split(".").pop() || "jpg").toLowerCase();
  const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
  const fileName = `${Date.now()}.${ext}`;
  const objectPath = `${userId}/${fileName}`;

  // 5) Upload raw bytes to Storage (POST /object/avatars/<path>)
  //    IMPORTANT: use encodeURI (NOT encodeURIComponent) so / stays as /.
  const uploadUrl = `${STORAGE_BASE}/object/avatars/${encodeURI(objectPath)}`;

  const res = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${token}`, // auth for private bucket
      "Content-Type": contentType,
      "x-upsert": "true",
      // apikey header is optional; omit if you don't have your anon key here
      // apikey: YOUR_ANON_KEY,
    },
  });

  if (res.status !== 200 && res.status !== 201) {
    // Surface the real failure code/message instead of a generic “network failed”
    throw new Error(`Upload failed (${res.status}): ${res.body?.slice(0, 160) || "no body"}`);
  }

  // 6) Save relative path in profile (not a signed URL)
  const { error: upErr } = await supabase
    .from("profiles")
    .update({ avatar_url: objectPath })
    .eq("id", userId);
  if (upErr) throw upErr;

  // 7) Return a fresh signed URL so the UI updates immediately
  const { data: signed, error: signErr } = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
  if (signErr) throw signErr;

  return signed?.signedUrl ?? null;
};


  // ---------- password update (verify current, then set new) ----------
  const updatePasswordIfNeeded = async (userEmail: string) => {
    const wantsChange =
      currentPassword.trim().length > 0 ||
      newPassword.trim().length > 0 ||
      confirmPassword.trim().length > 0;

    if (!wantsChange) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("Please fill out all password fields.");
    }
    if (newPassword !== confirmPassword) {
      throw new Error("New passwords don't match.");
    }
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    // Re-auth with current password (ensures correctness)
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (signErr) {
      throw new Error("Current password is incorrect.");
    }

    const { error: updErr } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updErr) {
      throw updErr;
    }
  };

  // ---------- Save handler (uploads avatar + updates password) ----------
  const handleSave = async () => {
    try {
      setSaving(true);

      // grab the current user
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        Alert.alert("Not signed in", "Please log in again.");
        return;
      }

      // 1) Upload avatar if a new one is selected
      let newSignedUrl: string | null = null;
      if (localImageUri) {
        newSignedUrl = await uploadAvatarIfNeeded(user.id);
        setAvatarSignedUrl(newSignedUrl); // reflect immediately
        setLocalImageUri(null); // clear pending image
      }

      // 2) Update password if provided
      if (newPassword || currentPassword || confirmPassword) {
        await updatePasswordIfNeeded(user.email || "");
      }

      Alert.alert("Settings Saved", "Your changes have been saved successfully!");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Unable to save your changes.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  // choose which image to show: local preview (unsaved) -> stored signed url -> initials
  const displayImage = localImageUri || avatarSignedUrl;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <BackgroundDecor />

          <View
            className="flex-1 p-4"
            style={{ width: "100%", maxWidth: 450, alignSelf: "center" }}
          >
            {/* Header */}
            <View className="flex-row items-center mb-8 mt-4">
              <TouchableOpacity
                onPress={handleGoBack}
                className="mr-4 p-2 bg-white/10 rounded-full"
                disabled={saving}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-bold">Profile Settings</Text>
            </View>

            {/* Profile Section */}
            <View className="items-center bottom-4 mb-10">
              <TouchableOpacity onPress={pickImage} className="relative" disabled={saving}>
                <View className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-500/80 items-center justify-center bg-white/10">
                  {displayImage ? (
                    <Image
                      source={{ uri: displayImage }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text className="text-white text-2xl font-bold">{initials}</Text>
                  )}
                </View>
                <View className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full">
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text className="text-purple-300 mt-3 text-sm font-medium">
                Tap to change photo
              </Text>
              <Text className="text-white text-xl font-bold mt-4">
                {fullName || "User"}
              </Text>
              <Text className="text-gray-300 text-sm mt-1">{email || "—"}</Text>
            </View>

            {/* Change Password */}
            <View className="mb-8 bottom-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="lock-closed" size={20} color="#a78bfa" />
                <Text className="text-white text-lg font-semibold ml-2">
                  Change Password
                </Text>
              </View>

              <View className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Current Password</Text>
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    editable={!saving}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">New Password</Text>
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!saving}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>

                <View>
                  <Text className="text-gray-400 text-sm mb-2">Confirm New Password</Text>
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!saving}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className={`rounded-2xl py-3 items-center bottom-8 shadow-lg shadow-purple-500/30 mb-10 ${
                saving ? "bg-gray-600" : "bg-purple-600"
              }`}
            >
              <Text className="text-white text-lg font-bold">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
