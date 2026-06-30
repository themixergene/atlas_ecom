import {
  AdCampaignStatus,
  AdObjective,
  CompetitionLevel,
  CompetitorAdPlatform,
  CompetitorAdStatus,
  CompetitorCreativeType,
  CreativeType,
  OrderStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const categories = [
  { name: 'Smartphones', slug: 'smartphones' },
  { name: 'Ordinateurs portables', slug: 'laptops' },
  { name: 'Audio', slug: 'audio' },
  { name: 'Accessoires', slug: 'accessories' },
  { name: 'Maison connectée', slug: 'home-tech' },
];

const images = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=1200&q=80',
];

const catalog = [
  ['smartphones', 'Nova X12 5G', 3299, 3699, 16, 'Écran AMOLED 120 Hz, 256 Go et caméra stabilisée pour une expérience fluide au quotidien.'],
  ['laptops', 'AtlasBook Air 14', 7490, 8190, 9, 'Ordinateur fin et léger avec écran 14 pouces, 16 Go de mémoire et autonomie longue durée.'],
  ['audio', 'Casque Pulse ANC Pro', 899, 1099, 21, 'Casque Bluetooth avec réduction de bruit active, son équilibré et 35 heures d’autonomie.'],
  ['accessories', 'Chargeur GaN 65W Trio', 349, 449, 28, 'Chargeur compact à trois ports pour smartphone, tablette et ordinateur portable.'],
  ['home-tech', 'Caméra Maison Secure 2K', 599, 749, 12, 'Caméra Wi-Fi 2K avec vision nocturne, détection de mouvement et alertes mobiles.'],
  ['smartphones', 'Nova Lite 8', 1899, 2199, 24, 'Smartphone polyvalent avec écran 90 Hz, batterie 5000 mAh et double SIM.'],
  ['laptops', 'ProBook Ryzen 15', 8290, 8990, 4, 'PC portable performant avec processeur Ryzen, SSD 512 Go et clavier rétroéclairé.'],
  ['audio', 'Écouteurs AirBeat Mini', 449, 549, 35, 'Écouteurs sans fil compacts avec appels clairs, mode jeu et boîtier USB-C.'],
  ['accessories', 'Power Bank Atlas 20000', 499, 599, 18, 'Batterie externe haute capacité avec charge rapide USB-C et indicateur numérique.'],
  ['home-tech', 'Ampoule Connectée Color E27', 149, 199, 42, 'Ampoule Wi-Fi multicolore contrôlable depuis le téléphone et compatible avec les routines.'],
  ['smartphones', 'Orion Pro Max 256 Go', 4599, 5099, 11, 'Smartphone premium avec grand écran OLED, caméra 50 MP et recharge ultra rapide.'],
  ['laptops', 'StudyBook 14 Essential', 4890, 5390, 14, 'Ordinateur fiable pour études et bureautique avec SSD rapide et webcam Full HD.'],
  ['audio', 'Enceinte Nomad Bass', 699, 849, 19, 'Enceinte Bluetooth résistante aux éclaboussures avec basses puissantes et autonomie 18 heures.'],
  ['accessories', 'Montre Active Fit 2', 649, 799, 4, 'Montre connectée avec suivi santé, notifications, modes sport et autonomie de 7 jours.'],
  ['home-tech', 'Prise Connectée Energy', 229, 299, 26, 'Prise Wi-Fi avec programmation, suivi de consommation et contrôle à distance.'],
  ['smartphones', 'Atlas A5 128 Go', 1499, 1749, 30, 'Smartphone accessible avec grande batterie, stockage 128 Go et lecteur d’empreintes.'],
  ['laptops', 'CreatorBook 16 Studio', 11990, 12990, 6, 'Station mobile 16 pouces dédiée à la création, au montage et au multitâche avancé.'],
  ['audio', 'Micro USB Studio Voice', 549, 699, 15, 'Microphone USB prêt à l’emploi pour streaming, réunions et création de contenu.'],
  ['accessories', 'Hub USB-C 8-en-1', 429, 529, 22, 'Hub aluminium avec HDMI, USB, lecteur de cartes et alimentation USB-C.'],
  ['home-tech', 'Sonnette Vidéo DoorView', 899, 1099, 8, 'Sonnette connectée avec vidéo HD, audio bidirectionnel et alertes instantanées.'],
  ['smartphones', 'Nova Fold Mini', 6799, 7299, 7, 'Smartphone pliable compact avec écran lumineux, design premium et appareil photo polyvalent.'],
  ['laptops', 'BusinessBook 13', 8990, 9690, 10, 'Ultraportable professionnel avec châssis robuste, sécurité renforcée et excellente autonomie.'],
] as const;

