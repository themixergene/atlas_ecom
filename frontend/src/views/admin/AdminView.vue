<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Boxes, ChartNoAxesCombined, FolderTree, LayoutDashboard, PackagePlus, Search, ShoppingCart, Users } from '@lucide/vue';
import { api, getErrorMessage } from '../../api/client';
import CompetitorIntelligencePanel from '../../components/admin/CompetitorIntelligencePanel.vue';
import { useToastStore } from '../../stores/toast';
import type {
  AdCampaign,
  AdObjective,
  AdStrategy,
  Category,
  CreativeType,
  Order,
  OrderStatus,
  PaginatedProducts,
  Product,
  ProductResearch,
  SalesByCityAnalytics,
  TopProductAnalytics,
  User,
  AnalyticsOverview,
  MonthlyRevenueAnalytics,
  OrdersByStatusAnalytics,
  CompetitorInsight,
} from '../../types';

Chart.register(BarController, BarElement, CategoryScale, DoughnutController, ArcElement, LinearScale, LineController, LineElement, PointElement, Tooltip, Filler);

type Tab = 'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'analytics' | 'research' | 'ads' | 'competitors';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const active = ref<Tab>(tabFromPath(route.path));
const loading = ref(true);
const adsLoading = ref(false);
const search = ref('');
const revenueCanvas = ref<HTMLCanvasElement | null>(null);
const ordersCanvas = ref<HTMLCanvasElement | null>(null);
const cityCanvas = ref<HTMLCanvasElement | null>(null);
let revenueChart: Chart | null = null;
let ordersChart: Chart | null = null;
let cityChart: Chart | null = null;

const stats = ref({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: '0', pendingOrders: 0 });
const overview = ref<AnalyticsOverview>({
  totalRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  cancelledOrders: 0,
  deliveredOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
  averageOrderValue: 0,
});
const topProducts = ref<TopProductAnalytics[]>([]);
const salesByCity = ref<SalesByCityAnalytics[]>([]);
const ordersByStatus = ref<OrdersByStatusAnalytics[]>([]);
const monthlyRevenue = ref<MonthlyRevenueAnalytics[]>([]);
const productResearch = ref<ProductResearch>({
  bestSellingProducts: [],
  lowStockProducts: [],
  productsWithoutSales: [],
  recommendedProductsToPromote: [],
  competitorAnalyzedProducts: [],
});
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const orders = ref<Order[]>([]);
const users = ref<User[]>([]);
const campaigns = ref<AdCampaign[]>([]);
const competitorInsights = ref<CompetitorInsight[]>([]);
const generatedStrategy = ref<AdStrategy | null>(null);
const editingProductId = ref<number | null>(null);
const editingCategoryId = ref<number | null>(null);

const productForm = reactive({
  name: '',
  description: '',
  shortDescription: '',
  price: 0,
  comparePrice: 0,
  stock: 0,
  image: '',
  galleryImages: '',
  categoryId: 0,
  featured: false,
});
const categoryForm = reactive({ name: '' });
const adForm = reactive({
  productId: 0,
  name: '',
  objective: 'SALES' as AdObjective,
  budget: 250,
  city: 'Casablanca',
  ageMin: 18,
  ageMax: 35,
  gender: 'Tous',
  creativeType: 'VIDEO' as CreativeType,
  creativeUrl: '',
  adCopy: '',
  strategy: '',
  status: 'DRAFT',
});

