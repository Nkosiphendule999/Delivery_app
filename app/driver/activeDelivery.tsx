import { supabase } from "@/SupaBase/supabase_file";
import Chat from "@/app/driver/chat";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  Button,
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function ActiveDelivery() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    fetchDelivery();
    startTimer();

    // Real-time subscription for delivery updates
    const subscription = supabase
      .channel(`delivery_${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_requests",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setDelivery(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const fetchDelivery = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_requests")
        .select("*, customer:users!customer_id(name, phone, email)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setDelivery(data);
    } catch (error) {
      console.error("Error fetching delivery:", error);
      Alert.alert("Error", "Failed to load delivery details");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("delivery_requests")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      Alert.alert(
        "Success",
        `Delivery status updated to ${newStatus}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update delivery status");
    } finally {
      setUpdating(false);
    }
  };

  const completeDelivery = async () => {
    Alert.alert(
      "Complete Delivery",
      "Have you successfully delivered the package?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Complete",
          onPress: async () => {
            setUpdating(true);
            try {
              const { error } = await supabase
                .from("delivery_requests")
                .update({ 
                  status: "delivered",
                  delivered_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq("id", id);

              if (error) throw error;

              Alert.alert(
                "🎉 Delivery Complete!",
                "Thank you for completing this delivery.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/driver/dashboard")
                  }
                ]
              );
            } catch (error) {
              console.error("Error completing delivery:", error);
              Alert.alert("Error", "Failed to complete delivery");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "⏳";
      case "assigned": return "🚗";
      case "picked_up": return "📦";
      case "delivered": return "✅";
      default: return "🚚";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#fdcb6e";
      case "assigned": return "#0984e3";
      case "picked_up": return "#6c5ce7";
      case "delivered": return "#00b894";
      default: return "#dfe6e9";
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </LinearGradient>
    );
  }

  if (!delivery) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.errorContainer}
      >
        <Text style={styles.errorEmoji}>😢</Text>
        <Text style={styles.errorText}>Delivery not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Active Delivery</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Timer Card */}
            <View style={styles.timerCard}>
              <LinearGradient
                colors={["#ffeaa7", "#fdcb6e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.timerGradient}
              >
                <Text style={styles.timerIcon}>⏱️</Text>
                <View style={styles.timerContent}>
                  <Text style={styles.timerLabel}>Active Time</Text>
                  <Text style={styles.timerValue}>{formatTime(timeElapsed)}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
              <LinearGradient
                colors={[getStatusColor(delivery.status), getStatusColor(delivery.status) + "cc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusGradient}
              >
                <Text style={styles.statusIcon}>{getStatusIcon(delivery.status)}</Text>
                <Text style={styles.statusText}>
                  {delivery.status?.toUpperCase() || "PENDING"}
                </Text>
              </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {delivery.status !== "picked_up" && (
                  <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => updateStatus("picked_up")}
                    disabled={updating}
                  >
                    <Text style={styles.actionIcon}>📦</Text>
                    <Text style={styles.actionLabel}>Mark Picked Up</Text>
                  </TouchableOpacity>
                )}
                {delivery.status !== "delivered" && (
                  <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardPrimary]}
                    onPress={completeDelivery}
                    disabled={updating}
                  >
                    <Text style={styles.actionIcon}>✅</Text>
                    <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>
                      Complete Delivery
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Customer Information */}
            {delivery.customer && (
              <View style={styles.customerCard}>
                <Text style={styles.sectionTitle}>👤 Customer Details</Text>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{delivery.customer.name}</Text>
                  {delivery.customer.phone && (
                    <Text style={styles.customerPhone}>📞 {delivery.customer.phone}</Text>
                  )}
                  {delivery.customer.email && (
                    <Text style={styles.customerEmail}>✉️ {delivery.customer.email}</Text>
                  )}
                  <TouchableOpacity style={styles.contactButton}>
                    <Text style={styles.contactButtonText}>Contact Customer →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Pickup Location */}
            {delivery.pickup_lat && delivery.pickup_lng && (
              <View style={styles.locationCard}>
                <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
                <Text style={styles.locationCoords}>
                  Lat: {delivery.pickup_lat.toFixed(6)}
                </Text>
                <Text style={styles.locationCoords}>
                  Lng: {delivery.pickup_lng.toFixed(6)}
                </Text>
                <TouchableOpacity style={styles.navigateButton}>
                  <Text style={styles.navigateButtonText}>Navigate →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Delivery Notes */}
            <View style={styles.notesCard}>
              <Text style={styles.sectionTitle}>📝 Delivery Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add delivery notes or special instructions..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.saveNotesButton}>
                <Text style={styles.saveNotesText}>Save Notes</Text>
              </TouchableOpacity>
            </View>

            {/* Chat Section */}
            <View style={styles.chatSection}>
              <Text style={styles.chatTitle}>💬 Customer Communication</Text>
              <Text style={styles.chatSubtitle}>
                Chat with the customer for real-time updates
              </Text>
              <Chat deliveryId={id} />
            </View>

            {/* Safety Tips */}
            <LinearGradient
              colors={["#55efc4", "#00b894"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.safetyCard}
            >
              <Text style={styles.safetyIcon}>🛡️</Text>
              <View style={styles.safetyContent}>
                <Text style={styles.safetyTitle}>Safety First</Text>
                <Text style={styles.safetyText}>
                  Always verify the recipient's ID and take a photo of the delivered package
                </Text>
              </View>
            </LinearGradient>

            {/* Support Section */}
            <View style={styles.supportCard}>
              <Text style={styles.supportIcon}>❓</Text>
              <View style={styles.supportContent}>
                <Text style={styles.supportTitle}>Need Help?</Text>
                <Text style={styles.supportText}>
                  Contact driver support 24/7 for immediate assistance
                </Text>
                <TouchableOpacity style={styles.supportButton}>
                  <Text style={styles.supportButtonText}>Call Support →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 30,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  timerCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  timerIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: "#d63031",
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#d63031",
  },
  statusCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statusGradient: {
    padding: 25,
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionCardPrimary: {
    backgroundColor: "#f5576c",
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  actionLabelPrimary: {
    color: "#fff",
  },
  customerCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 12,
  },
  customerInfo: {
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
  },
  customerPhone: {
    fontSize: 14,
    color: "#0984e3",
  },
  customerEmail: {
    fontSize: 14,
    color: "#636e72",
  },
  contactButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  contactButtonText: {
    fontSize: 14,
    color: "#f5576c",
    fontWeight: "600",
  },
  locationCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  locationCoords: {
    fontSize: 13,
    color: "#636e72",
    marginBottom: 6,
  },
  navigateButton: {
    marginTop: 12,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  navigateButtonText: {
    fontSize: 13,
    color: "#f5576c",
    fontWeight: "600",
  },
  notesCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: 12,
  },
  saveNotesButton: {
    alignSelf: "flex-end",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveNotesText: {
    fontSize: 12,
    color: "#f5576c",
    fontWeight: "600",
  },
  chatSection: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 11,
    color: "#636e72",
    marginBottom: 15,
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  safetyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
  },
  supportCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  supportIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 4,
  },
  supportText: {
    fontSize: 11,
    color: "#636e72",
    marginBottom: 8,
  },
  supportButton: {
    alignSelf: "flex-start",
  },
  supportButtonText: {
    fontSize: 12,
    color: "#f5576c",
    fontWeight: "600",
  },
});