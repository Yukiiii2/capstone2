import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabaseClient';

// Simple navigation type for basic usage
type NavigationProp = {
  goBack: () => void;
};

// Enhanced Background Decorator with more glassmorphism and depth
const BackgroundDecor = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 }}>
    <LinearGradient
      colors={["#181C2A", "#232946", "#181C2A"]}
      style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    {/* Glassy floating shapes (visual only) */}
    <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, backgroundColor: '#a78bfa22', borderRadius: 80 }} />
    <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, backgroundColor: '#a78bfa22', borderRadius: 45 }} />
    <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, backgroundColor: '#a78bfa22', borderRadius: 18 }} />
    <View style={{ position: 'absolute', bottom: 20, right: 40, width: 48, height: 48, backgroundColor: '#a78bfa22', borderRadius: 24 }} />
    <View style={{ position: 'absolute', top: 200, left: 90, width: 20, height: 20, backgroundColor: '#a78bfa22', borderRadius: 10 }} />
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#23294655', borderRadius: 0 }} />
  </View>
);

type NotificationType = 'heart' | 'like' | 'wow' | 'comment';

interface Notification {
  id: string;
  user: string;
  action: string;
  time: string;
  type: NotificationType;
  profilePic: string;
  reactionIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  isRead: boolean;
  role?: string;
  lesson?: string;
  postId?: string; // <-- added
}

// Enhanced User Avatar with real image support
const UserAvatar = ({ imageUrl, name, role }: { imageUrl: string; name: string; role?: string }) => (
  <View style={{ position: 'relative' }}>
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundColor: '#232946',
      shadowColor: '#a78bfa',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    }}>
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
      />
    </View>
    {role && (
      <View style={{
        position: 'absolute',
        bottom: -8,
        right: -8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
      }}>
        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{role}</Text>
      </View>
    )}
  </View>
);

// ---------- helpers (logic-only, no UI change)

async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: listed } = await supabase
      .storage
      .from("avatars")
      .list(normalized, {
        sortBy: { column: "created_at", order: "desc" },
        limit: 1,
      });
    if (listed && listed.length > 0) objectPath = `${normalized}/${listed[0].name}`;
  }
  if (!objectPath) return null;

  const signedRes = await supabase
    .storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
  return signedRes.data?.signedUrl ?? null;
}

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const TYPE_META: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string; actionTpl: (name: string) => string }> = {
  like:    { icon: 'thumbs-up',           color: '#3B82F6', actionTpl: (n) => `liked 👍 your post` },
  comment: { icon: 'chatbubble-ellipses', color: '#10B981', actionTpl: (n) => `commented 💬 on your post` },
  heart:   { icon: 'heart',               color: '#EC4899', actionTpl: (n) => `reacted with ❤️ to your post` },
  wow:     { icon: 'happy-outline',       color: '#F59E0B', actionTpl: (n) => `reacted with 😮 to your post` },
};

// Raw shapes from Supabase (actor can be object OR array depending on FK metadata)
type RawActor = { id?: string; name?: string; avatar_url?: string } | RawActor[] | null | undefined;
type RawNotifRow = {
  id: string;
  type: string;
  is_read: boolean;
  created_at: string;
  post_id: string;
  actor?: RawActor;     // joined alias
  actor_id?: string;    // present on payload.new
};
function pickActor(a: RawActor): { id?: string; name?: string; avatar_url?: string } {
  if (Array.isArray(a)) return (a[0] as any) ?? {};
  return (a as any) ?? {};
}

const NotificationScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let mounted = true;
    let channel: any = null; // keep ref to cleanup

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Join to profiles via FK name; alias as "actor"
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          is_read,
          created_at,
          post_id,
          actor:profiles!notifications_actor_id_fkey ( id, name, avatar_url )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.log('load notifications error:', error.message);
        return;
      }

      const mapped: Notification[] = [];
      for (const r of ((data ?? []) as RawNotifRow[])) {
        const actorObj = pickActor((r as any).actor);
        const actorId = actorObj.id ?? r.actor_id;
        const actorName = actorObj.name ?? 'Someone';
        const meta = TYPE_META[(r.type as NotificationType) ?? 'like'] ?? TYPE_META.like;

        let avatarUri = actorObj.avatar_url ?? '';
        if (actorId && avatarUri && !/^https?:\/\//i.test(avatarUri)) {
          const signed = await resolveSignedAvatar(actorId, avatarUri);
          avatarUri = signed ?? avatarUri;
        }

        mapped.push({
          id: String(r.id),
          user: actorName,
          action: meta.actionTpl(actorName),
          time: timeAgo(r.created_at),
          type: (r.type as NotificationType),
          profilePic: avatarUri || 'https://i.pravatar.cc/100?img=1',
          reactionIcon: meta.icon,
          color: meta.color,
          isRead: !!r.is_read,
          role: undefined,
          lesson: undefined,
          postId: r.post_id, // <-- keep post id
        });
      }

      if (mounted) setNotifications(mapped);
    }

    load();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('notifications-for-me')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
          async (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const row = payload.new as RawNotifRow;
              const { data: actor } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', (row as any).actor_id)
                .single();

              const meta = TYPE_META[((row as any).type as NotificationType) ?? 'like'] ?? TYPE_META.like;

              let avatarUri = actor?.avatar_url ?? '';
              if (actor?.id && avatarUri && !/^https?:\/\//i.test(avatarUri)) {
                const signed = await resolveSignedAvatar(actor.id, avatarUri);
                avatarUri = signed ?? avatarUri;
              }

              setNotifications(prev => [
                {
                  id: String((row as any).id),
                  user: actor?.name ?? 'Someone',
                  action: meta.actionTpl(actor?.name ?? 'Someone'),
                  time: timeAgo((row as any).created_at),
                  type: ((row as any).type as NotificationType),
                  profilePic: avatarUri || 'https://i.pravatar.cc/100?img=1',
                  reactionIcon: meta.icon,
                  color: meta.color,
                  isRead: !!(row as any).is_read,
                  role: undefined,
                  lesson: undefined,
                  postId: (row as any).post_id, // <-- keep post id on realtime
                },
                ...prev,
              ]);
            }

            if (payload.eventType === 'UPDATE') {
              const row = payload.new as RawNotifRow;
              setNotifications(prev =>
                prev.map(n => (n.id === String(row.id) ? { ...n, isRead: !!row.is_read } : n))
              );
            }

            if (payload.eventType === 'DELETE') {
              const row = payload.old as RawNotifRow;
              setNotifications(prev => prev.filter(n => n.id !== String(row.id)));
            }
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel); // proper cleanup
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (e) {
      console.log('markAsRead error:', e);
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const { id, user, action, time, profilePic, reactionIcon, color, isRead, role, lesson } = notification;

    return (
      <TouchableOpacity
        key={id}
        style={styles.notificationItem}
        onPress={() => markAsRead(id)} // mark read on tap (no UI change)
      >
        <UserAvatar imageUrl={profilePic} name={user} role={role} />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.userName}>{user} </Text>
            {action}
          </Text>
          {lesson && (
            <View style={styles.lessonLabel}>
              <Text style={styles.lessonText}>{lesson}</Text>
            </View>
          )}
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181C2A' }}>
        <BackgroundDecor />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Ionicons name="notifications-off-outline" size={60} color="#64748B" style={{ opacity: 0.7 }} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 16 }}>No notifications yet</Text>
          <Text style={{ color: '#b0b6c3', textAlign: 'center', marginTop: 8, fontSize: 16 }}>
            When you get notifications, they'll appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181C2A' }}>
      <BackgroundDecor />
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, paddingHorizontal: 8, maxWidth: 600, alignSelf: 'center', width: '100%' }}
        >
          {/* Header - Now part of the scrollable content */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 20, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ backgroundColor: 'transparent', borderRadius: 16, padding: 8, marginRight: 12 }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 4 }}>Notifications</Text>
            </View>
          </View>
          {notifications.map((notification) => renderNotificationItem(notification))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(35, 41, 70, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 16,
  },
  lessonLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  lessonText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  userName: {
    fontWeight: '600' as const,
    color: '#fff',
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});

export default NotificationScreen;