const tabs = [
  { key: 'dashboard' as Tab, label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin' },
  { key: 'products' as Tab, label: 'Produits', icon: Boxes, path: '/admin?tab=products' },
  { key: 'categories' as Tab, label: 'Catégories', icon: FolderTree, path: '/admin?tab=categories' },
  { key: 'orders' as Tab, label: 'Commandes', icon: ShoppingCart, path: '/admin?tab=orders' },
  { key: 'users' as Tab, label: 'Utilisateurs', icon: Users, path: '/admin?tab=users' },
  { key: 'analytics' as Tab, label: 'Analyses BI', icon: ChartNoAxesCombined, path: '/admin?tab=analytics' },
  { key: 'competitors' as Tab, label: 'Veille concurrentielle', icon: Search, path: '/admin/competitor-intelligence' },
  { key: 'research' as Tab, label: 'Étude produits', icon: Search, path: '/admin/product-research' },
  { key: 'ads' as Tab, label: 'Stratégie publicitaire', icon: PackagePlus, path: '/admin/ads' },
];
const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const objectives: AdObjective[] = ['SALES', 'MESSAGES', 'TRAFFIC', 'AWARENESS'];
const creativeTypes: CreativeType[] = ['IMAGE', 'VIDEO'];
const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};
const objectiveLabels: Record<AdObjective, string> = {
  SALES: 'Ventes',
  MESSAGES: 'Messages',
  TRAFFIC: 'Trafic',
  AWARENESS: 'Notoriété',
};
const creativeLabels: Record<CreativeType, string> = { IMAGE: 'Image', VIDEO: 'Vidéo' };
const campaignStatusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  READY: 'Prête',
  TESTING: 'En test',
  WINNING: 'Performante',
  PAUSED: 'En pause',
};

function tabFromPath(path: string): Tab {
  if (path.includes('/admin/product-research')) return 'research';
  if (path.includes('/admin/ads')) return 'ads';
  if (path.includes('/admin/competitor-intelligence')) return 'competitors';
  const queryTab = route.query.tab;
  return typeof queryTab === 'string' && ['products', 'categories', 'orders', 'users', 'analytics'].includes(queryTab) ? (queryTab as Tab) : 'dashboard';
}

