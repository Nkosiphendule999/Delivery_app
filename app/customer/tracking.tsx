import { supabase } from "@/SupaBase/supabase_file";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");

type TrackingStatus = "request_received" | "package_collected" | "delivering" | "completed";

interface StatusStep {
  id: TrackingStatus;
  title: string;
  description: string;
  icon: string;
}

const statusSteps: StatusStep[] = [
  {
    id: "request_received",
    title: "Request Received",
    description: "Your delivery request has been confirmed",
    icon: "📋",
  },
  {
    id: "package_collected",
    title: "Package Collected",
    description: "Driver has picked up your package",
    icon: "📦",
  },
  {
    id: "delivering",
    title: "Out for Delivery",
    description: "Your package is on the way",
    icon: "🚚",
  },
  {
    id: "completed",
    title: "Delivered",
    description: "Package successfully delivered",
    icon: "✅",
  },
];

export default function Tracking() {
  const { id } = useLocalSearchParams();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<TrackingStatus>("request_received");
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
      .channel(`tracking_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_requests",
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setDelivery(payload.new);
            if (payload.new.tracking_status) {
              setCurrentStatus(payload.new.tracking_status);
            }
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
        .select(`
          *,
          driver:users!driver_id(id, name, email, phone)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setDelivery(data);
      if (data.tracking_status) {
        setCurrentStatus(data.tracking_status);
      }
    } catch (error) {
      console.error("Error fetching delivery:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.id === currentStatus);
  };

  const isStepCompleted = (stepId: TrackingStatus) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = statusSteps.findIndex(step => step.id === stepId);
    return stepIndex <= currentIndex;
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case "request_received": return "#fdcb6e";
      case "package_collected": return "#0984e3";
      case "delivering": return "#6c5ce7";
      case "completed": return "#00b894";
      default: return "#dfe6e9";
    }
  };

  const getStatusMessage = () => {
    switch (currentStatus) {
      case "request_received": return "Looking for a driver...";
      case "package_collected": return "Driver has your package";
      case "delivering": return "Package is on the way";
      case "completed": return "Delivery completed!";
      default: return "Processing...";
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
        <Text style={styles.loadingText}>Loading tracking details...</Text>
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
        <TouchableOpacity style={styles.retryButton}>
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
                onPress={() => {}}
              >
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Track Delivery</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
              <LinearGradient
                colors={[getStatusColor(), getStatusColor() + "cc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusGradient}
              >
                <Text style={styles.statusIcon}>
                  {statusSteps.find(s => s.id === currentStatus)?.icon || "🚚"}
                </Text>
                <Text style={styles.statusText}>{getStatusMessage()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusBadgeText}>
                    {currentStatus?.replace("_", " ").toUpperCase() || "PENDING"}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Driver Information (only shown after acceptance) */}
            {delivery.driver && delivery.status === "accepted" && (
              <View style={styles.driverCard}>
                <LinearGradient
                  colors={["#ffeaa7", "#fdcb6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.driverGradient}
                >
                  <Text style={styles.driverIcon}>👨‍✈️</Text>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{delivery.driver.name}</Text>
                    <Text style={styles.driverLabel}>Your Delivery Partner</Text>
                    {delivery.driver.phone && (
                      <Text style={styles.driverPhone}>📞 {delivery.driver.phone}</Text>
                    )}
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Waiting for Driver Message */}
            {!delivery.driver && delivery.status === "pending" && (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingEmoji}>⏳</Text>
                <Text style={styles.waitingTitle}>Finding a Driver</Text>
                <Text style={styles.waitingText}>
                  We're looking for a nearby driver to accept your delivery request.
                  You'll be notified when a driver is assigned.
                </Text>
                <ActivityIndicator size="large" color="#f5576c" style={styles.waitingLoader} />
              </View>
            )}

            {/* Progress Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Delivery Progress</Text>
              
              {statusSteps.map((step, index) => (
                <View key={step.id} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        isStepCompleted(step.id) && styles.timelineDotCompleted,
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
                  </View>
                </View>
              ))}
            </View>

            {/* Pickup Address */}
            <View style={styles.addressCard}>
              <Text style={styles.addressIcon}>📍</Text>
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Pickup Address</Text>
                <Text style={styles.addressText}>
                  {delivery.pickup_address || "Address not provided"}
                </Text>
              </View>
            </View>

            {/* Delivery Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Delivery Details</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Delivery ID:</Text>
                <Text style={styles.detailsValue}>{id?.toString().slice(0, 8)}...</Text>
              </View>
              {delivery.package_type && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Package:</Text>
                  <Text style={styles.detailsValue}>{delivery.package_type}</Text>
                </View>
              )}
              {delivery.weight && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Weight:</Text>
                  <Text style={styles.detailsValue}>{delivery.weight}</Text>
                </View>
              )}
              {delivery.delivery_option && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Delivery Option:</Text>
                  <Text style={styles.detailsValue}>
                    {delivery.delivery_option.charAt(0).toUpperCase() + delivery.delivery_option.slice(1)}
                  </Text>
                </View>
              )}
                            {delivery.delivery_fee && (
                              <View style={styles.detailsRow}>
                                <Text style={styles.detailsLabel}>Delivery Fee:</Text>
                                <Text style={styles.detailsValue}>R {delivery.delivery_fee}</Text>
                              </View>
                            )}
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
                  backgroundColor: "#fff",
                },
                gradient: {
                  flex: 1,
                },
                scrollContent: {
                  paddingBottom: 20,
                },
                content: {
                  flex: 1,
                },
                header: {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 20,
                },
                backButton: {
                  padding: 8,
                },
                backArrow: {
                  fontSize: 24,
                  color: "#fff",
                },
                headerTitle: {
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#fff",
                },
                placeholder: {
                  width: 40,
                },
                loadingContainer: {
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                },
                loadingText: {
                  marginTop: 12,
                  fontSize: 16,
                  color: "#fff",
                },
                errorContainer: {
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 20,
                },
                errorEmoji: {
                  fontSize: 60,
                  marginBottom: 16,
                },
                errorText: {
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 24,
                },
                retryButton: {
                  backgroundColor: "#fff",
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 8,
                },
                retryText: {
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#667eea",
                },
                statusCard: {
                  marginHorizontal: 16,
                  marginBottom: 20,
                  borderRadius: 16,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                },
                statusGradient: {
                  paddingVertical: 24,
                  alignItems: "center",
                },
                statusIcon: {
                  fontSize: 48,
                  marginBottom: 12,
                },
                statusText: {
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#fff",
                  marginBottom: 16,
                },
                statusBadge: {
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                },
                statusBadgeText: {
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#fff",
                },
                driverCard: {
                  marginHorizontal: 16,
                  marginBottom: 20,
                  borderRadius: 16,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                },
                driverGradient: {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                },
                driverIcon: {
                  fontSize: 40,
                  marginRight: 16,
                },
                driverInfo: {
                  flex: 1,
                },
                driverName: {
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#2d3436",
                },
                driverLabel: {
                  fontSize: 12,
                  color: "#636e72",
                  marginTop: 2,
                },
                driverPhone: {
                  fontSize: 12,
                  color: "#d63031",
                  marginTop: 4,
                  fontWeight: "500",
                },
                waitingCard: {
                  marginHorizontal: 16,
                  marginBottom: 20,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  paddingVertical: 24,
                  paddingHorizontal: 16,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                },
                waitingEmoji: {
                  fontSize: 40,
                  marginBottom: 12,
                },
                waitingTitle: {
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2d3436",
                  marginBottom: 8,
                },
                waitingText: {
                  fontSize: 13,
                  color: "#636e72",
                  textAlign: "center",
                  marginBottom: 16,
                },
                waitingLoader: {
                  marginTop: 12,
                },
                timelineCard: {
                  marginHorizontal: 16,
                  marginBottom: 20,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 20,
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
                  marginBottom: 16,
                },
                timelineStep: {
                  flexDirection: "row",
                  marginBottom: 16,
                },
                timelineLeft: {
                  alignItems: "center",
                  marginRight: 16,
                },
                timelineDot: {
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#dfe6e9",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#dfe6e9",
                },
                timelineDotCompleted: {
                  backgroundColor: "#00b894",
                  borderColor: "#00b894",
                },
                timelineDotIcon: {
                  fontSize: 24,
                },
                timelineLine: {
                  width: 2,
                  height: 48,
                  backgroundColor: "#dfe6e9",
                  marginTop: 4,
                },
                timelineLineCompleted: {
                  backgroundColor: "#00b894",
                },
                timelineRight: {
                  flex: 1,
                  justifyContent: "center",
                },
                timelineStepTitle: {
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#636e72",
                },
                timelineStepTitleCompleted: {
                  color: "#2d3436",
                },
                timelineStepDescription: {
                  fontSize: 12,
                  color: "#b2bec3",
                  marginTop: 2,
                },
                addressCard: {
                  marginHorizontal: 16,
                  marginBottom: 20,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                },
                addressIcon: {
                  fontSize: 32,
                  marginRight: 12,
                },
                addressContent: {
                  flex: 1,
                },
                addressLabel: {
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#636e72",
                },
                addressText: {
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#2d3436",
                  marginTop: 4,
                },
                detailsCard: {
                  marginHorizontal: 16,
                  marginBottom: 20,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                },
                detailsTitle: {
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#2d3436",
                  marginBottom: 12,
                },
                detailsRow: {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                },
                detailsLabel: {
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#636e72",
                },
                detailsValue: {
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#2d3436",
                },
              });