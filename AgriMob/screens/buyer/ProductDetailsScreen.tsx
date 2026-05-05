import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MarketStackParamList } from "../../navigation/BuyerTabNavigator";
import { productApi } from "../../apis/product.api";
import { cartApi } from "../../apis/cart.api";
import { reviewApi, Review, ReviewsResponse } from "../../apis/review.api";
import { Alert, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";

const formatDZD = (value: number) =>
  new Intl.NumberFormat("fr-DZ").format(value) + " DZD";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  images: string[];
  location: string;
  grade: string;
  specifications: Record<string, string>;
  farmer: {
    name: string;
    rating: number;
    location: string;
  };
}

export default function ProductDetailsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MarketStackParamList>>();
  const route = useRoute();
  const { productId } = route.params as { productId: string };

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState("10");
  const [activeTab, setActiveTab] = useState<"specs" | "details" | "reviews">("specs");
  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data: any = await productApi.detail(productId);
        const mapped: Product = {
          id: data.id.toString(),
          name: data.ministry_product?.name || "Unknown Product",
          description: data.description,
          price: parseFloat(data.unit_price) || 0,
          unit: "kg",
          images:
            data.images?.length > 0
              ? data.images.map((img: any) => img.image)
              : ["https://via.placeholder.com/400"],
          location: data.farm?.wilaya || "Unknown Location",
          grade: "A",
          specifications: {
            Category: data.category_name || "N/A",
            Season: data.season || "N/A",
            Stock: `${data.stock} kg available`,
            Farm: data.farm?.name || "N/A",
          },
          farmer: {
            name: data.farmer_name || "Unknown Farmer",
            rating: data.average_rating || 5.0,
            location: data.farm?.wilaya || "Unknown",
          },
        };
        setProduct(mapped);
        setSelectedImage(mapped.images[0]);
      } catch (err) {
        Alert.alert("Error", "Could not fetch product details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const response = await reviewApi.forProduct(productId);
        const data = Array.isArray(response) ? response : (response as ReviewsResponse).results || [];
        setReviews(data);
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please provide a comment for your review.");
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewApi.create({
        product_id: Number(productId),
        rating: newRating,
        comment: newComment.trim(),
      });
      Alert.alert("Success", "Review submitted successfully!");
      setShowReviewForm(false);
      setNewComment("");
      setNewRating(5);
      
      // Refresh reviews
      const response = await reviewApi.forProduct(productId);
      const data = Array.isArray(response) ? response : (response as ReviewsResponse).results || [];
      setReviews(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit review. You can only review products you have purchased and received.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await cartApi.add(Number(product.id), Number(quantity));
      Alert.alert("Added to Cart", `${product.name} added successfully.`);
      navigation.getParent()?.navigate("Cart");
    } catch (error) {
      Alert.alert("Error", "Failed to add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      // Must add to cart first since checkout relies on a non-empty cart
      await cartApi.add(Number(product.id), Number(quantity));
      navigation.getParent()?.navigate("Checkout");
    } catch (error) {
      Alert.alert("Error", "Failed to initiate checkout. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#0df20d" />
      </SafeAreaView>
    );
  }

  const totalPrice = product.price * (parseInt(quantity) || 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <Image source={{ uri: selectedImage }} style={styles.mainImage} />

        {/* Thumbnail strip */}
        {product.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbStrip}
          >
            {product.images.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedImage(img)}>
                <Image
                  source={{ uri: img }}
                  style={[
                    styles.thumb,
                    selectedImage === img && styles.thumbActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.section}>
          <View style={styles.productHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="place" size={13} color="#6b7280" />
                <Text style={styles.locationText}>{product.location}</Text>
              </View>
            </View>
            <View style={styles.gradePill}>
              <Text style={styles.gradeText}>Grade {product.grade}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatDZD(product.price)}</Text>
            <Text style={styles.priceUnit}>/ {product.unit}</Text>
          </View>

          {/* Meta pills */}
          <View style={styles.metaPills}>
            <View style={styles.metaPill}>
              <MaterialIcons name="eco" size={12} color="#047857" />
              <Text style={styles.metaPillText}>Fresh Harvest</Text>
            </View>
            <View style={styles.metaPill}>
              <MaterialIcons name="verified" size={12} color="#047857" />
              <Text style={styles.metaPillText}>Certified</Text>
            </View>
            <View style={styles.metaPill}>
              <MaterialIcons name="local-shipping" size={12} color="#6b7280" />
              <Text style={[styles.metaPillText, { color: "#6b7280" }]}>
                Ships in 24h
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "specs" && styles.tabActive]}
            onPress={() => setActiveTab("specs")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "specs" && styles.tabTextActive,
              ]}
            >
              Specifications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "details" && styles.tabActive]}
            onPress={() => setActiveTab("details")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "details" && styles.tabTextActive,
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "reviews" && styles.tabActive]}
            onPress={() => setActiveTab("reviews")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "reviews" && styles.tabTextActive,
              ]}
            >
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {activeTab === "specs" &&
            Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          {activeTab === "details" && (
            <Text style={styles.descText}>{product.description}</Text>
          )}
          {activeTab === "reviews" && (
            <View style={styles.reviewsContainer}>
              {loadingReviews ? (
                <ActivityIndicator size="small" color="#047857" style={{ marginTop: 20 }} />
              ) : (
                <>
                  <View style={styles.reviewsHeader}>
                     <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                     {!showReviewForm && user?.role === "BUYER" && (
                       <TouchableOpacity onPress={() => setShowReviewForm(true)} style={styles.writeReviewBtn}>
                         <Text style={styles.writeReviewBtnText}>Write a Review</Text>
                       </TouchableOpacity>
                     )}
                  </View>
                  
                  {showReviewForm && (
                    <View style={styles.reviewForm}>
                      <Text style={styles.reviewFormLabel}>Rating</Text>
                      <View style={styles.starSelect}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                            <MaterialIcons 
                               name={star <= newRating ? "star" : "star-border"} 
                               size={32} 
                               color={star <= newRating ? "#f59e0b" : "#e5e7eb"} 
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <Text style={styles.reviewFormLabel}>Comment</Text>
                      <TextInput 
                         style={styles.reviewInput} 
                         multiline 
                         numberOfLines={3} 
                         value={newComment}
                         onChangeText={setNewComment}
                         placeholder="Share your experience..."
                         placeholderTextColor="#9ca3af"
                      />
                      
                      <View style={styles.reviewFormActions}>
                        <TouchableOpacity onPress={() => setShowReviewForm(false)} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmitReview} style={styles.submitReviewBtn} disabled={submittingReview}>
                           {submittingReview ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitReviewBtnText}>Submit</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {reviews.length === 0 ? (
                    <Text style={styles.noReviewsText}>No reviews yet for this product.</Text>
                  ) : (
                    reviews.map((review, index) => (
                      <View key={review.id || index} style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <View style={styles.reviewStars}>
                             {[1, 2, 3, 4, 5].map(s => (
                               <MaterialIcons key={s} name={s <= review.rating ? "star" : "star-border"} size={16} color={s <= review.rating ? "#f59e0b" : "#e5e7eb"} />
                             ))}
                          </View>
                          <Text style={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      </View>
                    ))
                  )}
                </>
              )}
            </View>
          )}
        </View>

        {/* Farmer Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmer</Text>
          <View style={styles.farmerCard}>
            <View style={styles.farmerAvatar}>
              <MaterialIcons name="person" size={20} color="#047857" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerName}>{product.farmer.name}</Text>
              <View style={styles.farmerMeta}>
                <MaterialIcons name="place" size={11} color="#9ca3af" />
                <Text style={styles.farmerMetaText}>
                  {product.farmer.location}
                </Text>
                <MaterialIcons name="star" size={11} color="#f59e0b" />
                <Text style={styles.farmerMetaText}>
                  {product.farmer.rating.toFixed(1)}
                </Text>
              </View>
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={12} color="#047857" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Order Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Place Order</Text>

          <View style={styles.qtySection}>
            <Text style={styles.qtyLabel}>Quantity (kg)</Text>
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  setQuantity((prev) =>
                    String(Math.max(1, parseInt(prev) - 1))
                  )
                }
              >
                <MaterialIcons name="remove" size={16} color="#047857" />
              </TouchableOpacity>
              <TextInput
                value={quantity}
                onChangeText={(v) => setQuantity(v.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                style={styles.qtyInput}
              />
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  setQuantity((prev) => String(parseInt(prev) + 1))
                }
              >
                <MaterialIcons name="add" size={16} color="#047857" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Price breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Unit price</Text>
              <Text style={styles.breakdownVal}>{formatDZD(product.price)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Quantity</Text>
              <Text style={styles.breakdownVal}>{quantity} kg</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
              <Text style={styles.breakdownTotalVal}>
                {formatDZD(totalPrice)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.buyNowBtn}
            onPress={handleBuyNow}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator color="#065f46" size="small" />
            ) : (
              <>
                <Text style={styles.buyNowText}>Buy Now</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#065f46" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addCartBtn}
            onPress={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator color="#047857" size="small" />
            ) : (
              <>
                <MaterialIcons name="shopping-cart" size={16} color="#047857" />
                <Text style={styles.addCartText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8f5",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f8f5",
  },

  // ── HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8faf8",
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.2,
  },

  // ── IMAGES
  mainImage: {
    width: "100%",
    height: 240,
  },

  thumbStrip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },

  thumbActive: {
    borderColor: "#0df20d",
  },

  // ── SECTIONS
  section: {
    backgroundColor: "#fff",
    marginTop: 8,
    padding: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#f0f0f0",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.1,
    marginBottom: 12,
  },

  // ── PRODUCT INFO
  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },

  productName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  locationText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  gradePill: {
    backgroundColor: "#d1fae5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  gradeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#047857",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },

  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a2e1a",
    letterSpacing: -0.5,
  },

  priceUnit: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },

  metaPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8faf8",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  metaPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },

  // ── TABS
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#f0f0f0",
    marginTop: 8,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  tabActive: {
    borderBottomColor: "#0df20d",
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9ca3af",
  },

  tabTextActive: {
    color: "#047857",
  },

  // ── SPECS
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },

  specKey: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },

  specValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },

  descText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
  },

  // ── FARMER
  farmerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },

  farmerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },

  farmerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a2e1a",
    marginBottom: 4,
  },

  farmerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  farmerMetaText: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    marginRight: 6,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#d1fae5",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  verifiedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
  },

  // ── ORDER SECTION
  qtySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  qtyLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },

  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },

  qtyInput: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2e1a",
    minWidth: 40,
    textAlign: "center",
    padding: 0,
  },

  priceBreakdown: {
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 14,
  },

  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  breakdownLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "600",
  },

  breakdownVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  breakdownTotal: {
    borderTopWidth: 0.5,
    borderTopColor: "#e4efe4",
    marginTop: 4,
    paddingTop: 8,
  },

  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a2e1a",
  },

  breakdownTotalVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#047857",
    letterSpacing: -0.3,
  },

  buyNowBtn: {
    backgroundColor: "#0df20d",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },

  buyNowText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065f46",
  },

  addCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: "#f0fdf4",
  },

  addCartText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#047857",
  },
  
  // ── REVIEWS
  reviewsContainer: {
    marginTop: 4,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a2e1a",
  },
  writeReviewBtn: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  writeReviewBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },
  reviewForm: {
    backgroundColor: "#f8faf8",
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
    marginBottom: 20,
  },
  reviewFormLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  starSelect: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  reviewInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  reviewFormActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  submitReviewBtn: {
    backgroundColor: "#0df20d",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  submitReviewBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#065f46",
  },
  noReviewsText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  reviewCard: {
    backgroundColor: "#f8faf8",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#e4efe4",
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  reviewComment: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
});