function money(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`;
}

function recommendationLabel(value: string) {
  const labels: Record<string, string> = {
    'Promote this product in ads': 'Promouvoir ce produit dans les publicités',
    'Restock before advertising': 'Réapprovisionner avant de faire de la publicité',
    'Test with small budget': 'Tester avec un petit budget',
    'Scale this product': 'Augmenter le budget sur ce produit',
  };
  return labels[value] ?? value;
}

function percentStatus(status: OrderStatus) {
  const count = ordersByStatus.value.find((item) => item.status === status)?.count ?? 0;
  return overview.value.totalOrders ? Math.round((count / overview.value.totalOrders) * 100) : 0;
}

function navigate(tab: Tab) {
  const item = tabs.find((candidate) => candidate.key === tab);
  active.value = tab;
  if (item) void router.push(item.path);
}

function resetProduct() {
  editingProductId.value = null;
  Object.assign(productForm, {
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: 0,
    stock: 0,
    image: '',
    galleryImages: '',
    categoryId: categories.value[0]?.id ?? 0,
    featured: false,
  });
}

function resetAdForm() {
  Object.assign(adForm, {
    productId: products.value[0]?.id ?? 0,
    name: products.value[0] ? `${products.value[0].name} - Campagne test` : '',
    objective: 'SALES',
    budget: 250,
    city: 'Casablanca',
    ageMin: 18,
    ageMax: 35,
    gender: 'Tous',
    creativeType: 'VIDEO',
    creativeUrl: '',
    adCopy: '',
    strategy: '',
    status: 'DRAFT',
  });
  generatedStrategy.value = null;
}

function productPayload() {
  return {
    name: productForm.name,
    description: productForm.description,
    shortDescription: productForm.shortDescription,
    price: Number(productForm.price),
    comparePrice: productForm.comparePrice ? Number(productForm.comparePrice) : undefined,
    stock: Number(productForm.stock),
    image: productForm.image,
    galleryImages: productForm.galleryImages.split('\n').map((item) => item.trim()).filter(Boolean),
    categoryId: Number(productForm.categoryId),
    featured: productForm.featured,
  };
}

function adPayload() {
  return {
    productId: Number(adForm.productId),
    name: adForm.name,
    objective: adForm.objective,
    budget: Number(adForm.budget),
    city: adForm.city,
    ageMin: Number(adForm.ageMin),
    ageMax: Number(adForm.ageMax),
    gender: adForm.gender === 'Tous' ? 'All' : adForm.gender === 'Hommes' ? 'Men' : adForm.gender === 'Femmes' ? 'Women' : adForm.gender,
    creativeType: adForm.creativeType,
    creativeUrl: adForm.creativeUrl,
    adCopy: adForm.adCopy,
    strategy: adForm.strategy,
    status: 'DRAFT',
  };
}

function productInsight(productId: number) {
  return competitorInsights.value.find((insight) => insight.productId === productId);
}

function competitionLabel(level?: string) {
  return level === 'HIGH' ? 'Élevée' : level === 'MEDIUM' ? 'Moyenne' : level === 'LOW' ? 'Faible' : 'Non analysée';
}

function useCompetitorInsight(insight: CompetitorInsight) {
  const copy = insight.recommendedAdCopies[0];
  adForm.productId = insight.productId;
  adForm.name = `${insight.product.name} - Angle concurrentiel`;
  adForm.adCopy = copy?.primaryText ?? '';
  adForm.strategy = `${insight.recommendedPositioning}\n\nAngle : ${copy?.angle ?? insight.commonHooks}\nCTA : ${copy?.callToAction ?? insight.commonCallToActions}`;
  generatedStrategy.value = {
    audience: 'Audience recommandée à affiner selon la ville et les acheteurs du produit.',
    adCopy: adForm.adCopy,
    strategy: insight.recommendedPositioning,
    recommendation: `Score d’opportunité : ${insight.opportunityScore}/100 · Concurrence ${competitionLabel(insight.competitionLevel).toLowerCase()}.`,
  };
  navigate('ads');
  toast.show('Analyse concurrentielle importée dans Stratégie publicitaire.');
}

async function loadAll() {
  loading.value = true;
  const [
    statsResponse,
    overviewResponse,
    topProductsResponse,
    cityResponse,
    statusResponse,
    monthlyResponse,
    researchResponse,
    productsResponse,
    categoriesResponse,
    ordersResponse,
    usersResponse,
    campaignsResponse,
    competitorInsightsResponse,
  ] = await Promise.all([
    api.get('/admin/stats'),
    api.get<AnalyticsOverview>('/admin/analytics/overview'),
    api.get<TopProductAnalytics[]>('/admin/analytics/top-products'),
    api.get<SalesByCityAnalytics[]>('/admin/analytics/sales-by-city'),
    api.get<OrdersByStatusAnalytics[]>('/admin/analytics/orders-by-status'),
    api.get<MonthlyRevenueAnalytics[]>('/admin/analytics/monthly-revenue'),
    api.get<ProductResearch>('/admin/analytics/product-research'),
    api.get<PaginatedProducts>('/products', { params: { limit: 50 } }),
    api.get<Category[]>('/categories'),
    api.get<Order[]>('/orders'),
    api.get<User[]>('/users'),
    api.get<AdCampaign[]>('/admin/ads'),
    api.get<CompetitorInsight[]>('/admin/competitor-insights'),
  ]);
  stats.value = statsResponse.data;
  overview.value = overviewResponse.data;
  topProducts.value = topProductsResponse.data;
  salesByCity.value = cityResponse.data;
  ordersByStatus.value = statusResponse.data;
  monthlyRevenue.value = monthlyResponse.data;
  productResearch.value = researchResponse.data;
  products.value = productsResponse.data.items;
  categories.value = categoriesResponse.data;
  orders.value = ordersResponse.data;
  users.value = usersResponse.data;
  campaigns.value = campaignsResponse.data;
  competitorInsights.value = competitorInsightsResponse.data;
  if (!productForm.categoryId && categories.value[0]) productForm.categoryId = categories.value[0].id;
  if (!adForm.productId && products.value[0]) resetAdForm();
  loading.value = false;
  await nextTick();
  renderCharts();
}

function renderCharts() {
  revenueChart?.destroy();
  ordersChart?.destroy();
  cityChart?.destroy();
  if (revenueCanvas.value) {
    revenueChart = new Chart(revenueCanvas.value, {
      type: 'line',
      data: {
        labels: monthlyRevenue.value.map((item) => item.month),
        datasets: [{ data: monthlyRevenue.value.map((item) => item.revenue), borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,.14)', fill: true, tension: 0.35 }],
      },
      options: { responsive: true, plugins: { tooltip: { enabled: true } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e7eb' } } } },
    });
  }
  if (ordersCanvas.value) {
    ordersChart = new Chart(ordersCanvas.value, {
      type: 'doughnut',
      data: {
        labels: statuses.map((status) => statusLabels[status]),
        datasets: [{ data: statuses.map((status) => ordersByStatus.value.find((item) => item.status === status)?.count ?? 0), backgroundColor: ['#f59e0b', '#2563eb', '#64748b', '#16a34a', '#dc2626'], borderWidth: 0 }],
      },
      options: { responsive: true, cutout: '68%', plugins: { tooltip: { enabled: true } } },
    });
  }
  if (cityCanvas.value) {
    cityChart = new Chart(cityCanvas.value, {
      type: 'bar',
      data: {
        labels: salesByCity.value.slice(0, 8).map((item) => item.city),
        datasets: [{ data: salesByCity.value.slice(0, 8).map((item) => item.totalRevenue), backgroundColor: '#111827', borderRadius: 6 }],
      },
      options: { responsive: true, plugins: { tooltip: { enabled: true } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#e5e7eb' } } } },
    });
  }
}

function editProduct(product: Product) {
  editingProductId.value = product.id;
  Object.assign(productForm, {
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    price: Number(product.price),
    comparePrice: Number(product.comparePrice || 0),
    stock: product.stock,
    image: product.image,
    galleryImages: product.galleryImages.join('\n'),
    categoryId: product.categoryId,
    featured: product.featured,
  });
}

async function saveProduct() {
  try {
    if (editingProductId.value) await api.patch(`/products/${editingProductId.value}`, productPayload());
    else await api.post('/products', productPayload());
    toast.show('Produit enregistré.');
    resetProduct();
    await loadAll();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  }
}

async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`);
  toast.show('Produit supprimé.');
  await loadAll();
}

