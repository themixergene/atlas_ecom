<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import {
  BarChart3,
  Clipboard,
  ExternalLink,
  FileSearch,
  Lightbulb,
  Megaphone,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from '@lucide/vue';
import { api, getErrorMessage } from '../../api/client';
import { useToastStore } from '../../stores/toast';
import type {
  AdObjective,
  Competitor,
  CompetitorAd,
  CompetitorAdPlatform,
  CompetitorCreativeType,
  CompetitorDashboard,
  CompetitorInsight,
  CompetitorResearchLinks,
  GeneratedCompetitorCopy,
  Product,
} from '../../types';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

defineProps<{ products: Product[] }>();
const emit = defineEmits<{ 'use-insight': [insight: CompetitorInsight] }>();
const toast = useToastStore();
type Section = 'dashboard' | 'competitors' | 'ads' | 'analysis' | 'copies';
const section = ref<Section>('dashboard');
const loading = ref(true);
const working = ref(false);
const competitorModal = ref(false);
const adModal = ref(false);
const editingCompetitorId = ref<string | null>(null);
const selectedProductId = ref(0);
const dashboard = ref<CompetitorDashboard | null>(null);
const competitors = ref<Competitor[]>([]);
const ads = ref<CompetitorAd[]>([]);
const insights = ref<CompetitorInsight[]>([]);
const selectedInsight = ref<CompetitorInsight | null>(null);
const research = ref<CompetitorResearchLinks | null>(null);
const generatedCopies = ref<GeneratedCompetitorCopy[]>([]);
const platformCanvas = ref<HTMLCanvasElement | null>(null);
let platformChart: Chart | null = null;

const sections = [
  { key: 'dashboard' as Section, label: 'Tableau de bord', icon: BarChart3 },
  { key: 'competitors' as Section, label: 'Concurrents', icon: Search },
  { key: 'ads' as Section, label: 'Publicités concurrentes', icon: Megaphone },
  { key: 'analysis' as Section, label: 'Analyse produit', icon: FileSearch },
  { key: 'copies' as Section, label: 'Générateur de copies', icon: Lightbulb },
];
const platformLabels: Record<CompetitorAdPlatform, string> = {
  META: 'Meta',
  TIKTOK: 'TikTok',
  GOOGLE: 'Google',
  INSTAGRAM: 'Instagram',
  OTHER: 'Autre',
};
const creativeLabels: Record<CompetitorCreativeType, string> = {
  IMAGE: 'Image',
  VIDEO: 'Vidéo',
  CAROUSEL: 'Carrousel',
  TEXT: 'Texte',
};
const levelLabels = { LOW: 'Faible', MEDIUM: 'Moyenne', HIGH: 'Élevée' };
const statusLabels = { SAVED: 'Enregistrée', ANALYZED: 'Analysée', USED_AS_INSPIRATION: 'Utilisée comme inspiration' };
const objectiveLabels: Record<AdObjective, string> = { SALES: 'Ventes', MESSAGES: 'Messages', TRAFFIC: 'Trafic', AWARENESS: 'Notoriété' };

const competitorForm = reactive({
  name: '',
  websiteUrl: '',
  facebookPageUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  niche: '',
  country: 'Maroc',
  city: '',
  notes: '',
});
const adForm = reactive({
  competitorId: '',
  productId: 0,
  platform: 'META' as CompetitorAdPlatform,
  creativeType: 'VIDEO' as CompetitorCreativeType,
  adUrl: '',
  creativeUrl: '',
  headline: '',
  primaryText: '',
  description: '',
  callToAction: '',
  offer: '',
  priceMentioned: 0,
  landingPageUrl: '',
  inspirationNotes: '',
});
const copyForm = reactive({
  productId: 0,
  platform: 'META' as CompetitorAdPlatform,
  angle: 'Praticité et rapidité',
  offer: 'Livraison rapide',
  targetCity: 'Casablanca',
  audienceType: 'Acheteurs en ligne au Maroc',
  objective: 'SALES' as AdObjective,
});

function cleanPayload<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== '' && item !== 0));
}

