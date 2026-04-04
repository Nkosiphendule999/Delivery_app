import { supabase } from "@/SupaBase/supabase_file";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function Requests() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const router = useRouter();
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

    const setupSubscription = async () => {
      await load();

      const subscription = supabase
        .channel("delivery_requests_pending")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "delivery_requests",
            filter: "status=eq.pending"
          },
          () => load()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    setupSubscription();
  }, []);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_requests")
        .select("*, customer:users!customer_id(name, email, phone)")
        .eq("status", "pending")
        .is("driver_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setList(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const accept = async (id: string) => {
    setAcceptingId(id);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        Alert.alert("Error", "Please login again");
        router.replace("/auth/login");
        return;
      }

      console.log("Driver ID being saved:", user.id);

      // Update status to "accepted", set driver_id, and set initial tracking status
      const { data, error } = await supabase
        .from("delivery_requests")
        .update({ 
  status: "accepted", 
  driver_id: user?.id,  // ← Driver ID is stored here
  tracking_status: "request_received"

        })
        .eq("id", id)
        .eq("status", "pending")
        .is("driver_id", null)
        .select();

      if (error) throw error;

      console.log("Updated delivery:", data);

      Alert.alert(
        "Success! 🎉",
        "You have accepted this delivery request. Please keep the customer updated on the delivery progress.",
        [
          {
            text: "Update Tracking Status",
            onPress: () => router.push({ pathname: "/driver/tracking_status", params: { id } })
          }
        ]
      );
      
      // Refresh the list immediately
      await load();
    } catch (error: any) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", error.message || "Failed to accept delivery request. It may have been taken by another driver.");
    } finally {
      setAcceptingId(null);
    }
  };

  const calculateDistance = (lat1: number, lng1: number) => {
    const distances = ["0.5 km", "1.2 km", "2.3 km", "0.8 km", "1.5 km", "3.1 km", "4.2 km"];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getEarningsEstimate = () => {
    const baseRate = 50;
    const distanceMultiplier = Math.floor(Math.random() * 50) + 20;
    return `R${baseRate + distanceMultiplier}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f5576c" />
        <Text style={styles.loadingText}>Loading available requests...</Text>
      </View>
    );
  }

  if (list.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={["#f8f9fa", "#e9ecef"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyCard}
        >
          <Text style={styles.emptyEmoji}>🚚</Text>
          <Text style={styles.emptyTitle}>No Available Requests</Text>
          <Text style={styles.emptyText}>
            Check back later for new delivery opportunities
          </Text>
          <TouchableOpacity style={styles.refreshEmptyButton} onPress={load}>
            <Text style={styles.refreshEmptyText}>↻ Refresh</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {list.map((request) => (
          <LinearGradient
            key={request.id}
            colors={["#ffffff", "#f8f9fa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.requestCard}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.requestType}>
                <Text style={styles.typeIcon}>📦</Text>
                <Text style={styles.typeText}>Pickup Request</Text>
              </View>
              <View style={styles.timeBadge}>
                <Text style={styles.timeIcon}>⏱️</Text>
                <Text style={styles.timeText}>{formatTime(request.created_at)}</Text>
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.customerSection}>
              <Text style={styles.customerIcon}>👤</Text>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {request.customer?.name || "Customer"}
                </Text>
                {request.customer?.email && (
                  <Text style={styles.customerEmail}>{request.customer.email}</Text>
                )}
                {request.customer?.phone && (
                  <Text style={styles.customerPhone}>📞 {request.customer.phone}</Text>
                )}
              </View>
            </View>

            {/* Pickup Address */}
            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <Text style={styles.addressIcon}>📍</Text>
                <View style={styles.addressDetails}>
                  <Text style={styles.addressLabel}>Pickup Address</Text>
                  <Text style={styles.addressText}>
                    {request.pickup_address || "Address not provided"}
                  </Text>
                </View>
              </View>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceIcon}>🚗</Text>
                <Text style={styles.distanceText}>
                  {calculateDistance(request.pickup_lat, request.pickup_lng)} away
                </Text>
              </View>
            </View>

            {/* Package Details */}
            <View style={styles.packageSection}>
              <View style={styles.packageRow}>
                <Text style={styles.packageIcon}>📦</Text>
                <Text style={styles.packageText}>
                  {request.package_type || "Standard Package"} • {request.weight || "Standard Weight"}
                </Text>
              </View>
              {request.delivery_option && (
                <View style={styles.deliveryOptionBadge}>
                  <Text style={styles.deliveryOptionText}>
                    {request.delivery_option.charAt(0).toUpperCase() + request.delivery_option.slice(1)} Delivery
                  </Text>
                </View>
              )}
            </View>

            {/* Delivery Note */}
            <View style={styles.noteSection}>
              <Text style={styles.noteIcon}>ℹ️</Text>
              <Text style={styles.noteText}>
                Contact customer for any special instructions
              </Text>
            </View>

            {/* Earnings Estimate */}
            <View style={styles.earningsSection}>
              <LinearGradient
                colors={["#ffeaa7", "#fdcb6e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.earningsBadge}
              >
                <Text style={styles.earningsIcon}>💰</Text>
                <Text style={styles.earningsAmount}>{request.delivery_fee ? `R${request.delivery_fee}` : getEarningsEstimate()}</Text>
                <Text style={styles.earningsLabel}>Est. Earnings</Text>
              </LinearGradient>
            </View>

            {/* Accept Button */}
            <TouchableOpacity
              style={[styles.acceptButton, acceptingId === request.id && styles.acceptButtonDisabled]}
              onPress={() => accept(request.id)}
              disabled={acceptingId === request.id}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f093fb", "#f5576c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {acceptingId === request.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>✓</Text>
                    <Text style={styles.buttonText}>Accept Delivery</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#636e72",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 15,
  },
  refreshEmptyButton: {
    backgroundColor: "#f5576c",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshEmptyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  requestCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  requestType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d3436",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  timeText: {
    fontSize: 10,
    color: "#636e72",
  },
  customerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  customerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 11,
    color: "#636e72",
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 11,
    color: "#0984e3",
  },
  addressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    flex: 1,
  },
  addressIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: "#2d3436",
    lineHeight: 16,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  distanceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f5576c",
  },
  packageSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  packageIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  packageText: {
    fontSize: 12,
    color: "#2d3436",
  },
  deliveryOptionBadge: {
    backgroundColor: "#e8f4f8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryOptionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0984e3",
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  noteText: {
    fontSize: 11,
    color: "#e17055",
    flex: 1,
  },
  earningsSection: {
    marginBottom: 15,
  },
  earningsBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  earningsIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  earningsAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d63031",
    marginRight: 4,
  },
  earningsLabel: {
    fontSize: 11,
    color: "#e17055",
  },
  acceptButton: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: "#f5576c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  buttonIcon: {
    fontSize: 18,
    color: "#fff",
    marginRight: 8,
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});