async function saveCategory() {
  try {
    if (editingCategoryId.value) await api.patch(`/categories/${editingCategoryId.value}`, categoryForm);
    else await api.post('/categories', categoryForm);
    categoryForm.name = '';
    editingCategoryId.value = null;
    toast.show('Catégorie enregistrée.');
    await loadAll();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  }
}

async function deleteCategory(id: number) {
  try {
    await api.delete(`/categories/${id}`);
    toast.show('Catégorie supprimée.');
    await loadAll();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  }
}

async function updateStatus(order: Order, status: OrderStatus) {
  await api.patch(`/orders/${order.id}/status`, { status });
  order.status = status;
  toast.show('Statut de la commande mis à jour.');
  await loadAll();
}

async function generateStrategy() {
  try {
    adsLoading.value = true;
    const response = await api.post<AdStrategy>('/admin/ads/generate-strategy', {
      productId: Number(adForm.productId),
      city: adForm.city,
      budget: Number(adForm.budget),
      objective: adForm.objective,
    });
    generatedStrategy.value = response.data;
    adForm.adCopy = response.data.adCopy;
    adForm.strategy = `${response.data.audience}\n\n${response.data.strategy}\n\n${response.data.recommendation}`;
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    adsLoading.value = false;
  }
}

async function saveCampaign() {
  try {
    await api.post('/admin/ads', adPayload());
    toast.show('Campagne enregistrée comme brouillon.');
    resetAdForm();
    await loadAll();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  }
}

async function deleteCampaign(id: number) {
  await api.delete(`/admin/ads/${id}`);
  toast.show('Campagne supprimée.');
  await loadAll();
}

watch(
  () => route.fullPath,
  async () => {
    active.value = tabFromPath(route.path);
    await nextTick();
    renderCharts();
  },
);

watch(active, async () => {
  await nextTick();
  renderCharts();
});

onMounted(async () => {
  document.title = 'Tableau de bord BI | Atlas Commerce';
  await loadAll();
});
</script>

