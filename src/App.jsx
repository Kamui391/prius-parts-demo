import { Component, lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import DemoBanner from "./components/DemoBanner.jsx";
import { Loading } from "./components/ui.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useMeta } from "./context/MetaContext.jsx";
import { useLang } from "./i18n.jsx";

// Хуудсуудыг хэрэгтэй үед нь ачаална (code splitting)
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const CatalogPage = lazy(() => import("./pages/CatalogPage.jsx"));
const PartPage = lazy(() => import("./pages/PartPage.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.jsx"));
const OrderDonePage = lazy(() => import("./pages/OrderDonePage.jsx"));
const ServicesPage = lazy(() => import("./pages/ServicesPage.jsx"));
const BookingPage = lazy(() => import("./pages/BookingPage.jsx"));
const AdvisorPage = lazy(() => import("./pages/AdvisorPage.jsx"));
const CalculatorPage = lazy(() => import("./pages/CalculatorPage.jsx"));
const TrackPage = lazy(() => import("./pages/TrackPage.jsx"));
const RequestPage = lazy(() => import("./pages/RequestPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout.jsx"));
const AccountHome = lazy(() => import("./pages/account/AccountHome.jsx"));
const OrdersPage = lazy(() => import("./pages/account/OrdersPage.jsx"));
const OrderDetailPage = lazy(() => import("./pages/account/OrderDetailPage.jsx"));
const BookingsPage = lazy(() => import("./pages/account/BookingsPage.jsx"));
const GaragePage = lazy(() => import("./pages/account/GaragePage.jsx"));
const WishlistPage = lazy(() => import("./pages/account/WishlistPage.jsx"));
const NotificationsPage = lazy(() => import("./pages/account/NotificationsPage.jsx"));
const RequestsPage = lazy(() => import("./pages/account/RequestsPage.jsx"));
const ProfilePage = lazy(() => import("./pages/account/ProfilePage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

// Хуудсанд гэнэтийн алдаа гарвал бүх апп унахаас сэргийлнэ
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container mt-5 mb-5">
        <div className="alert danger">
          <span className="grow">{this.state.error.message}</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => window.location.reload()}>↻</button>
        </div>
      </div>
    );
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Нэвтрээгүй бол нэвтрэх хуудас руу, буцаж ирэх хаягтай нь шилжүүлнэ
export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

export default function App() {
  const { error, reload } = useMeta();
  const { t } = useLang();
  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollToTop />
      <DemoBanner />
      <Header />
      {error && (
        <div className="container mt-3">
          <div className="alert danger">
            <span className="grow">{error.message}</span>
            <button type="button" className="btn btn-sm btn-outline" onClick={reload}>{t("common.retry")}</button>
          </div>
        </div>
      )}
      <main id="main" className="app-main">
        <ErrorBoundary key={useLocation().pathname}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="parts" element={<CatalogPage />} />
            <Route path="parts/:id" element={<PartPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="checkout/done/:code" element={<RequireAuth><OrderDonePage /></RequireAuth>} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="book" element={<BookingPage />} />
            <Route path="advisor" element={<AdvisorPage />} />
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="request" element={<RequestPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
              <Route index element={<AccountHome />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:code" element={<OrderDetailPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="garage" element={<GaragePage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
