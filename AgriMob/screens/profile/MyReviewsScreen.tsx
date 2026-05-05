import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { reviewApi, Review, ReviewsResponse } from "../../apis/review.api";

export default function MyReviewsScreen() {
  const navigation = useNavigation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await reviewApi.myReviews();
      const data = Array.isArray(response) ? response : (response as ReviewsResponse).results || [];
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(id);
          try {
            await reviewApi.delete(id);
            setReviews((prev) => prev.filter((r) => r.id !== id));
          } catch (e) {
            Alert.alert("Error", "Failed to delete review.");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Review }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <MaterialIcons
              key={s}
              name={s <= item.rating ? "star" : "star-border"}
              size={16}
              color={s <= item.rating ? "#f59e0b" : "#e5e7eb"}
            />
          ))}
        </View>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productIconBox}>
          <MaterialIcons name="inventory-2" size={20} color="#047857" />
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{item.product?.ministry_product?.name || "Unknown Product"}</Text>
          <Text style={styles.productSub}>{item.product?.farmer_name ? `From ${item.product.farmer_name}` : "Farmer unknown"}</Text>
        </View>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          disabled={deletingId === item.id}
          style={styles.deleteBtn}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <MaterialIcons name="delete" size={16} color="#ef4444" />
              <Text style={styles.deleteText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0df20d" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="star-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>You haven't written any reviews yet.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8faf8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a2e1a",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  date: {
    fontSize: 12,
    color: "#9ca3af",
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  productIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  productSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  comment: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ef4444",
  },
});