<template>
  <section class="min-h-screen bg-[#f7f8fb] text-slate-950">
    <div class="grid lg:grid-cols-[280px_1fr]">
      <aside class="border-b border-slate-200 bg-[#111827] p-5 text-white lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-white/10">
        <p class="text-2xl font-black">ATLAS OPS</p>
        <p class="mt-2 text-xs font-bold uppercase text-white/45">Pilotage commercial</p>
        <nav class="mt-8 grid gap-2">
          <button v-for="tab in tabs" :key="tab.key" class="flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold uppercase transition" :class="active === tab.key ? 'bg-white text-slate-950' : 'text-white/65 hover:bg-white/10 hover:text-white'" @click="navigate(tab.key)">
            <component :is="tab.icon" class="h-5 w-5" /> {{ tab.label }}
          </button>
        </nav>
      </aside>

      <main class="p-4 md:p-8">
        <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-black uppercase text-teal-700">Informatique décisionnelle</p>
            <h1 class="mt-2 text-3xl font-black md:text-4xl">Centre de pilotage commercial</h1>
          </div>
          <label class="relative w-full md:max-w-sm">
            <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input v-model="search" class="field rounded-md pl-11" placeholder="Rechercher commandes, utilisateurs ou produits" />
          </label>
        </div>

        <div v-if="loading" class="rounded-md border border-slate-200 bg-white p-10 text-center font-black shadow-sm">Chargement des données...</div>

        <template v-else>
          <div v-if="active === 'dashboard' || active === 'analytics'" class="grid gap-5">
            <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div v-for="card in [
                { label: 'Chiffre d’affaires', value: money(overview.totalRevenue), tone: 'text-teal-700' },
                { label: 'Total des commandes', value: overview.totalOrders, tone: 'text-slate-950' },
                { label: 'Panier moyen', value: money(overview.averageOrderValue), tone: 'text-indigo-700' },
                { label: 'Clients', value: overview.totalCustomers, tone: 'text-slate-950' },
                { label: 'Commandes en attente', value: overview.pendingOrders, tone: 'text-amber-600' },
                { label: 'Commandes annulées', value: overview.cancelledOrders, tone: 'text-red-600' }
              ]" :key="card.label" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-xs font-black uppercase text-slate-500">{{ card.label }}</p>
                <p class="mt-3 text-2xl font-black" :class="card.tone">{{ card.value }}</p>
              </div>
            </div>

            <div class="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
              <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center gap-2"><ChartNoAxesCombined class="h-5 w-5 text-teal-700" /><p class="font-black">Évolution du chiffre d’affaires</p></div>
                <canvas ref="revenueCanvas" class="max-h-80"></canvas>
              </div>
              <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center gap-2"><ShoppingCart class="h-5 w-5 text-teal-700" /><p class="font-black">Commandes par statut</p></div>
                <canvas ref="ordersCanvas" class="max-h-80"></canvas>
                <div class="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                  <span v-for="status in statuses" :key="status">{{ statusLabels[status] }} : {{ percentStatus(status) }}%</span>
                </div>
              </div>
            </div>

            <div class="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center gap-2"><ChartNoAxesCombined class="h-5 w-5 text-teal-700" /><p class="font-black">Ventes par ville</p></div>
                <canvas ref="cityCanvas" class="max-h-80"></canvas>
              </div>
              <div class="overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">
                <div class="border-b border-slate-200 p-5"><p class="font-black">Meilleurs produits</p></div>
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4">Produit</th><th class="p-4">Vendus</th><th class="p-4">Chiffre d’affaires</th><th class="p-4">Stock</th><th class="p-4">Recommandation</th></tr></thead>
                  <tbody><tr v-for="product in topProducts" :key="product.productId" class="border-t border-slate-200"><td class="p-4 font-black">{{ product.productName }}</td><td class="p-4">{{ product.totalSold }}</td><td class="p-4">{{ money(product.totalRevenue) }}</td><td class="p-4">{{ product.stock }}</td><td class="p-4"><span class="rounded bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">{{ recommendationLabel(product.recommendation) }}</span></td></tr></tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-if="active === 'research'" class="grid gap-6">
            <section v-for="section in [
              { title: 'Produits les plus vendus', items: productResearch.bestSellingProducts },
              { title: 'Produits à faible stock', items: productResearch.lowStockProducts },
              { title: 'Produits sans ventes', items: productResearch.productsWithoutSales },
              { title: 'Produits recommandés à promouvoir', items: productResearch.recommendedProductsToPromote },
              { title: 'Produits analysés face à la concurrence', items: productResearch.competitorAnalyzedProducts }
            ]" :key="section.title" class="rounded-md border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 p-5"><h2 class="text-xl font-black">{{ section.title }}</h2></div>
              <div class="overflow-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4">Produit</th><th class="p-4">Catégorie</th><th class="p-4">Stock</th><th class="p-4">Vendus</th><th class="p-4">Chiffre d’affaires</th><th class="p-4">Concurrents</th><th class="p-4">Publicités</th><th class="p-4">Concurrence</th><th class="p-4">Opportunité</th><th class="p-4">Recommandation</th></tr></thead>
                  <tbody>
                    <tr v-for="product in section.items" :key="`${section.title}-${product.productId}`" class="border-t border-slate-200">
                      <td class="p-4"><div class="flex items-center gap-3"><img :src="product.image" class="h-12 w-12 rounded object-cover" :alt="product.productName" /><span class="font-black">{{ product.productName }}</span></div></td>
                      <td class="p-4">{{ product.category }}</td>
                      <td class="p-4">{{ product.stock }}</td>
                      <td class="p-4">{{ product.totalSold }}</td>
                      <td class="p-4">{{ money(product.totalRevenue) }}</td>
                      <td class="p-4">{{ product.competitorCount ?? 0 }}</td>
                      <td class="p-4">{{ product.savedCompetitorAdsCount ?? 0 }}</td>
                      <td class="p-4"><span class="rounded bg-slate-100 px-3 py-1 text-xs font-black">{{ competitionLabel(product.competitionLevel ?? undefined) }}</span></td>
                      <td class="p-4 font-black">{{ product.opportunityScore == null ? '—' : `${product.opportunityScore}/100` }}</td>
                      <td class="p-4"><span class="rounded bg-slate-100 px-3 py-1 text-xs font-black">{{ product.competitorRecommendation || recommendationLabel(product.recommendation) }}</span></td>
                    </tr>
                    <tr v-if="!section.items.length"><td class="p-5 text-slate-500" colspan="10">Aucun produit dans ce segment pour le moment.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <CompetitorIntelligencePanel v-if="active === 'competitors'" :products="products" @use-insight="useCompetitorInsight" />

          <div v-if="active === 'ads'" class="grid gap-6 xl:grid-cols-[430px_1fr]">
            <form class="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="saveCampaign">
              <div class="flex items-center gap-2"><PackagePlus class="h-5 w-5 text-teal-700" /><h2 class="text-xl font-black">Créer une campagne publicitaire</h2></div>
              <select v-model.number="adForm.productId" class="field rounded-md" required><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select>
              <button v-if="productInsight(adForm.productId)" class="btn-secondary rounded-md" type="button" @click="useCompetitorInsight(productInsight(adForm.productId)!)">Utiliser l’analyse concurrentielle</button>
              <input v-model="adForm.name" class="field rounded-md" placeholder="Nom de la campagne" required />
              <div class="grid grid-cols-2 gap-3"><select v-model="adForm.objective" class="field rounded-md"><option v-for="objective in objectives" :key="objective" :value="objective">{{ objectiveLabels[objective] }}</option></select><input v-model.number="adForm.budget" class="field rounded-md" type="number" min="0" step="1" placeholder="Budget" required /></div>
              <div class="grid grid-cols-2 gap-3"><input v-model="adForm.city" class="field rounded-md" placeholder="Ville ciblée" required /><select v-model="adForm.gender" class="field rounded-md"><option>Tous</option><option>Hommes</option><option>Femmes</option></select></div>
              <div class="grid grid-cols-2 gap-3"><input v-model.number="adForm.ageMin" class="field rounded-md" type="number" min="13" max="100" /><input v-model.number="adForm.ageMax" class="field rounded-md" type="number" min="13" max="100" /></div>
              <div class="grid grid-cols-2 gap-3"><select v-model="adForm.creativeType" class="field rounded-md"><option v-for="type in creativeTypes" :key="type" :value="type">{{ creativeLabels[type] }}</option></select><input v-model="adForm.creativeUrl" class="field rounded-md" type="url" placeholder="URL du visuel" required /></div>
              <button class="btn-secondary rounded-md" type="button" :disabled="adsLoading" @click="generateStrategy">{{ adsLoading ? 'Génération...' : 'Générer la stratégie' }}</button>
              <div v-if="generatedStrategy" class="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm">
                <p class="font-black">Audience</p><p class="mt-1 text-slate-700">{{ generatedStrategy.audience }}</p>
                <p class="mt-3 font-black">Recommandation</p><p class="mt-1 text-slate-700">{{ generatedStrategy.recommendation }}</p>
              </div>
              <textarea v-model="adForm.adCopy" class="field min-h-24 rounded-md" placeholder="Texte publicitaire" required></textarea>
              <textarea v-model="adForm.strategy" class="field min-h-32 rounded-md" placeholder="Stratégie" required></textarea>
              <button class="btn-primary rounded-md">Enregistrer comme brouillon</button>
            </form>

            <div class="rounded-md border border-slate-200 bg-white shadow-sm">
              <div class="border-b border-slate-200 p-5"><h2 class="text-xl font-black">Campagnes publicitaires</h2></div>
              <div class="grid gap-4 p-5">
                <article v-for="campaign in campaigns" :key="campaign.id" class="rounded-md border border-slate-200 p-4">
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p class="text-lg font-black">{{ campaign.name }}</p>
                      <p class="mt-1 text-sm text-slate-500">{{ campaign.product?.name }} · {{ campaign.city }} · {{ objectiveLabels[campaign.objective] }}</p>
                    </div>
                    <span class="w-fit rounded bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{{ campaignStatusLabels[campaign.status] ?? campaign.status }}</span>
                  </div>
                  <div class="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <p><span class="font-black">Budget :</span> {{ money(campaign.budget) }}</p>
                    <p><span class="font-black">Âge :</span> {{ campaign.ageMin }}-{{ campaign.ageMax }}</p>
                    <p><span class="font-black">Genre :</span> {{ campaign.gender === 'All' ? 'Tous' : campaign.gender === 'Men' ? 'Hommes' : campaign.gender === 'Women' ? 'Femmes' : campaign.gender }}</p>
                    <p><span class="font-black">Format :</span> {{ creativeLabels[campaign.creativeType] }}</p>
                  </div>
                  <p class="mt-4 text-sm text-slate-700">{{ campaign.adCopy }}</p>
                  <button class="mt-4 text-sm font-black text-red-600" @click="deleteCampaign(campaign.id)">Supprimer</button>
                </article>
                <p v-if="!campaigns.length" class="text-sm text-slate-500">Aucune campagne publicitaire pour le moment.</p>
              </div>
            </div>
          </div>

          <div v-if="active === 'products'" class="grid gap-6 xl:grid-cols-[420px_1fr]">
            <form class="grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="saveProduct">
              <div class="mb-2 flex items-center gap-2"><PackagePlus class="h-5 w-5 text-teal-700" /><h2 class="text-xl font-black">{{ editingProductId ? 'Modifier le produit' : 'Créer un produit' }}</h2></div>
              <input v-model="productForm.name" class="field rounded-md" placeholder="Nom" required />
              <textarea v-model="productForm.shortDescription" class="field rounded-md" placeholder="Description courte" required></textarea>
              <textarea v-model="productForm.description" class="field min-h-24 rounded-md" placeholder="Description" required></textarea>
              <div class="grid grid-cols-2 gap-3"><input v-model.number="productForm.price" class="field rounded-md" type="number" min="0" step="0.01" placeholder="Prix" required /><input v-model.number="productForm.comparePrice" class="field rounded-md" type="number" min="0" step="0.01" placeholder="Ancien prix" /></div>
              <div class="grid grid-cols-2 gap-3"><input v-model.number="productForm.stock" class="field rounded-md" type="number" min="0" placeholder="Stock" required /><select v-model.number="productForm.categoryId" class="field rounded-md" required><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></div>
              <input v-model="productForm.image" class="field rounded-md" type="url" placeholder="URL de l’image" required />
              <textarea v-model="productForm.galleryImages" class="field rounded-md" placeholder="URL des images de galerie, une par ligne"></textarea>
              <label class="flex items-center gap-2 text-sm font-black"><input v-model="productForm.featured" type="checkbox" /> Produit en vedette</label>
              <div class="flex gap-2"><button class="btn-primary flex-1 rounded-md">Enregistrer</button><button class="btn-secondary rounded-md" type="button" @click="resetProduct">Effacer</button></div>
            </form>
            <div class="overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4">Produit</th><th class="p-4">Catégorie</th><th class="p-4">Prix</th><th class="p-4">Stock</th><th class="p-4">Actions</th></tr></thead>
                <tbody><tr v-for="product in products" :key="product.id" class="border-t border-slate-200"><td class="p-4"><div class="flex items-center gap-3"><img :src="product.image" class="h-12 w-12 rounded object-cover" :alt="product.name" /><span class="font-black">{{ product.name }}</span></div></td><td class="p-4">{{ product.category?.name }}</td><td class="p-4">{{ money(product.price) }}</td><td class="p-4">{{ product.stock }}</td><td class="p-4"><button class="font-black text-teal-700" @click="editProduct(product)">Modifier</button><button class="ml-4 font-black text-red-600" @click="deleteProduct(product.id)">Supprimer</button></td></tr></tbody>
              </table>
            </div>
          </div>

          <div v-if="active === 'categories'" class="grid gap-6 lg:grid-cols-[360px_1fr]">
            <form class="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="saveCategory">
              <h2 class="text-xl font-black">{{ editingCategoryId ? 'Modifier la catégorie' : 'Créer une catégorie' }}</h2>
              <input v-model="categoryForm.name" class="field mt-4 rounded-md" placeholder="Nom de la catégorie" required />
              <button class="btn-primary mt-4 w-full rounded-md">Enregistrer la catégorie</button>
            </form>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article v-for="category in categories" :key="category.id" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-lg font-black">{{ category.name }}</p><p class="mt-1 text-sm text-slate-500">{{ category.slug }}</p>
                <div class="mt-5 flex gap-3"><button class="font-black text-teal-700" @click="editingCategoryId = category.id; categoryForm.name = category.name">Modifier</button><button class="font-black text-red-600" @click="deleteCategory(category.id)">Supprimer</button></div>
              </article>
            </div>
          </div>

          <div v-if="active === 'orders'" class="overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4">Commande</th><th class="p-4">Client</th><th class="p-4">Adresse</th><th class="p-4">Total</th><th class="p-4">Statut</th></tr></thead>
              <tbody><tr v-for="order in orders" :key="order.id" class="border-t border-slate-200"><td class="p-4 font-black">#{{ order.id }}</td><td class="p-4">{{ order.customerName }}<p class="text-slate-500">{{ order.phone }}</p></td><td class="p-4">{{ order.city }} · {{ order.address }}</td><td class="p-4 font-black">{{ money(order.total) }}</td><td class="p-4"><select class="field min-w-44 rounded-md" :value="order.status" @change="updateStatus(order, ($event.target as HTMLSelectElement).value as OrderStatus)"><option v-for="status in statuses" :key="status" :value="status">{{ statusLabels[status] }}</option></select></td></tr></tbody>
            </table>
          </div>

          <div v-if="active === 'users'" class="overflow-auto rounded-md border border-slate-200 bg-white shadow-sm">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-4">Nom</th><th class="p-4">E-mail</th><th class="p-4">Rôle</th><th class="p-4">Créé le</th></tr></thead>
              <tbody><tr v-for="user in users" :key="user.id" class="border-t border-slate-200"><td class="p-4 font-black">{{ user.name }}</td><td class="p-4">{{ user.email }}</td><td class="p-4"><span class="rounded bg-slate-100 px-3 py-1 text-xs font-black">{{ user.role === 'ADMIN' ? 'Administrateur' : 'Client' }}</span></td><td class="p-4">{{ new Date(user.createdAt).toLocaleDateString('fr-FR') }}</td></tr></tbody>
            </table>
          </div>
        </template>
      </main>
    </div>
  </section>
</template>