function hasExactSource(ad: CompetitorAd) {
  if (!ad.adUrl || ad.adUrl.includes('example.com')) return false;
  const generatedResearchPatterns = [
    'facebook.com/ads/library/?',
    'tiktok.com/search?',
    'adstransparency.google.com/?',
    'google.com/search?',
  ];
  return !generatedResearchPatterns.some((pattern) => ad.adUrl!.includes(pattern));
}

function publicSourceUrl(ad: CompetitorAd) {
  if (hasExactSource(ad)) return ad.adUrl!;
  const query = encodeURIComponent(`${ad.competitor.name} ${ad.product?.name ?? ''}`.trim());
  if (ad.platform === 'META' || ad.platform === 'INSTAGRAM') {
    return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=MA&q=${query}&search_type=keyword_unordered`;
  }
  if (ad.platform === 'TIKTOK') {
    return `https://www.tiktok.com/search?q=${query}`;
  }
  if (ad.platform === 'GOOGLE') {
    return `https://adstransparency.google.com/?region=anywhere&query=${query}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${ad.competitor.name} publicité ${ad.product?.name ?? ''}`.trim())}`;
}

async function load() {
  loading.value = true;
  try {
    const [dashboardResponse, competitorsResponse, adsResponse, insightsResponse] = await Promise.all([
      api.get<CompetitorDashboard>('/admin/competitors/dashboard'),
      api.get<Competitor[]>('/admin/competitors'),
      api.get<CompetitorAd[]>('/admin/competitor-ads'),
      api.get<CompetitorInsight[]>('/admin/competitor-insights'),
    ]);
    dashboard.value = dashboardResponse.data;
    competitors.value = competitorsResponse.data;
    ads.value = adsResponse.data;
    insights.value = insightsResponse.data;
    loading.value = false;
    await nextTick();
    renderChart();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  platformChart?.destroy();
  if (!platformCanvas.value || !dashboard.value) return;
  platformChart = new Chart(platformCanvas.value, {
    type: 'bar',
    data: {
      labels: dashboard.value.platformDistribution.map((item) => platformLabels[item.platform]),
      datasets: [{ data: dashboard.value.platformDistribution.map((item) => item.count), backgroundColor: ['#0f766e', '#111827', '#2563eb', '#db2777', '#64748b'], borderRadius: 5 }],
    },
    options: { responsive: true, plugins: { tooltip: { enabled: true } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });
}

function openCompetitor(competitor?: Competitor) {
  editingCompetitorId.value = competitor?.id ?? null;
  Object.assign(competitorForm, {
    name: competitor?.name ?? '',
    websiteUrl: competitor?.websiteUrl ?? '',
    facebookPageUrl: competitor?.facebookPageUrl ?? '',
    instagramUrl: competitor?.instagramUrl ?? '',
    tiktokUrl: competitor?.tiktokUrl ?? '',
    niche: competitor?.niche ?? '',
    country: competitor?.country ?? 'Maroc',
    city: competitor?.city ?? '',
    notes: competitor?.notes ?? '',
  });
  competitorModal.value = true;
}

async function saveCompetitor() {
  working.value = true;
  try {
    const payload = cleanPayload({ ...competitorForm });
    if (editingCompetitorId.value) await api.patch(`/admin/competitors/${editingCompetitorId.value}`, payload);
    else await api.post('/admin/competitors', payload);
    competitorModal.value = false;
    toast.show('Concurrent enregistré.');
    await load();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    working.value = false;
  }
}

async function deleteCompetitor(id: string) {
  if (!window.confirm('Supprimer ce concurrent et toutes ses publicités enregistrées ?')) return;
  await api.delete(`/admin/competitors/${id}`);
  toast.show('Concurrent supprimé.');
  await load();
}

function openAd() {
  Object.assign(adForm, {
    competitorId: competitors.value[0]?.id ?? '',
    productId: selectedProductId.value || 0,
    platform: 'META',
    creativeType: 'VIDEO',
    adUrl: '',
    creativeUrl: '',
    headline: '',
    primaryText: '',
    description: '',
    callToAction: '',
    offer: '',
    priceMentioned: 0,
    landingPageUrl: '',
    inspirationNotes: '',
  });
  adModal.value = true;
}

async function saveAd() {
  working.value = true;
  try {
    await api.post('/admin/competitor-ads', cleanPayload({ ...adForm }));
    adModal.value = false;
    toast.show('Publicité concurrente enregistrée.');
    await load();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    working.value = false;
  }
}

async function analyzeAd(id: string) {
  working.value = true;
  try {
    await api.post(`/admin/competitor-ads/${id}/analyze`);
    toast.show('Publicité analysée.');
    await load();
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    working.value = false;
  }
}

async function deleteAd(id: string) {
  if (!window.confirm('Supprimer cette publicité du swipe file ?')) return;
  await api.delete(`/admin/competitor-ads/${id}`);
  toast.show('Publicité supprimée.');
  await load();
}

async function selectProduct(productId: number) {
  selectedProductId.value = productId;
  selectedInsight.value = insights.value.find((item) => item.productId === productId) ?? null;
  research.value = productId ? (await api.get<CompetitorResearchLinks>(`/admin/competitors/research-links/${productId}`)).data : null;
}

async function generateInsight() {
  if (!selectedProductId.value) return;
  working.value = true;
  try {
    selectedInsight.value = (await api.post<CompetitorInsight>('/admin/competitor-insights/generate', { productId: selectedProductId.value })).data;
    toast.show('Analyse concurrentielle générée.');
    await load();
    selectedInsight.value = insights.value.find((item) => item.productId === selectedProductId.value) ?? selectedInsight.value;
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    working.value = false;
  }
}

async function generateCopies() {
  working.value = true;
  try {
    const { data } = await api.post<{ variations: GeneratedCompetitorCopy[] }>('/admin/competitors/generate-ad-copy', copyForm);
    generatedCopies.value = data.variations;
  } catch (error) {
    toast.show(getErrorMessage(error), 'error');
  } finally {
    working.value = false;
  }
}

async function copyText(copy: GeneratedCompetitorCopy) {
  await navigator.clipboard.writeText(`${copy.headline}\n\n${copy.primaryText}\n\n${copy.description}\n\nCTA : ${copy.callToAction}`);
  toast.show('Copie publicitaire copiée.');
}

onMounted(load);
</script>

<template>
  <div class="grid gap-5">
    <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      <button v-for="item in sections" :key="item.key" class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black" :class="section === item.key ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'" @click="section = item.key; nextTick(renderChart)">
        <component :is="item.icon" class="h-4 w-4" /> {{ item.label }}
      </button>
    </div>

    <div class="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <ShieldCheck class="mt-0.5 h-5 w-5 shrink-0" />
      <p><strong>Recherche éthique :</strong> ce module enregistre uniquement des informations publiques collectées manuellement. Il ne scrape aucun site, ne contourne aucune protection et n’accède à aucune donnée privée.</p>
    </div>

    <div v-if="loading" class="rounded-md border border-slate-200 bg-white p-10 text-center font-black">Chargement de la veille concurrentielle...</div>

    <template v-else>
      <div v-if="section === 'dashboard' && dashboard" class="grid gap-5">
        <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <div v-for="metric in [
            { label: 'Concurrents', value: dashboard.totalCompetitors },
            { label: 'Publicités', value: dashboard.totalAds },
            { label: 'Produits analysés', value: dashboard.analyzedProducts },
            { label: 'Opportunités', value: dashboard.opportunitiesDetected },
            { label: 'Concurrence moyenne', value: levelLabels[dashboard.averageCompetitionLevel] },
            { label: 'CTA fréquent', value: dashboard.mostUsedCta },
            { label: 'Hook fréquent', value: dashboard.mostFrequentHook }
          ]" :key="metric.label" class="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs font-black uppercase text-slate-500">{{ metric.label }}</p>
            <p class="mt-3 break-words text-lg font-black">{{ metric.value }}</p>
          </div>
        </div>
        <div class="grid gap-5 xl:grid-cols-[1fr_.7fr]">
          <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="font-black">Répartition des publicités par plateforme</h3>
            <canvas ref="platformCanvas" class="mt-5 max-h-80"></canvas>
          </div>
          <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="font-black">Lecture rapide</h3>
            <dl class="mt-5 grid gap-4 text-sm">
              <div><dt class="font-black text-slate-500">Publicités analysées</dt><dd class="mt-1 text-2xl font-black">{{ dashboard.analyzedAds }}</dd></div>
              <div><dt class="font-black text-slate-500">Prochaine action</dt><dd class="mt-1">Documenter les créatifs publics, analyser leurs promesses puis tester un angle différenciant.</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div v-if="section === 'competitors'" class="grid gap-4">
        <div class="flex justify-end"><button class="btn-primary rounded-md" @click="openCompetitor()"><Plus class="h-4 w-4" /> Ajouter un concurrent</button></div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="competitor in competitors" :key="competitor.id" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div><h3 class="text-lg font-black">{{ competitor.name }}</h3><p class="mt-1 text-sm text-slate-500">{{ competitor.niche || 'Niche non renseignée' }}</p></div>
              <span class="rounded bg-teal-50 px-2 py-1 text-xs font-black text-teal-800">{{ competitor._count?.ads ?? 0 }} pubs</span>
            </div>
            <p class="mt-4 text-sm text-slate-600">{{ competitor.city || 'Ville non renseignée' }} · {{ competitor.country || 'Pays non renseigné' }}</p>
            <p class="mt-3 line-clamp-3 text-sm text-slate-600">{{ competitor.notes || 'Aucune note.' }}</p>
            <div class="mt-4 flex flex-wrap gap-3 text-xs font-black text-teal-700">
              <a v-if="competitor.websiteUrl" :href="competitor.websiteUrl" target="_blank">Site <ExternalLink class="inline h-3 w-3" /></a>
              <a v-if="competitor.facebookPageUrl" :href="competitor.facebookPageUrl" target="_blank">Facebook</a>
              <a v-if="competitor.instagramUrl" :href="competitor.instagramUrl" target="_blank">Instagram</a>
              <a v-if="competitor.tiktokUrl" :href="competitor.tiktokUrl" target="_blank">TikTok</a>
            </div>
            <div class="mt-5 flex gap-3"><button class="flex items-center gap-1 text-sm font-black text-teal-700" @click="openCompetitor(competitor)"><Pencil class="h-4 w-4" /> Modifier</button><button class="flex items-center gap-1 text-sm font-black text-red-600" @click="deleteCompetitor(competitor.id)"><Trash2 class="h-4 w-4" /> Supprimer</button></div>
          </article>
        </div>
      </div>

      <div v-if="section === 'ads'" class="grid gap-4">
        <div class="flex justify-end"><button class="btn-primary rounded-md" :disabled="!competitors.length" @click="openAd"><Plus class="h-4 w-4" /> Enregistrer une publicité</button></div>
        <div class="grid gap-4 xl:grid-cols-2">
          <article v-for="ad in ads" :key="ad.id" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div><p class="text-xs font-black uppercase text-teal-700">{{ platformLabels[ad.platform] }} · {{ creativeLabels[ad.creativeType] }}</p><h3 class="mt-2 text-lg font-black">{{ ad.headline || 'Publicité sans titre' }}</h3><p class="mt-1 text-sm text-slate-500">{{ ad.competitor.name }} · {{ ad.product?.name || 'Produit non lié' }}</p></div>
              <span class="rounded bg-slate-100 px-3 py-1 text-xs font-black">{{ statusLabels[ad.status] }}</span>
            </div>
            <p class="mt-4 line-clamp-3 text-sm leading-6 text-slate-700">{{ ad.primaryText || 'Texte principal non renseigné.' }}</p>
            <div class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p><strong>Hook :</strong> {{ ad.detectedHook || 'À analyser' }}</p>
              <p><strong>Offre :</strong> {{ ad.offer || 'Non renseignée' }}</p>
              <p><strong>CTA :</strong> {{ ad.callToAction || 'Non renseigné' }}</p>
              <p><strong>Angle :</strong> {{ ad.detectedAngle || 'À analyser' }}</p>
            </div>
            <div v-if="ad.strengths || ad.weaknesses" class="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
              <p><strong class="text-emerald-700">Forces :</strong> {{ ad.strengths }}</p>
              <p><strong class="text-red-700">Faiblesses :</strong> {{ ad.weaknesses }}</p>
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <button class="btn-secondary rounded-md px-3 py-2 text-xs" :disabled="working" @click="analyzeAd(ad.id)">Analyser</button>
              <a
                class="btn-secondary rounded-md px-3 py-2 text-xs"
                :href="publicSourceUrl(ad)"
                target="_blank"
                rel="noopener noreferrer"
                :title="hasExactSource(ad) ? 'Ouvre le lien public exact enregistré pour cette publicité' : `Ouvre une recherche publique sur ${platformLabels[ad.platform]}`"
              >
                Ouvrir la source
                <ExternalLink class="h-3 w-3" />
              </a>
              <span class="self-center text-[11px] font-bold text-slate-500">
                {{ hasExactSource(ad) ? 'Lien exact' : 'Recherche publique' }}
              </span>
              <button class="px-3 py-2 text-xs font-black text-red-600" @click="deleteAd(ad.id)">Supprimer</button>
            </div>
          </article>
        </div>
      </div>

      <div v-if="section === 'analysis'" class="grid gap-5">
        <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div class="grid gap-3 md:grid-cols-[1fr_auto]">
            <select class="field rounded-md" :value="selectedProductId" @change="selectProduct(Number(($event.target as HTMLSelectElement).value))">
              <option :value="0">Sélectionner un produit</option>
              <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
            </select>
            <button class="btn-primary rounded-md" :disabled="!selectedProductId || working" @click="generateInsight">{{ working ? 'Analyse...' : 'Générer l’analyse concurrentielle' }}</button>
          </div>
        </div>
        <div v-if="research" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="font-black">Liens de recherche publique</h3>
          <p class="mt-2 text-sm text-slate-500">{{ research.ethicalNotice }}</p>
          <div class="mt-4 flex flex-wrap gap-2"><a v-for="link in research.links" :key="link.platform" class="btn-secondary rounded-md px-3 py-2 text-xs" :href="link.url" target="_blank">{{ link.platform }} <ExternalLink class="h-3 w-3" /></a></div>
        </div>
        <div v-if="selectedInsight" class="grid gap-5">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-md border border-slate-200 bg-white p-5"><p class="text-xs font-black uppercase text-slate-500">Score d’opportunité</p><p class="mt-3 text-4xl font-black text-teal-700">{{ selectedInsight.opportunityScore }}/100</p></div>
            <div class="rounded-md border border-slate-200 bg-white p-5"><p class="text-xs font-black uppercase text-slate-500">Niveau de concurrence</p><p class="mt-3 text-2xl font-black">{{ levelLabels[selectedInsight.competitionLevel] }}</p></div>
            <div class="rounded-md border border-slate-200 bg-white p-5"><p class="text-xs font-black uppercase text-slate-500">Publicités liées</p><p class="mt-3 text-2xl font-black">{{ ads.filter((ad) => ad.productId === selectedInsight?.productId).length }}</p></div>
          </div>
          <div class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="text-lg font-black">Synthèse et positionnement</h3>
            <p class="mt-3 text-sm leading-6 text-slate-700">{{ selectedInsight.summary }}</p>
            <dl class="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div><dt class="font-black">Hooks fréquents</dt><dd class="mt-1 text-slate-600">{{ selectedInsight.commonHooks }}</dd></div>
              <div><dt class="font-black">Offres fréquentes</dt><dd class="mt-1 text-slate-600">{{ selectedInsight.commonOffers }}</dd></div>
              <div><dt class="font-black">Faiblesses concurrentes</dt><dd class="mt-1 text-slate-600">{{ selectedInsight.competitorWeaknesses }}</dd></div>
              <div><dt class="font-black">Positionnement recommandé</dt><dd class="mt-1 text-slate-600">{{ selectedInsight.recommendedPositioning }}</dd></div>
            </dl>
            <button class="btn-primary mt-5 rounded-md" @click="emit('use-insight', selectedInsight)">Utiliser dans Stratégie publicitaire</button>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <article v-for="copy in selectedInsight.recommendedAdCopies" :key="copy.headline" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <p class="text-xs font-black uppercase text-teal-700">{{ copy.angle }}</p><h4 class="mt-2 text-lg font-black">{{ copy.headline }}</h4><p class="mt-3 text-sm leading-6 text-slate-700">{{ copy.primaryText }}</p><p class="mt-3 text-sm"><strong>CTA :</strong> {{ copy.callToAction }}</p><p class="mt-2 text-sm"><strong>Créatif :</strong> {{ copy.creativeIdea }}</p>
            </article>
          </div>
        </div>
      </div>

      <div v-if="section === 'copies'" class="grid gap-5">
        <form class="grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4" @submit.prevent="generateCopies">
          <select v-model.number="copyForm.productId" class="field rounded-md" required><option :value="0" disabled>Produit</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select>
          <select v-model="copyForm.platform" class="field rounded-md"><option v-for="(_, platform) in platformLabels" :key="platform" :value="platform">{{ platformLabels[platform] }}</option></select>
          <input v-model="copyForm.angle" class="field rounded-md" placeholder="Angle" required />
          <input v-model="copyForm.offer" class="field rounded-md" placeholder="Offre" required />
          <input v-model="copyForm.targetCity" class="field rounded-md" placeholder="Ville ciblée" required />
          <input v-model="copyForm.audienceType" class="field rounded-md" placeholder="Type d’audience" required />
          <select v-model="copyForm.objective" class="field rounded-md"><option v-for="(_, objective) in objectiveLabels" :key="objective" :value="objective">{{ objectiveLabels[objective] }}</option></select>
          <button class="btn-primary rounded-md" :disabled="working">{{ working ? 'Génération...' : 'Générer 5 copies' }}</button>
        </form>
        <div class="grid gap-4 xl:grid-cols-2">
          <article v-for="copy in generatedCopies" :key="copy.type" class="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-black uppercase text-teal-700">{{ copy.type }}</p><h3 class="mt-2 text-xl font-black">{{ copy.headline }}</h3></div><button class="grid h-10 w-10 place-items-center rounded-md border border-slate-200" title="Copier" @click="copyText(copy)"><Clipboard class="h-4 w-4" /></button></div>
            <p class="mt-4 text-sm leading-6 text-slate-700">{{ copy.primaryText }}</p>
            <p class="mt-3 text-sm text-slate-500">{{ copy.description }}</p>
            <div class="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm"><p><strong>CTA :</strong> {{ copy.callToAction }}</p><p><strong>Idée créative :</strong> {{ copy.creativeIdea }}</p><p><strong>Pourquoi cela fonctionne :</strong> {{ copy.whyItWorks }}</p></div>
          </article>
        </div>
      </div>
    </template>

    <div v-if="competitorModal" class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4">
      <form class="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md bg-white p-6 shadow-xl" @submit.prevent="saveCompetitor">
        <div class="flex items-center justify-between"><h2 class="text-xl font-black">{{ editingCompetitorId ? 'Modifier le concurrent' : 'Ajouter un concurrent' }}</h2><button type="button" @click="competitorModal = false"><X class="h-5 w-5" /></button></div>
        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <input v-model="competitorForm.name" class="field rounded-md md:col-span-2" placeholder="Nom" required />
          <input v-model="competitorForm.websiteUrl" class="field rounded-md" type="url" placeholder="Site web" />
          <input v-model="competitorForm.facebookPageUrl" class="field rounded-md" type="url" placeholder="Page Facebook" />
          <input v-model="competitorForm.instagramUrl" class="field rounded-md" type="url" placeholder="Instagram" />
          <input v-model="competitorForm.tiktokUrl" class="field rounded-md" type="url" placeholder="TikTok" />
          <input v-model="competitorForm.niche" class="field rounded-md" placeholder="Niche" />
          <input v-model="competitorForm.country" class="field rounded-md" placeholder="Pays" />
          <input v-model="competitorForm.city" class="field rounded-md" placeholder="Ville" />
          <textarea v-model="competitorForm.notes" class="field min-h-28 rounded-md md:col-span-2" placeholder="Notes"></textarea>
        </div>
        <button class="btn-primary mt-5 w-full rounded-md" :disabled="working">Enregistrer</button>
      </form>
    </div>

    <div v-if="adModal" class="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4">
      <form class="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-md bg-white p-6 shadow-xl" @submit.prevent="saveAd">
        <div class="flex items-center justify-between"><h2 class="text-xl font-black">Enregistrer une publicité publique</h2><button type="button" @click="adModal = false"><X class="h-5 w-5" /></button></div>
        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <select v-model="adForm.competitorId" class="field rounded-md" required><option v-for="competitor in competitors" :key="competitor.id" :value="competitor.id">{{ competitor.name }}</option></select>
          <select v-model.number="adForm.productId" class="field rounded-md"><option :value="0">Produit non lié</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select>
          <select v-model="adForm.platform" class="field rounded-md"><option v-for="(_, platform) in platformLabels" :key="platform" :value="platform">{{ platformLabels[platform] }}</option></select>
          <select v-model="adForm.creativeType" class="field rounded-md"><option v-for="(_, type) in creativeLabels" :key="type" :value="type">{{ creativeLabels[type] }}</option></select>
          <input v-model="adForm.adUrl" class="field rounded-md" type="url" placeholder="URL publique de la publicité" />
          <input v-model="adForm.creativeUrl" class="field rounded-md" type="url" placeholder="URL du créatif" />
          <input v-model="adForm.headline" class="field rounded-md md:col-span-2" placeholder="Titre" />
          <textarea v-model="adForm.primaryText" class="field min-h-28 rounded-md md:col-span-2" placeholder="Texte principal"></textarea>
          <textarea v-model="adForm.description" class="field rounded-md md:col-span-2" placeholder="Description"></textarea>
          <input v-model="adForm.callToAction" class="field rounded-md" placeholder="Appel à l’action" />
          <input v-model="adForm.offer" class="field rounded-md" placeholder="Offre" />
          <input v-model.number="adForm.priceMentioned" class="field rounded-md" type="number" min="0" placeholder="Prix mentionné" />
          <input v-model="adForm.landingPageUrl" class="field rounded-md" type="url" placeholder="Page de destination" />
          <textarea v-model="adForm.inspirationNotes" class="field min-h-24 rounded-md md:col-span-2" placeholder="Notes d’inspiration et source manuelle"></textarea>
        </div>
        <button class="btn-primary mt-5 w-full rounded-md" :disabled="working">Enregistrer dans le swipe file</button>
      </form>
    </div>
  </div>
</template>