const customerProfiles = [
  ['Yasmine El Amrani', '+212661248735', 'Casablanca', '18 rue Al Fourat, Maarif'],
  ['Mehdi Bennis', '+212672905184', 'Rabat', '42 avenue Fal Ould Oumeir, Agdal'],
  ['Salma Alaoui', '+212648317206', 'Marrakech', 'Résidence Al Qods, Guéliz'],
  ['Omar Tazi', '+212690442158', 'Tanger', '11 boulevard Pasteur'],
  ['Imane Chraibi', '+212635781904', 'Fès', '27 rue Lalla Amina, Ville Nouvelle'],
  ['Ayoub Bennani', '+212684209573', 'Agadir', 'Résidence Tifaouine, Hay Mohammadi'],
  ['Nadia Lahlou', '+212659173842', 'Casablanca', '6 rue Socrate, Racine'],
  ['Hamza Idrissi', '+212676314905', 'Rabat', '23 avenue Annakhil, Hay Riad'],
  ['Sara El Fassi', '+212642890371', 'Marrakech', 'Appartement 8, route de Casablanca'],
  ['Anas Kabbaj', '+212688512490', 'Tanger', '15 rue de la Liberté'],
  ['Meryem Zahraoui', '+212631409827', 'Fès', 'Lotissement Al Amal, Narjiss'],
  ['Zakaria Amrani', '+212697205314', 'Agadir', 'Bloc C, Cité Dakhla'],
  ['Lina Berrada', '+212653814762', 'Casablanca', '29 rue Abou Al Waqt, Bourgogne'],
  ['Rachid El Mansouri', '+212675920438', 'Rabat', '10 rue Jabal Tazeka, Agdal'],
  ['Hajar Naciri', '+212640728915', 'Marrakech', 'Résidence Andalous, Hivernage'],
  ['Ilyas Skalli', '+212689154320', 'Tanger', '8 avenue Moulay Youssef'],
  ['Sofia Lamrani', '+212636842701', 'Fès', '12 avenue Hassan II'],
  ['Youssef Ait Lahcen', '+212698471235', 'Agadir', 'Immeuble 4, avenue des FAR'],
] as const;

