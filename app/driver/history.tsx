import { supabase } from "@/SupaBase/supabase_file";
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
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function History() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "accepted" | "completed">("all");
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

    fetchDeliveryHistory();
  }, []);

  const fetchDeliveryHistory = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      let query = supabase
        .from("delivery_requests")
        .select(`
          *,
          customer:users!customer_id(id, name, email, phone)
        `)
        .eq("driver_id", user.id)
        .in("status", ["accepted", "completed"])
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error fetching delivery history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryHistory();
  };

  const getFilteredDeliveries = () => {
    if (selectedFilter === "all") return deliveries;
    return deliveries.filter(d => d.status === selectedFilter);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "#fdcb6e";
      case "completed": return "#00b894";
      default: return "#dfe6e9";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted": return "⏳";
      case "completed": return "✅";
      default: return "📦";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted": return "In Progress";
      case "completed": return "Completed";
      default: return status;
    }
  };

  const filteredDeliveries = getFilteredDeliveries();

  if (loading) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading delivery history...</Text>
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery History</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === "all" && styles.filterTabActive]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text style={[styles.filterText, selectedFilter === "all" && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === "accepted" && styles.filterTabActive]}
            onPress={() => setSelectedFilter("accepted")}
          >
            <Text style={[styles.filterText, selectedFilter === "accepted" && styles.filterTextActive]}>
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === "completed" && styles.filterTabActive]}
            onPress={() => setSelectedFilter("completed")}
          >
            <Text style={[styles.filterText, selectedFilter === "completed" && styles.filterTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
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
            {filteredDeliveries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.9)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyCard}
                >
                  <Text style={styles.emptyEmoji}>📭</Text>
                  <Text style={styles.emptyTitle}>No Deliveries Found</Text>
                  <Text style={styles.emptyText}>
                    {selectedFilter === "all" 
                      ? "You haven't accepted any deliveries yet"
                      : selectedFilter === "accepted"
                      ? "No active deliveries in progress"
                      : "No completed deliveries yet"}
                  </Text>
                  <TouchableOpacity 
                    style={styles.refreshEmptyButton}
                    onPress={fetchDeliveryHistory}
                  >
                    <Text style={styles.refreshEmptyText}>Refresh</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              filteredDeliveries.map((delivery, index) => (
                <Animated.View
                  key={delivery.id}
                  style={[
                    styles.deliveryCard,
                    {
                      animationDelay: `${index * 100}ms`,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#ffffff", "#f8f9fa"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                      <Text style={styles.statusIcon}>{getStatusIcon(delivery.status)}</Text>
                      <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
                    </View>

                    {/* Customer Info */}
                    <View style={styles.customerSection}>
                      <View style={styles.customerAvatar}>
                        <Text style={styles.customerAvatarText}>
                          {delivery.customer?.name?.charAt(0) || "C"}
                        </Text>
                      </View>
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{delivery.customer?.name || "Customer"}</Text>
                        {delivery.customer?.email && (
                          <Text style={styles.customerEmail}>📧 {delivery.customer.email}</Text>
                        )}
                        {delivery.customer?.phone && (
                          <Text style={styles.customerPhone}>📞 {delivery.customer.phone}</Text>
                        )}
                      </View>
                    </View>

                    {/* Pickup Address */}
                    <View style={styles.locationSection}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <View style={styles.locationContent}>
                        <Text style={styles.locationLabel}>Pickup Address</Text>
                        <Text style={styles.locationAddress}>
                          {delivery.pickup_address || "Address not provided"}
                        </Text>
                      </View>
                    </View>

                    {/* Delivery Details */}
                    <View style={styles.detailsGrid}>
                      {delivery.package_type && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>📦</Text>
                          <Text style={styles.detailLabel}>Package</Text>
                          <Text style={styles.detailValue}>{delivery.package_type}</Text>
                        </View>
                      )}
                      {delivery.weight && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>⚖️</Text>
                          <Text style={styles.detailLabel}>Weight</Text>
                          <Text style={styles.detailValue}>{delivery.weight}</Text>
                        </View>
                      )}
                      {delivery.delivery_option && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>🚚</Text>
                          <Text style={styles.detailLabel}>Option</Text>
                          <Text style={styles.detailValue}>
                            {delivery.delivery_option.charAt(0).toUpperCase() + delivery.delivery_option.slice(1)}
                          </Text>
                        </View>
                      )}
                      {delivery.delivery_fee && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailIcon}>💰</Text>
                          <Text style={styles.detailLabel}>Fee</Text>
                          <Text style={styles.detailValue}>R{delivery.delivery_fee}</Text>
                        </View>
                      )}
                    </View>

                    {/* Date */}
                    <View style={styles.dateSection}>
                      <Text style={styles.dateIcon}>📅</Text>
                      <Text style={styles.dateText}>
                        Created: {formatDate(delivery.created_at)}
                      </Text>
                    </View>

                    {delivery.status === "accepted" && (
                      <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => router.push({ pathname: "/driver/activeDelivery", params: { id: delivery.id } })}
                      >
                        <LinearGradient
                          colors={["#f093fb", "#f5576c"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.viewButtonGradient}
                        >
                          <Text style={styles.viewButtonText}>View Delivery →</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {delivery.status === "completed" && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedIcon}>✓</Text>
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              ))
            )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 30,
    paddingBottom: 15,
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "#f5576c",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  filterTextActive: {
    color: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: height - 200,
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
  deliveryCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: 18,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  customerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5576c",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
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
  customerEmail: {
    fontSize: 12,
    color: "#636e72",
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 12,
    color: "#0984e3",
  },
  locationSection: {
    flexDirection: "row",
    marginBottom: 15,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#636e72",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: "#2d3436",
    lineHeight: 18,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailItem: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: "#636e72",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2d3436",
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  dateText: {
    fontSize: 11,
    color: "#999",
  },
  viewButton: {
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 5,
  },
  viewButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4edda",
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 5,
  },
  completedIcon: {
    fontSize: 16,
    color: "#28a745",
    marginRight: 8,
    fontWeight: "bold",
  },
  completedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#155724",
  },
});