import { supabase } from "@/SupaBase/supabase_file";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

type TrackingStatus = "request_received" | "package_collected" | "delivering" | "completed";

interface StatusStep {
  id: TrackingStatus;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const statusSteps: StatusStep[] = [
  {
    id: "request_received",
    title: "Request Received",
    description: "Your delivery request has been received and confirmed",
    icon: "📋",
    color: "#fdcb6e",
  },
  {
    id: "package_collected",
    title: "Package Collected",
    description: "Driver has picked up your package",
    icon: "📦",
    color: "#0984e3",
  },
  {
    id: "delivering",
    title: "Out for Delivery",
    description: "Your package is on the way to you",
    icon: "🚚",
    color: "#6c5ce7",
  },
  {
    id: "completed",
    title: "Delivered",
    description: "Your package has been successfully delivered",
    icon: "✅",
    color: "#00b894",
  },
];

export default function TrackingStatus() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<TrackingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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
    setupRealtimeSubscription();
  }, [id]);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`delivery_status_${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_requests",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.new.tracking_status) {
            setCurrentStatus(payload.new.tracking_status);
            setDelivery(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const fetchDelivery = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_requests")
        .select("*, customer:users!customer_id(id, name, email, phone)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setDelivery(data);
      setCurrentStatus(data.tracking_status || "request_received");
    } catch (error) {
      console.error("Error fetching delivery:", error);
      Alert.alert("Error", "Failed to load delivery details");
    } finally {
      setLoading(false);
    }
  };

  const updateTrackingStatus = async (newStatus: TrackingStatus) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("delivery_requests")
        .update({ 
          tracking_status: newStatus,
          status: newStatus === "completed" ? "completed" : "accepted"
        })
        .eq("id", id);

      if (error) throw error;

      setCurrentStatus(newStatus);
      
      // Show success message based on status
      let message = "";
      switch (newStatus) {
        case "request_received":
          message = "Customer has been notified that their request is received";
          break;
        case "package_collected":
          message = "Customer notified: Package has been collected";
          break;
        case "delivering":
          message = "Customer notified: Package is out for delivery";
          break;
        case "completed":
          message = "Delivery completed! Customer has been notified";
          break;
      }
      
      Alert.alert("Status Updated", message);
      
      // If completed, navigate back after 2 seconds
      if (newStatus === "completed") {
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update delivery status");
    } finally {
      setUpdating(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!currentStatus) return 0;
    return statusSteps.findIndex(step => step.id === currentStatus);
  };

  const isStepCompleted = (stepId: TrackingStatus) => {
    if (!currentStatus) return false;
    const currentIndex = getCurrentStepIndex();
    const stepIndex = statusSteps.findIndex(step => step.id === stepId);
    return stepIndex <= currentIndex;
  };

  const isStepCurrent = (stepId: TrackingStatus) => {
    return currentStatus === stepId;
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
        <Text style={styles.loadingText}>Loading tracking details...</Text>
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
              <Text style={styles.headerTitle}>Update Delivery Status</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Customer Info Card */}
            {delivery?.customer && (
              <View style={styles.customerCard}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.customerGradient}
                >
                  <Text style={styles.customerIcon}>👤</Text>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{delivery.customer.name}</Text>
                    {delivery.customer.phone && (
                      <Text style={styles.customerPhone}>📞 {delivery.customer.phone}</Text>
                    )}
                    {delivery.customer.email && (
                      <Text style={styles.customerEmail}>✉️ {delivery.customer.email}</Text>
                    )}
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Pickup Address */}
            <View style={styles.addressCard}>
              <Text style={styles.addressIcon}>📍</Text>
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Pickup Address</Text>
                <Text style={styles.addressText}>
                  {delivery?.pickup_address || "Address not provided"}
                </Text>
              </View>
            </View>

            {/* Status Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Delivery Progress</Text>
              
              {statusSteps.map((step, index) => (
                <View key={step.id} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        isStepCompleted(step.id) && styles.timelineDotCompleted,
                        isStepCurrent(step.id) && styles.timelineDotCurrent,
                      ]}
                    >
                      <Text style={styles.timelineDotIcon}>{step.icon}</Text>
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isStepCompleted(step.id) && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineStepTitle,
                        isStepCompleted(step.id) && styles.timelineStepTitleCompleted,
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={styles.timelineStepDescription}>{step.description}</Text>
                    {isStepCurrent(step.id) && !isStepCompleted(step.id) && (
                      <TouchableOpacity
                        style={[styles.updateButton, { backgroundColor: step.color }]}
                        onPress={() => updateTrackingStatus(step.id)}
                        disabled={updating}
                      >
                        {updating ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.updateButtonText}>
                            Mark as {step.title}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {isStepCompleted(step.id) && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedIcon}>✓</Text>
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Current Status Card */}
            <View style={styles.currentStatusCard}>
              <LinearGradient
                colors={["#ffeaa7", "#fdcb6e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.currentStatusGradient}
              >
                <Text style={styles.currentStatusIcon}>
                  {statusSteps.find(s => s.id === currentStatus)?.icon || "🚚"}
                </Text>
                <View style={styles.currentStatusContent}>
                  <Text style={styles.currentStatusLabel}>Current Status</Text>
                  <Text style={styles.currentStatusText}>
                    {statusSteps.find(s => s.id === currentStatus)?.title || "Processing"}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Delivery Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Delivery Details</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Delivery ID:</Text>
                <Text style={styles.detailsValue}>{id?.toString().slice(0, 8)}...</Text>
              </View>
              {delivery?.package_type && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Package:</Text>
                  <Text style={styles.detailsValue}>{delivery.package_type}</Text>
                </View>
              )}
              {delivery?.weight && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Weight:</Text>
                  <Text style={styles.detailsValue}>{delivery.weight}</Text>
                </View>
              )}
              {delivery?.delivery_option && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Option:</Text>
                  <Text style={styles.detailsValue}>
                    {delivery.delivery_option.charAt(0).toUpperCase() + delivery.delivery_option.slice(1)}
                  </Text>
                </View>
              )}
              {delivery?.delivery_fee && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Fee:</Text>
                  <Text style={styles.detailsValue}>R{delivery.delivery_fee}</Text>
                </View>
              )}
            </View>

            {/* Note to Driver */}
            <View style={styles.noteCard}>
              <Text style={styles.noteIcon}>💡</Text>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>Pro Tip</Text>
                <Text style={styles.noteText}>
                  Keep the customer updated at each stage. This builds trust and provides transparency.
                </Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  customerCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  customerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  customerIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 12,
    color: "#0984e3",
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 11,
    color: "#636e72",
  },
  addressCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#2d3436",
    lineHeight: 18,
  },
  timelineCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: "row",
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 15,
  },
  timelineDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  timelineDotCompleted: {
    backgroundColor: "#00b894",
  },
  timelineDotCurrent: {
    backgroundColor: "#f5576c",
    transform: [{ scale: 1.1 }],
  },
  timelineDotIcon: {
    fontSize: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: "#00b894",
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineStepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  timelineStepTitleCompleted: {
    color: "#00b894",
  },
  timelineStepDescription: {
    fontSize: 11,
    color: "#636e72",
    marginBottom: 10,
  },
  updateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4edda",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  completedIcon: {
    fontSize: 12,
    color: "#28a745",
    marginRight: 5,
    fontWeight: "bold",
  },
  completedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#155724",
  },
  currentStatusCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 15,
  },
  currentStatusGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  currentStatusIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  currentStatusContent: {
    flex: 1,
  },
  currentStatusLabel: {
    fontSize: 11,
    color: "#d63031",
    marginBottom: 4,
  },
  currentStatusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d63031",
  },
  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: "#636e72",
  },
  detailsValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2d3436",
  },
  noteCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    marginBottom: 15,
  },
  noteIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 11,
    color: "#636e72",
    lineHeight: 16,
  },
});