const customerAccounts = [
  ['Yasmine El Amrani', 'yasmine.amrani@example.com'],
  ['Mehdi Bennis', 'mehdi.bennis@example.com'],
  ['Salma Alaoui', 'salma.alaoui@example.com'],
  ['Omar Tazi', 'omar.tazi@example.com'],
  ['Imane Chraibi', 'imane.chraibi@example.com'],
  ['Ayoub Bennani', 'ayoub.bennani@example.com'],
  ['Nadia Lahlou', 'nadia.lahlou@example.com'],
  ['Hamza Idrissi', 'hamza.idrissi@example.com'],
] as const;

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123456', 12),
      role: Role.ADMIN,
    },
  });
  const customerPassword = await bcrypt.hash('Client123456', 12);
  const savedCustomerUsers = await Promise.all(
    customerAccounts.map(([name, email]) =>
      prisma.user.upsert({
        where: { email },
        update: { name, role: Role.USER },
        create: { name, email, password: customerPassword, role: Role.USER },
      }),
    ),
  );

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const savedCategories = await prisma.category.findMany();
  const categoryBySlug = new Map(savedCategories.map((category) => [category.slug, category]));
  const products = catalog.map(([categorySlug, name, price, comparePrice, stock, shortDescription], index) => {
    const category = categoryBySlug.get(categorySlug);
    if (!category) throw new Error(`Catégorie introuvable : ${categorySlug}`);
    const number = index + 1;
    return {
      name,
      slug: `${category.slug}-essential-${number}`,
      description:
        `${shortDescription} Produit contrôlé avant expédition, disponible avec confirmation rapide sur WhatsApp et paiement à la livraison partout au Maroc.`,
      shortDescription,
      price,
      comparePrice,
      stock,
      image: images[index % images.length],
      galleryImages: [images[index % images.length], images[(index + 1) % images.length]],
      categoryId: category.id,
      featured: number <= 8,
    };
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  const savedProducts = await prisma.product.findMany({ include: { category: true }, orderBy: { id: 'asc' } });
  const demoPhones = customerProfiles.map((profile) => profile[1]);
  const legacyDemoOrders = await prisma.order.findMany({
    where: { customerName: { startsWith: 'Client démo ' } },
    orderBy: { createdAt: 'asc' },
  });
  for (const [index, order] of legacyDemoOrders.entries()) {
    const profile = customerProfiles[index % customerProfiles.length];
    await prisma.order.update({
      where: { id: order.id },
      data: { customerName: profile[0], phone: profile[1], city: profile[2], address: profile[3] },
    });
  }
  const demoOrderCount = await prisma.order.count({
    where: { phone: { in: [...demoPhones] } },
  });
  if (demoOrderCount === 0 && savedProducts.length) {
    const statuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.SHIPPED];
    for (let index = 0; index < 18; index += 1) {
      const first = savedProducts[index % savedProducts.length];
      const second = savedProducts[(index + 3) % savedProducts.length];
      const firstQuantity = 1 + (index % 3);
      const secondQuantity = 1;
      const total = Number(first.price) * firstQuantity + Number(second.price) * secondQuantity;
      await prisma.order.create({
        data: {
          customerName: `Client démo ${index + 1}`,
          userId: savedCustomerUsers[index % savedCustomerUsers.length].id,
          phone: customerProfiles[index][1],
          city: customerProfiles[index][2],
          address: customerProfiles[index][3],
          total,
          status: statuses[index % statuses.length],
          createdAt: new Date(2026, index % 6, 4 + index),
          items: {
            create: [
              { productId: first.id, quantity: firstQuantity, price: first.price },
              { productId: second.id, quantity: secondQuantity, price: second.price },
            ],
          },
        },
      });
    }
  }

  const demoOrders = await prisma.order.findMany({
    where: { phone: { in: [...demoPhones] } },
    orderBy: { createdAt: 'asc' },
    include: { items: { include: { product: true } } },
  });
  for (const [index, order] of demoOrders.entries()) {
    const profile = customerProfiles[index % customerProfiles.length];
    const total = order.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    await prisma.$transaction([
      ...order.items.map((item) =>
        prisma.orderItem.update({
          where: { id: item.id },
          data: { price: item.product.price },
        }),
      ),
      prisma.order.update({
        where: { id: order.id },
        data: {
          customerName: profile[0],
          userId: savedCustomerUsers[index % savedCustomerUsers.length].id,
          phone: profile[1],
          city: profile[2],
          address: profile[3],
          notes: index % 4 === 0 ? 'Merci d’appeler avant la livraison.' : null,
          total,
        },
      }),
    ]);
  }

  const campaignCount = await prisma.adCampaign.count();
  if (savedProducts[0]) {
    await prisma.adCampaign.updateMany({
      where: { strategy: 'Start with a small testing budget for 3 days. If cost per message is good, increase budget gradually.' },
      data: {
        name: `${savedProducts[0].name} - Campagne test`,
        adCopy: `Découvrez ${savedProducts[0].name} avec livraison rapide. Commandez maintenant via WhatsApp.`,
        strategy: 'Commencez avec un petit budget test pendant 3 jours. Si le coût par message est satisfaisant, augmentez progressivement le budget.',
      },
    });
  }
  if (campaignCount === 0 && savedProducts[0]) {
    await prisma.adCampaign.create({
      data: {
        productId: savedProducts[0].id,
        name: `${savedProducts[0].name} - Campagne test`,
        objective: AdObjective.MESSAGES,
        budget: 250,
        city: 'Casablanca',
        ageMin: 18,
        ageMax: 35,
        gender: 'All',
        creativeType: CreativeType.VIDEO,
        creativeUrl: savedProducts[0].image,
        adCopy: `Découvrez ${savedProducts[0].name} avec livraison rapide. Commandez maintenant via WhatsApp.`,
        strategy: 'Commencez avec un petit budget test pendant 3 jours. Si le coût par message est satisfaisant, augmentez progressivement le budget.',
        status: AdCampaignStatus.DRAFT,
      },
    });
  }
  const demoCampaign = await prisma.adCampaign.findFirst({
    where: { OR: [{ name: { contains: 'Campagne test' } }, { name: { contains: 'Launch Test' } }] },
    orderBy: { id: 'asc' },
  });
  if (demoCampaign && savedProducts[0]) {
    await prisma.adCampaign.update({
      where: { id: demoCampaign.id },
      data: {
        productId: savedProducts[0].id,
        name: `${savedProducts[0].name} - Acquisition WhatsApp`,
        adCopy: `${savedProducts[0].name} est disponible avec livraison rapide partout au Maroc. Écrivez-nous sur WhatsApp pour confirmer votre commande.`,
        strategy: 'Tester deux vidéos verticales pendant trois jours à Casablanca et Rabat. Conserver le meilleur hook, puis augmenter le budget de 20 % si le coût par message reste rentable.',
      },
    });
  }

  const competitorCount = await prisma.competitor.count();
  if (competitorCount === 0 && savedProducts.length >= 5) {
    const competitors = await Promise.all([
      prisma.competitor.create({
        data: {
          name: 'Casa Tech Market',
          websiteUrl: 'https://example.com/casa-tech',
          facebookPageUrl: 'https://www.facebook.com/',
          instagramUrl: 'https://www.instagram.com/',
          niche: 'Électronique grand public',
          country: 'Maroc',
          city: 'Casablanca',
          notes: 'Positionnement prix et livraison rapide.',
        },
      }),
      prisma.competitor.create({
        data: {
          name: 'Digital Souk',
          websiteUrl: 'https://example.com/digital-souk',
          tiktokUrl: 'https://www.tiktok.com/',
          instagramUrl: 'https://www.instagram.com/',
          niche: 'Produits tendance',
          country: 'Maroc',
          city: 'Rabat',
          notes: 'Créatifs vidéo courts et offres limitées.',
        },
      }),
      prisma.competitor.create({
        data: {
          name: 'Maroc Smart Deals',
          websiteUrl: 'https://example.com/smart-deals',
          facebookPageUrl: 'https://www.facebook.com/',
          niche: 'Accessoires et maison connectée',
          country: 'Maroc',
          city: 'Marrakech',
          notes: 'Communication orientée promotions.',
        },
      }),
      prisma.competitor.create({
        data: {
          name: 'Urban Gadget',
          websiteUrl: 'https://example.com/urban-gadget',
          instagramUrl: 'https://www.instagram.com/',
          tiktokUrl: 'https://www.tiktok.com/',
          niche: 'Gadgets premium',
          country: 'Maroc',
          city: 'Tanger',
          notes: 'Mise en scène lifestyle et qualité premium.',
        },
      }),
      prisma.competitor.create({
        data: {
          name: 'Tech Express Maroc',
          websiteUrl: 'https://example.com/tech-express',
          facebookPageUrl: 'https://www.facebook.com/',
          niche: 'Électronique avec livraison nationale',
          country: 'Maroc',
          city: 'Agadir',
          notes: 'Promesse principale centrée sur la rapidité.',
        },
      }),
    ]);

    const hooks = ['Livraison rapide', 'Offre limitée', 'Solution pratique', 'Prix réduit', 'Qualité premium'];
    const ctas = ['Commander maintenant', 'Envoyer un message', 'Profiter de l’offre', 'Acheter aujourd’hui'];
    const platforms = [CompetitorAdPlatform.META, CompetitorAdPlatform.TIKTOK, CompetitorAdPlatform.GOOGLE];
    const creativeTypes = [CompetitorCreativeType.VIDEO, CompetitorCreativeType.IMAGE, CompetitorCreativeType.CAROUSEL];
    const offers = ['Livraison gratuite', 'Remise de 20 %', 'Paiement à la livraison', 'Stock limité', 'Garantie satisfaction'];
    const publicResearchUrl = (platform: CompetitorAdPlatform, competitorName: string, productName: string) => {
      const query = encodeURIComponent(`${competitorName} ${productName}`);
      if (platform === CompetitorAdPlatform.META || platform === CompetitorAdPlatform.INSTAGRAM) {
        return `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=MA&q=${query}&search_type=keyword_unordered`;
      }
      if (platform === CompetitorAdPlatform.TIKTOK) return `https://www.tiktok.com/search?q=${query}`;
      if (platform === CompetitorAdPlatform.GOOGLE) return `https://adstransparency.google.com/?region=anywhere&query=${query}`;
      return `https://www.google.com/search?q=${query}`;
    };
    for (let index = 0; index < 15; index += 1) {
      const competitor = competitors[index % competitors.length];
      const product = savedProducts[index % 5];
      const hook = hooks[index % hooks.length];
      const offer = offers[index % offers.length];
      const platform = platforms[index % platforms.length];
      await prisma.competitorAd.create({
        data: {
          competitorId: competitor.id,
          productId: product.id,
          platform,
          creativeType: creativeTypes[index % creativeTypes.length],
          adUrl: publicResearchUrl(platform, competitor.name, product.name),
          creativeUrl: product.image,
          headline: `${hook} pour ${product.name}`,
          primaryText: `${hook}. Découvrez ${product.name} avec ${offer.toLowerCase()}. Avis clients satisfaits et commande simple au Maroc.`,
          description: 'Une solution pratique avec service rapide.',
          callToAction: ctas[index % ctas.length],
          offer,
          priceMentioned: Number(product.price) + (index % 3) * 30,
          landingPageUrl: 'https://example.com/product',
          detectedHook: hook,
          detectedPainPoint: index % 2 === 0 ? 'Le client veut gagner du temps et commander simplement.' : 'Le client cherche un prix rassurant et une livraison fiable.',
          detectedAngle: index % 2 === 0 ? 'Praticité et rapidité' : 'Prix et réassurance',
          trustElement: 'Avis clients et paiement à la livraison',
          urgencyElement: index % 3 === 0 ? 'Stock limité' : 'Aucune urgence forte détectée',
          strengths: 'Message clair, offre visible, CTA direct',
          weaknesses: index % 2 === 0 ? 'Peu de détails techniques' : 'Manque de différenciation',
          inspirationNotes: 'Information collectée manuellement depuis une publicité publique.',
          status: CompetitorAdStatus.ANALYZED,
        },
      });
    }

    for (let index = 0; index < 3; index += 1) {
      const product = savedProducts[index];
      await prisma.competitorInsight.create({
        data: {
          productId: product.id,
          summary: `Analyse de cinq publicités concurrentes publiques pour ${product.name}.`,
          commonHooks: 'Livraison rapide, offre limitée, solution pratique',
          commonOffers: 'Livraison gratuite, remise de 20 %, paiement à la livraison',
          commonCallToActions: 'Commander maintenant, envoyer un message',
          pricingObservations: `Prix observés autour de ${Number(product.price).toFixed(0)} MAD.`,
          creativePatterns: 'Vidéos verticales courtes, démonstrations produit et offres affichées à l’écran.',
          competitorWeaknesses: 'Peu de preuves détaillées, bénéfices parfois génériques et faible différenciation.',
          recommendedPositioning: 'Mettre en avant la démonstration réelle, le service local, la transparence et la rapidité de confirmation WhatsApp.',
          recommendedAdCopies: [
            {
              headline: `${product.name}, simple et disponible`,
              primaryText: 'Un produit pratique avec livraison rapide et commande facile sur WhatsApp.',
              description: 'Qualité, service et disponibilité.',
              callToAction: 'Commander sur WhatsApp',
              angle: 'Praticité et rapidité',
              recommendedPlatform: 'META',
              creativeIdea: 'Vidéo courte du produit utilisé dans une situation quotidienne.',
            },
          ],
          opportunityScore: 78 - index * 8,
          competitionLevel: CompetitionLevel.MEDIUM,
        },
      });
    }
  }

  const competitorProfiles = [
    ['Casa Tech Market', 'Électronique grand public', 'Casablanca', 'Positionnement axé sur les prix accessibles, la disponibilité et la livraison rapide.'],
    ['Digital Souk', 'Produits technologiques tendance', 'Rabat', 'Communication dynamique avec vidéos courtes, démonstrations et offres limitées.'],
    ['Maroc Smart Deals', 'Accessoires et maison connectée', 'Marrakech', 'Promotions fréquentes et mise en avant du paiement à la livraison.'],
    ['Urban Gadget', 'Gadgets et accessoires premium', 'Tanger', 'Univers lifestyle, design soigné et argumentaire centré sur la qualité.'],
    ['Tech Express Maroc', 'Électronique avec livraison nationale', 'Agadir', 'Promesse principale centrée sur la rapidité de préparation et d’expédition.'],
  ] as const;
  for (const [name, niche, city, notes] of competitorProfiles) {
    await prisma.competitor.updateMany({
      where: { name },
      data: {
        websiteUrl: null,
        facebookPageUrl: `https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`,
        instagramUrl: 'https://www.instagram.com/',
        tiktokUrl: 'https://www.tiktok.com/',
        niche,
        country: 'Maroc',
        city,
        notes,
      },
    });
  }

  const placeholderAds = await prisma.competitorAd.findMany({
    where: { adUrl: { contains: 'example.com/public-ad' } },
    include: { competitor: true, product: true },
  });
  for (const ad of placeholderAds) {
    const query = encodeURIComponent(`${ad.competitor.name} ${ad.product?.name ?? ''}`.trim());
    const adUrl =
      ad.platform === CompetitorAdPlatform.META || ad.platform === CompetitorAdPlatform.INSTAGRAM
        ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=MA&q=${query}&search_type=keyword_unordered`
        : ad.platform === CompetitorAdPlatform.TIKTOK
          ? `https://www.tiktok.com/search?q=${query}`
          : ad.platform === CompetitorAdPlatform.GOOGLE
            ? `https://adstransparency.google.com/?region=anywhere&query=${query}`
            : `https://www.google.com/search?q=${query}`;
    await prisma.competitorAd.update({ where: { id: ad.id }, data: { adUrl } });
  }

  const seededAds = await prisma.competitorAd.findMany({
    where: { inspirationNotes: { contains: 'Information collectée manuellement' } },
    include: { competitor: true, product: true },
    orderBy: { createdAt: 'asc' },
  });
  const hooks = ['Livraison rapide', 'Offre limitée', 'Solution pratique', 'Prix réduit', 'Qualité premium'];
  const offers = ['Livraison gratuite', 'Remise de 20 %', 'Paiement à la livraison', 'Stock limité', 'Garantie satisfaction'];
  const ctas = ['Commander maintenant', 'Envoyer un message', 'Profiter de l’offre', 'Acheter aujourd’hui'];
  for (const [index, ad] of seededAds.entries()) {
    if (!ad.product) continue;
    const hook = hooks[index % hooks.length];
    const offer = offers[index % offers.length];
    const query = encodeURIComponent(`${ad.competitor.name} ${ad.product.name}`);
    const adUrl =
      ad.platform === CompetitorAdPlatform.META || ad.platform === CompetitorAdPlatform.INSTAGRAM
        ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=MA&q=${query}&search_type=keyword_unordered`
        : ad.platform === CompetitorAdPlatform.TIKTOK
          ? `https://www.tiktok.com/search?q=${query}`
          : ad.platform === CompetitorAdPlatform.GOOGLE
            ? `https://adstransparency.google.com/?region=anywhere&query=${query}`
            : `https://www.google.com/search?q=${query}`;
    await prisma.competitorAd.update({
      where: { id: ad.id },
      data: {
        adUrl,
        landingPageUrl: null,
        creativeUrl: ad.product.image,
        headline: `${hook} : ${ad.product.name}`,
        primaryText: `Découvrez ${ad.product.name}. ${offer}, commande simple et livraison disponible partout au Maroc.`,
        description: 'Une offre claire avec service client et confirmation rapide.',
        callToAction: ctas[index % ctas.length],
        offer,
        detectedHook: hook,
        detectedAngle: index % 2 === 0 ? 'Praticité et rapidité' : 'Prix et réassurance',
        trustElement: 'Avis clients, service local et paiement à la livraison',
        strengths: 'Message clair, bénéfice visible et appel à l’action direct',
        weaknesses: index % 2 === 0 ? 'Peu de détails techniques' : 'Positionnement encore peu différencié',
      },
    });
  }

  const seededInsights = await prisma.competitorInsight.findMany({ include: { product: true } });
  for (const insight of seededInsights) {
    await prisma.competitorInsight.update({
      where: { id: insight.id },
      data: {
        summary: `Analyse des publicités concurrentes publiques enregistrées pour ${insight.product.name}.`,
        pricingObservations: `Les prix observés se situent autour de ${Number(insight.product.price).toFixed(0)} MAD, avec des offres ponctuelles sur la livraison.`,
        recommendedPositioning: `Positionner ${insight.product.name} sur la fiabilité, la démonstration réelle, le service local et la confirmation rapide sur WhatsApp.`,
        recommendedAdCopies: [
          {
            headline: `${insight.product.name}, disponible avec livraison rapide`,
            primaryText: `Découvrez ${insight.product.name}, contrôlé avant expédition et livré partout au Maroc. Commandez simplement via WhatsApp.`,
            description: 'Produit disponible, service réactif et paiement à la livraison.',
            callToAction: 'Commander sur WhatsApp',
            angle: 'Confiance et rapidité',
            recommendedPlatform: 'META',
            creativeIdea: 'Vidéo verticale montrant le produit, ses bénéfices et les étapes simples de commande.',
          },
        ],
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
