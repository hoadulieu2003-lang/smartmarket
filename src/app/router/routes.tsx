// HashRouter (routing qua #/) thay vì BrowserRouter: trong WebView Zalo đường dẫn
// khởi động không phải "/" nên history-router sẽ 404. Hash-router luôn bắt đầu ở #/.
import { createHashRouter } from "react-router-dom";
import { AppGate } from "@/features/auth";
import { BuyerLayout, SellerLayout } from "@/components/layout";
// Buyer
import { HomePage } from "@/features/home";
import { MarketsPage } from "@/features/markets";
import { MarketDetailPage } from "@/features/markets/MarketDetailPage";
import { TradersPage } from "@/features/traders/TradersPage";
import { TraderDetailPage } from "@/features/traders/TraderDetailPage";
import { ProductListPage } from "@/features/products/ProductListPage";
import { ProductDetailPage } from "@/features/products/ProductDetailPage";
import { CartPage } from "@/features/cart/CartPage";
import { CheckoutPage } from "@/features/cart/CheckoutPage";
import { OrdersPage } from "@/features/orders/OrdersPage";
import { OrderDetailPage } from "@/features/orders/OrderDetailPage";
import { ReviewCreatePage } from "@/features/reviews/ReviewCreatePage";
import { MyReviewsPage } from "@/features/reviews/MyReviewsPage";
import { FeedbackListPage } from "@/features/feedback/FeedbackListPage";
import { FeedbackCreatePage } from "@/features/feedback/FeedbackCreatePage";
import { FeedbackDetailPage } from "@/features/feedback/FeedbackDetailPage";
import { MerchantApplyPage } from "@/features/merchant-apply/MerchantApplyPage";
import { MerchantApplyStatusPage } from "@/features/merchant-apply/MerchantApplyStatusPage";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ProfileSettingsPage } from "@/features/profile/ProfileSettingsPage";
import { SearchPage } from "@/features/search/SearchPage";
import { QrPage } from "@/features/qr/QrPage";
// Seller
import { SellerDashboardPage } from "@/features/seller/dashboard/SellerDashboardPage";
import { SellerStallPage } from "@/features/seller/stall/SellerStallPage";
import { SellerOrdersPage } from "@/features/seller/orders/SellerOrdersPage";
import { SellerOrderDetailPage } from "@/features/seller/orders/SellerOrderDetailPage";
import { SellerPromotionsPage } from "@/features/seller/promotions/SellerPromotionsPage";
import { SellerProfilePage } from "@/features/seller/profile/SellerProfilePage";
import { SellerProductsPage } from "@/features/seller/products/SellerProductsPage";
import { SellerProductFormPage } from "@/features/seller/products/SellerProductFormPage";
import { SellerPromotionPage } from "@/features/seller/products/SellerPromotionPage";
import { Box } from "@mui/material";
import { EmptyState, Screen, TopBar } from "@/components/ui/bits";

function NotFound() {
  return (
    <Box>
      <TopBar title="Không tìm thấy" onBack />
      <Screen>
        <EmptyState
          title="Không tìm thấy trang"
          hint="Đường dẫn không tồn tại."
        />
      </Screen>
    </Box>
  );
}

export const router = createHashRouter([
  {
    element: <AppGate />,
    children: [
      // Buyer tabs (bottom navigation)
      {
        element: <BuyerLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/markets", element: <MarketsPage /> },
          { path: "/search", element: <SearchPage /> },
          { path: "/qr", element: <QrPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
      // Buyer flow (full-screen)
      { path: "/markets/:id", element: <MarketDetailPage /> },
      { path: "/markets/:id/traders", element: <TradersPage /> },
      { path: "/traders/:id", element: <TraderDetailPage /> },
      { path: "/products", element: <ProductListPage /> },
      { path: "/products/:id", element: <ProductDetailPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/orders", element: <OrdersPage /> },
      { path: "/orders/:id", element: <OrderDetailPage /> },
      { path: "/reviews/create", element: <ReviewCreatePage /> },
      { path: "/profile/reviews", element: <MyReviewsPage /> },
      { path: "/profile/settings", element: <ProfileSettingsPage /> },
      { path: "/feedback", element: <FeedbackListPage /> },
      { path: "/feedback/create", element: <FeedbackCreatePage /> },
      { path: "/feedback/:id", element: <FeedbackDetailPage /> },
      { path: "/merchant-apply", element: <MerchantApplyPage /> },
      { path: "/merchant-apply/status", element: <MerchantApplyStatusPage /> },
      // Seller mode (bottom navigation riêng)
      {
        element: <SellerLayout />,
        children: [
          { path: "/seller/dashboard", element: <SellerDashboardPage /> },
          { path: "/seller/products", element: <SellerProductsPage /> },
          { path: "/seller/orders", element: <SellerOrdersPage /> },
          { path: "/seller/promotions", element: <SellerPromotionsPage /> },
          { path: "/seller/profile", element: <SellerProfilePage /> },
        ],
      },
      // Seller flow (full-screen)
      { path: "/seller/stall", element: <SellerStallPage /> },
      { path: "/seller/products/create", element: <SellerProductFormPage /> },
      { path: "/seller/products/:id/edit", element: <SellerProductFormPage /> },
      {
        path: "/seller/products/:id/promotion",
        element: <SellerPromotionPage />,
      },
      { path: "/seller/orders/:id", element: <SellerOrderDetailPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
