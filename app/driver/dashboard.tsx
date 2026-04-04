import Requests from "./requests";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/SupaBase/supabase_file";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const [driverName, setDriverName] = useState("Driver");
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [activeDeliveriesList, setActiveDeliveriesList] = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [rating, setRating] = useState(4.8);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [showActiveDeliveries, setShowActiveDeliveries] = useState(false);
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

    fetchDriverData();
    fetchStats();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel("driver_stats_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_requests" },
        () => {
          fetchStats();
          fetchActiveDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const fetchDriverData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
        if (data) setDriverName(data.name.split(" ")[0]);
      }
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  const fetchActiveDeliveries = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("delivery_requests")
        .select(`
          *,
          customer:users!customer_id(id, name, email, phone)
        `)
        .eq("driver_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActiveDeliveriesList(data || []);
    } catch (error) {
      console.error("Error fetching active deliveries:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Get active deliveries count (status: accepted or in_progress)
      const { count: activeCount } = await supabase
        .from("delivery_requests")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", user.id)
        .in("status", ["accepted", "in_progress"]);

      setActiveDeliveries(activeCount || 0);

      // Get completed deliveries today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: completedCount } = await supabase
        .from("delivery_requests")
        .select("*", { count: "exact", head: true })
        .eq("driver_id", user.id)
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      setCompletedToday(completedCount || 0);

      // Get total deliveries from driver_stats table
      const { data: statsData, error: statsError } = await supabase
        .from("driver_stats")
        .select("total_deliveries")
        .eq("driver_id", user.id)
        .single();

      if (statsError && statsError.code !== "PGRST116") {
        console.error("Error fetching driver_stats:", statsError);
      }

      const totalDeliveriesCount = statsData?.total_deliveries || 0;
      setTotalDeliveries(totalDeliveriesCount);

      // Calculate earnings based on completed deliveries
      const baseEarnings = totalDeliveriesCount * 15;
      
      const { data: completedDeliveries } = await supabase
        .from("delivery_requests")
        .select("created_at, delivery_fee")
        .eq("driver_id", user.id)
        .eq("status", "completed");

      let bonusEarnings = 0;
      let deliveryFeeTotal = 0;
      
      if (completedDeliveries) {
        completedDeliveries.forEach((delivery) => {
          const deliveryDate = new Date(delivery.created_at);
          if (deliveryDate.getHours() < 12) {
            bonusEarnings += 5;
          }
          if (delivery.delivery_fee) {
            deliveryFeeTotal += parseFloat(delivery.delivery_fee);
          }
        });
      }

      const totalEarningsAmount = baseEarnings + bonusEarnings + deliveryFeeTotal;
      setTotalEarnings(totalEarningsAmount);

      if (totalDeliveriesCount > 0) {
        const calculatedRating = Math.min(4.9, 4.0 + (totalDeliveriesCount % 100) / 100);
        setRating(Number(calculatedRating.toFixed(1)));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  const toggleOnlineStatus = async () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? "Going Offline" : "Going Online",
      isOnline 
        ? "You will not receive new delivery requests" 
        : "You will now receive delivery requests",
      [{ text: "OK" }]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return "⏳";
      case "in_progress": return "🚚";
      default: return "📦";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted": return "Waiting for pickup";
      case "in_progress": return "Out for delivery";
      default: return status;
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
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.driverName}>{driverName}! 🚚</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutIcon}>🚪</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity 
                style={styles.statCardWrapper}
                onPress={() => setShowActiveDeliveries(!showActiveDeliveries)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={["#ffeaa7", "#fdcb6e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statCard}
                >
                  <Text style={styles.statIcon}>📦</Text>
                  <Text style={styles.statValue}>{activeDeliveries}</Text>
                  <Text style={styles.statLabel}>Active Deliveries</Text>
                  {activeDeliveries > 0 && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Tap to view</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <LinearGradient
                colors={["#a29bfe", "#6c5ce7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>{completedToday}</Text>
                <Text style={styles.statLabel}>Completed Today</Text>
              </LinearGradient>

              <LinearGradient
                colors={["#fd79a8", "#e84393"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statValue}>R{totalEarnings}</Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </LinearGradient>

              <LinearGradient
                colors={["#55efc4", "#00b894"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{rating}</Text>
                <Text style={styles.statLabel}>Driver Rating</Text>
              </LinearGradient>
            </View>

            {/* Active Deliveries List */}
            {showActiveDeliveries && activeDeliveriesList.length > 0 && (
              <View style={styles.activeDeliveriesContainer}>
                <Text style={styles.activeDeliveriesTitle}>Your Active Deliveries</Text>
                {activeDeliveriesList.map((delivery) => (
                  <TouchableOpacity
                    key={delivery.id}
                    style={styles.activeDeliveryCard}
                    onPress={() => router.push({ pathname: "/driver/tracking_status", params: { id: delivery.id } })}
                  >
                    <View style={styles.activeDeliveryHeader}>
                      <Text style={styles.activeDeliveryIcon}>
                        {getStatusIcon(delivery.status)}
                      </Text>
                      <Text style={styles.activeDeliveryStatus}>
                        {getStatusText(delivery.status)}
                      </Text>
                    </View>
                    <Text style={styles.activeDeliveryCustomer}>
                      {delivery.customer?.name || "Customer"}
                    </Text>
                    <Text style={styles.activeDeliveryAddress} numberOfLines={1}>
                      📍 {delivery.pickup_address || "Pickup address"}
                    </Text>
                    <View style={styles.activeDeliveryFooter}>
                      <Text style={styles.activeDeliveryPackage}>
                        📦 {delivery.package_type || "Package"}
                      </Text>
                      <Text style={styles.activeDeliveryLink}>Update Status →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Additional Stats Row */}
            <View style={styles.additionalStats}>
              <View style={styles.additionalStatCard}>
                <Text style={styles.additionalStatValue}>{totalDeliveries}</Text>
                <Text style={styles.additionalStatLabel}>Total Deliveries</Text>
              </View>
              <View style={styles.additionalStatCard}>
                <Text style={styles.additionalStatValue}>
                  R{Math.floor(totalEarnings / Math.max(totalDeliveries, 1)) || 0}
                </Text>
                <Text style={styles.additionalStatLabel}>Avg per Delivery</Text>
              </View>
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, isOnline && styles.onlineDot]} />
                <Text style={[styles.statusText, isOnline && styles.onlineText]}>
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
              <Text style={styles.statusMessage}>
                {isOnline 
                  ? "You are ready to accept new delivery requests"
                  : "You are currently offline and won't receive requests"}
              </Text>
              <TouchableOpacity style={styles.statusButton} onPress={toggleOnlineStatus}>
                <Text style={styles.statusButtonText}>
                  {isOnline ? "Go Offline" : "Go Online"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => router.push("/driver/history")}
                >
                  <LinearGradient
                    colors={["#f093fb", "#f5576c"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionLabel}>View History</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => Alert.alert("Withdraw", "Withdrawal feature coming soon")}
                >
                  <LinearGradient
                    colors={["#4ecdc4", "#44bd9e"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.actionIcon}>💰</Text>
                    <Text style={styles.actionLabel}>Withdraw</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => Alert.alert("Statistics", "View detailed statistics")}
                >
                  <LinearGradient
                    colors={["#a29bfe", "#6c5ce7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionLabel}>Statistics</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => Alert.alert("Goals", "Set your daily goals")}
                >
                  <LinearGradient
                    colors={["#ffeaa7", "#fdcb6e"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.actionIcon}>🎯</Text>
                    <Text style={styles.actionLabel}>Goals</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Available Requests Section */}
            <View style={styles.requestsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Available Requests</Text>
                <TouchableOpacity onPress={fetchStats}>
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              <Requests />
            </View>

            {/* Tips & Earnings */}
            <LinearGradient
              colors={["#ffeaa7", "#fdcb6e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tipsCard}
            >
              <Text style={styles.tipsIcon}>💡</Text>
              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>Pro Tip</Text>
                <Text style={styles.tipsText}>
                  Complete 10 deliveries today to earn a R300 bonus! You've done {completedToday}/10 today.
                </Text>
              </View>
            </LinearGradient>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                ⚡ SwiftDash Driver Partner • 24/7 Support
              </Text>
              <Text style={styles.footerSubtext}>
                Your safety is our priority
              </Text>
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
    paddingTop: Platform.OS === "ios" ? 20 : 30,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  driverName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    fontSize: 22,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  statCardWrapper: {
    width: (width - 52) / 2,
  },
  statCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  activeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "600",
  },
  activeDeliveriesContainer: {
    marginBottom: 20,
  },
  activeDeliveriesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    marginTop: 5,
  },
  activeDeliveryCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeDeliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  activeDeliveryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  activeDeliveryStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f5576c",
  },
  activeDeliveryCustomer: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 4,
  },
  activeDeliveryAddress: {
    fontSize: 12,
    color: "#636e72",
    marginBottom: 8,
  },
  activeDeliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeDeliveryPackage: {
    fontSize: 11,
    color: "#00b894",
    fontWeight: "600",
  },
  activeDeliveryLink: {
    fontSize: 11,
    color: "#f5576c",
    fontWeight: "600",
  },
  additionalStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },
  additionalStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  additionalStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#b2bec3",
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: "#00b894",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#b2bec3",
  },
  onlineText: {
    color: "#00b894",
  },
  statusMessage: {
    fontSize: 13,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 15,
  },
  statusButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusButtonText: {
    fontSize: 13,
    color: "#f5576c",
    fontWeight: "600",
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refreshText: {
    fontSize: 12,
    color: "#fdcb6e",
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionGradient: {
    padding: 16,
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  requestsSection: {
    marginBottom: 20,
  },
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  tipsIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d63031",
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: "#e17055",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});