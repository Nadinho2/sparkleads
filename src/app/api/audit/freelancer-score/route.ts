import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

export const runtime = 'nodejs';

// No credits charged — free tool

const runChecks = async (lead: Record<string, unknown>, type: string) => {
  let html = '';

  if (lead.website) {
    try {
      const res = await fetch(lead.website as string, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      });
      html = await res.text();
    } catch {
      html = '';
    }
  }

  switch (type) {

    case 'web_designer': {
      const hasSSL = (lead.website as string)?.startsWith('https') || false;
      const hasViewport = /viewport/i.test(html);
      const hasResponsive = /@media|responsive|viewport-width/i.test(html);
      const hasModernCSS = /grid|flexbox|css\s*variables/i.test(html);
      const hasImages = (html.match(/<img/gi) || []).length > 3;
      const hasCustomFont = /font-family|@font-face|fonts\.googleapis/i.test(html);

      const checks = [hasSSL, hasViewport, hasResponsive, hasModernCSS, hasImages, hasCustomFont];
      const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

      return {
        score,
        label: score < 40 ? 'Bad Site' : score < 70 ? 'Outdated' : 'Modern',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          ssl: hasSSL,
          viewport: hasViewport,
          responsive: hasResponsive,
          modernCSS: hasModernCSS,
          images: hasImages,
          customFont: hasCustomFont,
          verdict: score < 40
            ? 'Website needs a complete rebuild — strong prospect'
            : score < 70
              ? 'Outdated design — redesign opportunity'
              : 'Website looks decent — smaller opportunity',
        },
      };
    }

    case 'smma': {
      const hasInstagram = /instagram\.com/i.test(html);
      const hasFacebook = /facebook\.com/i.test(html);
      const hasTikTok = /tiktok\.com/i.test(html);
      const hasAnyProfile = hasInstagram || hasFacebook || hasTikTok;
      const platformCount = [hasInstagram, hasFacebook, hasTikTok].filter(Boolean).length;

      const score = !hasAnyProfile ? 10 :
                    platformCount === 1 ? 40 :
                    platformCount === 2 ? 65 : 85;

      return {
        score,
        label: !hasAnyProfile ? 'No Social' :
               platformCount === 1 ? 'Weak' : 'Active',
        opportunity: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          instagram: hasInstagram,
          facebook: hasFacebook,
          tiktok: hasTikTok,
          verdict: !hasAnyProfile
            ? 'No social media presence found — perfect prospect'
            : `Found ${platformCount} platform(s) — audit their engagement`,
        },
      };
    }

    case 'seo': {
      const hasMetaDesc = /<meta[^>]*name="description"[^>]*content="[^"]{30,}"/i.test(html);
      const hasTitle = /<title>[^<]{20,}<\/title>/i.test(html);
      const hasH1 = /<h1/i.test(html);
      const hasSSL = (lead.website as string)?.startsWith('https') || false;
      const hasGBP = !!lead.rating;
      const reviewCount = (lead.reviews as number) || 0;

      const checks = [hasMetaDesc, hasTitle, hasH1, hasSSL, hasGBP, reviewCount > 10];
      const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

      return {
        score,
        label: score < 40 ? 'Poor SEO' : score < 70 ? 'Weak SEO' : 'OK',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          metaDescription: hasMetaDesc,
          pageTitle: hasTitle,
          h1Tag: hasH1,
          ssl: hasSSL,
          googleProfile: hasGBP,
          reviewCount,
          verdict: score < 40
            ? 'Major SEO gaps — strong prospect'
            : 'Some SEO improvements needed',
        },
      };
    }

    case 'copywriter': {
      const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).length;
      const hasCTA = /contact|book|order|buy|get started|learn more|whatsapp/i.test(html);
      const hasTestimonial = /review|testimonial|client said|customer/i.test(html);
      const hasValueProp = wordCount > 150;

      const score = Math.round(
        ([wordCount > 300, hasCTA, hasTestimonial, hasValueProp]
          .filter(Boolean).length / 4) * 100
      );

      return {
        score,
        label: score < 40 ? 'Thin Copy' : score < 70 ? 'Weak Copy' : 'OK',
        opportunity: score < 50 ? 'high' : 'medium',
        details: {
          wordCount,
          hasCTA,
          hasTestimonial,
          verdict: score < 40
            ? 'Very little copy — needs a copywriter'
            : 'Copy could be significantly improved',
        },
      };
    }

    case 'photographer': {
      const imgCount = (html.match(/<img/gi) || []).length;
      const hasVideo = /youtube|vimeo|<video/i.test(html);
      const hasGBPPhotos = !!lead.thumbnail;
      const lowImgCount = imgCount < 5;

      const score = Math.round(
        ([imgCount > 10, hasVideo, hasGBPPhotos, !lowImgCount]
          .filter(Boolean).length / 4) * 100
      );

      return {
        score,
        label: score < 40 ? 'No Visuals' : score < 70 ? 'Few Photos' : 'OK',
        opportunity: score < 50 ? 'high' : 'medium',
        details: {
          imageCount: imgCount,
          hasVideo,
          hasGBPPhotos,
          verdict: score < 40
            ? 'Almost no visual content — strong prospect'
            : 'Limited photography — good opportunity',
        },
      };
    }

    case 'email_marketer': {
      const hasEmailCapture = /subscribe|newsletter|email.*sign|join.*list/i.test(html);
      const hasContactForm = /<form/i.test(html);
      const hasMailchimp = /mailchimp|klaviyo|convertkit|sendinblue/i.test(html);
      const hasEmailAddress = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);

      const score = Math.round(
        ([hasEmailCapture, hasContactForm, hasMailchimp, hasEmailAddress]
          .filter(Boolean).length / 4) * 100
      );

      return {
        score,
        label: score < 30 ? 'No Email' : score < 60 ? 'Basic' : 'Has Setup',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasEmailCapture,
          hasContactForm,
          hasMailchimp,
          verdict: score < 40
            ? 'No email marketing setup at all — prime prospect'
            : 'Basic email presence — could be improved significantly',
        },
      };
    }

    case 'ads_specialist': {
      const hasFBPixel = /fbq\(|facebook.*pixel|connect\.facebook\.net/i.test(html);
      const hasGoogleAds = /googletagmanager|gtag\(|google.*ads/i.test(html);
      const hasRetargeting = /remarketing|retarget/i.test(html);
      const hasAnalytics = /google-analytics|gtag|_ga/i.test(html);

      const score = Math.round(
        ([hasFBPixel, hasGoogleAds, hasRetargeting, hasAnalytics]
          .filter(Boolean).length / 4) * 100
      );

      return {
        score,
        label: score === 0 ? 'No Tracking' : score < 50 ? 'Minimal' : 'Has Pixels',
        opportunity: score < 30 ? 'high' : score < 60 ? 'medium' : 'low',
        details: {
          facebookPixel: hasFBPixel,
          googleAds: hasGoogleAds,
          retargeting: hasRetargeting,
          analytics: hasAnalytics,
          verdict: score === 0
            ? 'Zero tracking or ads setup — complete beginner prospect'
            : 'Some setup but gaps exist',
        },
      };
    }

    case 'whatsapp_dev': {
      const hasWhatsApp = /wa\.me|whatsapp/i.test(html);
      const hasAutomation = /chatbot|automated|autorespond/i.test(html);
      const hasChatWidget = /tawk|crisp|intercom|livechat/i.test(html);
      const hasBooking = /calendly|booking|schedule|appointment/i.test(html);

      const score = Math.round(
        ([hasWhatsApp, hasAutomation, hasChatWidget, hasBooking]
          .filter(Boolean).length / 4) * 100
      );

      return {
        score,
        label: !hasWhatsApp ? 'No WhatsApp' : !hasAutomation ? 'Manual' : 'Automated',
        opportunity: score < 30 ? 'high' : score < 60 ? 'medium' : 'low',
        details: {
          hasWhatsApp,
          hasAutomation,
          hasChatWidget,
          hasBooking,
          verdict: !hasWhatsApp
            ? 'No WhatsApp at all — start from scratch opportunity'
            : !hasAutomation
              ? 'Has WhatsApp but fully manual — automation opportunity'
              : 'Some automation present',
        },
      };
    }

    case 'brand_designer': {
      const hasLogo = /<img[^>]*logo/i.test(html) || /<svg/i.test(html);
      const hasBrandColors = (html.match(/color:\s*#[0-9a-f]{6}/gi) || []).length > 3;
      const hasGBPPhoto = !!lead.thumbnail;
      const hasCustomFont = /font-family|@font-face|fonts\.googleapis/i.test(html);
      const imgCount = (html.match(/<img/gi) || []).length;

      const score = Math.round(
        ([hasLogo, hasBrandColors, hasGBPPhoto, hasCustomFont, imgCount > 5]
          .filter(Boolean).length / 5) * 100
      );

      return {
        score,
        label: score < 30 ? 'No Brand' : score < 60 ? 'Weak Brand' : 'Has Brand',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasLogo,
          hasBrandColors,
          hasGBPPhoto,
          hasCustomFont,
          verdict: score < 30
            ? 'No visible branding — complete brand package opportunity'
            : 'Inconsistent branding — redesign opportunity',
        },
      };
    }

    case 'consultant': {
      const hasBooking = /booking|appointment|schedule|calendly/i.test(html);
      const hasPricing = /price|pricing|package|plan|cost|fee/i.test(html);
      const hasProcess = /how it works|process|step/i.test(html);
      const rating = (lead.rating as number) || 0;
      const reviews = (lead.reviews as number) || 0;

      const score = Math.round(
        ([hasBooking, hasPricing, hasProcess, rating >= 4, reviews >= 20]
          .filter(Boolean).length / 5) * 100
      );

      return {
        score,
        label: score < 40 ? 'Disorganized' : score < 70 ? 'Basic Ops' : 'Organized',
        opportunity: score < 50 ? 'high' : 'medium',
        details: {
          hasBookingSystem: hasBooking,
          hasPricing,
          hasProcessExplained: hasProcess,
          rating,
          reviews,
          verdict: score < 40
            ? 'Missing basic business systems — high-value consulting prospect'
            : 'Room for significant operational improvement',
        },
      };
    }

    // ── VIDEO & CONTENT ──

    case 'video_editor': {
      const hasYouTube = /youtube\.com\/channel|youtube\.com\/@/i.test(html);
      const hasVideoEmbed = /<iframe[^>]*youtube|<iframe[^>]*vimeo|<video/i.test(html);
      const hasTikTok = /tiktok\.com\/@/i.test(html);
      const hasReels = /instagram\.com\/reel|reels/i.test(html);
      const imgCount = (html.match(/<img/gi) || []).length;
      const hasAnyVideo = hasYouTube || hasVideoEmbed || hasTikTok;

      const score = Math.round(
        ([hasYouTube, hasVideoEmbed, hasTikTok, hasReels, imgCount > 10]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: !hasAnyVideo ? 'No Video' : score < 50 ? 'Minimal Video' : 'Has Video',
        opportunity: !hasAnyVideo ? 'high' : score < 50 ? 'medium' : 'low',
        details: {
          hasYouTube, hasVideoEmbed, hasTikTok, hasReels,
          verdict: !hasAnyVideo
            ? 'Zero video content — a video package would transform this business'
            : 'Limited video presence — room to grow significantly',
        },
      };
    }

    case 'youtube_specialist': {
      const hasYouTube = /youtube\.com\/channel|youtube\.com\/@|youtube\.com\/c\//i.test(html);
      const hasYouTubeEmbed = /<iframe[^>]*youtube/i.test(html);
      const hasVideoContent = /<video|vimeo/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isGoodTarget = ['restaurant', 'hotel', 'gym', 'salon', 'school',
        'real estate', 'clinic', 'hospital'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasYouTube, hasYouTubeEmbed, hasVideoContent]
          .filter(Boolean).length / 3) * 100
      );
      return {
        score,
        label: !hasYouTube ? 'No YouTube' : hasYouTubeEmbed ? 'Has Channel' : 'Inactive',
        opportunity: (!hasYouTube && isGoodTarget) ? 'high' :
                     !hasYouTube ? 'medium' : 'low',
        details: {
          hasYouTubeChannel: hasYouTube,
          hasEmbeddedVideos: hasYouTubeEmbed,
          isHighValueTarget: isGoodTarget,
          verdict: !hasYouTube
            ? 'No YouTube channel — pitch channel creation and video strategy'
            : 'Has channel but not leveraging it well on their website',
        },
      };
    }

    case 'tiktok_specialist': {
      const hasTikTok = /tiktok\.com\/@/i.test(html);
      const hasTikTokEmbed = /tiktok.*embed|embed.*tiktok/i.test(html);
      const hasInstagram = /instagram\.com\//i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isTikTokBusiness = ['restaurant', 'food', 'salon', 'beauty',
        'gym', 'fitness', 'fashion', 'boutique', 'bakery', 'hotel']
        .some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasTikTok, hasTikTokEmbed, hasInstagram]
          .filter(Boolean).length / 3) * 100
      );
      return {
        score,
        label: !hasTikTok ? 'No TikTok' : 'Has TikTok',
        opportunity: (!hasTikTok && isTikTokBusiness) ? 'high' :
                     !hasTikTok ? 'medium' : 'low',
        details: {
          hasTikTok,
          hasTikTokEmbed,
          isTikTokSuitableBusiness: isTikTokBusiness,
          verdict: (!hasTikTok && isTikTokBusiness)
            ? 'Perfect TikTok business with zero TikTok presence — huge opportunity'
            : !hasTikTok
              ? 'No TikTok yet — growing platform opportunity'
              : 'Already on TikTok',
        },
      };
    }

    case 'podcast_editor': {
      const hasPodcast = /podcast|episode|spotify.*podcast|anchor\.fm|buzzsprout/i.test(html);
      const hasAudio = /<audio|soundcloud|spotify\.com\/show/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isPodcastTarget = ['consultant', 'coach', 'trainer', 'school',
        'agency', 'clinic', 'lawyer', 'accountant', 'real estate']
        .some((t) => businessType.includes(t));

      const hasPodcastPresence = hasPodcast || hasAudio;

      return {
        score: hasPodcastPresence ? 80 : isPodcastTarget ? 20 : 40,
        label: hasPodcastPresence ? 'Has Podcast' : 'No Podcast',
        opportunity: (!hasPodcastPresence && isPodcastTarget) ? 'high' :
                     !hasPodcastPresence ? 'medium' : 'low',
        details: {
          hasPodcast: hasPodcastPresence,
          isPodcastSuitableBusiness: isPodcastTarget,
          verdict: !hasPodcastPresence && isPodcastTarget
            ? 'Knowledge-based business with no podcast — strong authority-building opportunity'
            : !hasPodcastPresence
              ? 'Could benefit from audio content'
              : 'Already running a podcast',
        },
      };
    }

    case 'animator': {
      const hasAnimation = /animation|animate|motion|gif|lottie|after.effects/i.test(html);
      const hasVideo = /youtube|vimeo|<video|<iframe/i.test(html);
      const hasSVG = /<svg/i.test(html);
      const hasCSSAnimation = /@keyframes|animation:|transition:/i.test(html);
      const imgCount = (html.match(/<img/gi) || []).length;

      const score = Math.round(
        ([hasAnimation, hasVideo, hasSVG, hasCSSAnimation, imgCount > 5]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 30 ? 'Static Site' : score < 60 ? 'Minimal Motion' : 'Animated',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasAnimation, hasVideo, hasSVG, hasCSSAnimation,
          verdict: score < 40
            ? 'Completely static website — motion graphics would dramatically improve engagement'
            : 'Some visual elements but motion design would elevate it',
        },
      };
    }

    // ── E-COMMERCE & TECH ──

    case 'ecommerce_dev': {
      const hasCart = /add.to.cart|shopping.cart|checkout|basket/i.test(html);
      const hasShopify = /shopify|myshopify/i.test(html);
      const hasWooCommerce = /woocommerce|wp-content/i.test(html);
      const hasPayment = /paystack|flutterwave|stripe|paypal/i.test(html);
      const hasProductListing = /product|shop|store|buy now|order now/i.test(html);
      const hasOnlineStore = hasCart || hasShopify || hasWooCommerce;
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isEcommerceTarget = ['boutique', 'hair', 'wig', 'fashion',
        'food', 'bakery', 'pharmacy', 'supermarket', 'electronics', 'vendor']
        .some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasCart, hasShopify || hasWooCommerce, hasPayment, hasProductListing]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score,
        label: !hasOnlineStore ? 'No Store' : hasPayment ? 'Has Store' : 'Basic Store',
        opportunity: (!hasOnlineStore && isEcommerceTarget) ? 'high' :
                     !hasOnlineStore ? 'medium' : 'low',
        details: {
          hasOnlineStore,
          hasPaymentGateway: hasPayment,
          hasProductPages: hasProductListing,
          isEcommerceReadyBusiness: isEcommerceTarget,
          verdict: !hasOnlineStore && isEcommerceTarget
            ? 'Selling physical products with no online store — massive revenue gap'
            : !hasOnlineStore
              ? 'Could benefit from an online ordering system'
              : 'Has e-commerce but may need optimisation',
        },
      };
    }

    case 'app_developer': {
      const hasAppStore = /apps\.apple\.com|play\.google\.com|app store|google play/i.test(html);
      const hasAppLink = /download.*app|get.*app|mobile.*app/i.test(html);
      const reviews = (lead.reviews as number) || 0;
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isAppTarget = ['restaurant', 'hotel', 'gym', 'clinic', 'pharmacy',
        'school', 'supermarket', 'logistics', 'delivery', 'real estate']
        .some((t) => businessType.includes(t));

      const hasApp = hasAppStore || hasAppLink;

      return {
        score: hasApp ? 85 : isAppTarget && reviews > 50 ? 15 : 40,
        label: hasApp ? 'Has App' : 'No App',
        opportunity: (!hasApp && isAppTarget && reviews > 20) ? 'high' :
                     !hasApp ? 'medium' : 'low',
        details: {
          hasAppStoreLink: hasApp,
          customerBase: reviews,
          isAppSuitableBusiness: isAppTarget,
          verdict: !hasApp && isAppTarget && reviews > 20
            ? `${reviews} Google reviews proves they have customers — a loyalty app would retain them`
            : !hasApp
              ? 'No mobile app presence'
              : 'Already has an app',
        },
      };
    }

    case 'crm_specialist': {
      const hasHubspot = /hubspot/i.test(html);
      const hasSalesforce = /salesforce/i.test(html);
      const hasZoho = /zoho/i.test(html);
      const hasAnycrm = hasHubspot || hasSalesforce || hasZoho;
      const hasContactForm = /<form/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';
      const reviews = (lead.reviews as number) || 0;

      const needsCRM = ['agency', 'real estate', 'insurance', 'consultant',
        'law', 'accounting', 'recruitment', 'logistics', 'security']
        .some((t) => businessType.includes(t));

      return {
        score: hasAnycrm ? 85 : hasContactForm ? 35 : 10,
        label: !hasAnycrm ? 'No CRM' : 'Has CRM',
        opportunity: (!hasAnycrm && needsCRM) ? 'high' :
                     !hasAnycrm ? 'medium' : 'low',
        details: {
          hasCRMIntegration: hasAnycrm,
          hasLeadCapture: hasContactForm,
          isHighValueTarget: needsCRM,
          estimatedLeadVolume: reviews > 50 ? 'High' : reviews > 20 ? 'Medium' : 'Low',
          verdict: !hasAnycrm && needsCRM
            ? 'High-volume service business with no CRM — leads are falling through the cracks'
            : !hasAnycrm
              ? 'No CRM integration found — could benefit from lead management'
              : 'CRM integration detected',
        },
      };
    }

    case 'chatbot_dev': {
      const hasWhatsApp = /wa\.me|whatsapp/i.test(html);
      const hasChatWidget = /tawk|crisp|intercom|livechat|drift|zendesk/i.test(html);
      const hasChatbot = /chatbot|ai.*assistant|virtual.*assistant|bot/i.test(html);
      const hasFAQ = /faq|frequently.asked/i.test(html);
      const hasContactForm = /<form/i.test(html);

      const score = Math.round(
        ([hasWhatsApp, hasChatWidget, hasChatbot, hasFAQ, hasContactForm]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: !hasChatWidget && !hasChatbot ? 'No Bot' : score < 50 ? 'Basic Chat' : 'Automated',
        opportunity: score < 30 ? 'high' : score < 60 ? 'medium' : 'low',
        details: {
          hasWhatsApp, hasChatWidget, hasChatbot, hasFAQ, hasContactForm,
          verdict: score < 30
            ? 'No chatbot or automation — every visitor question goes unanswered'
            : 'Some chat presence but could be fully automated',
        },
      };
    }

    // ── MARKETING SPECIALISTS ──

    case 'linkedin_specialist': {
      const hasLinkedIn = /linkedin\.com\/(company|in)\//i.test(html);
      const hasTeamPage = /team|about us|our people|staff/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isB2B = ['agency', 'consultant', 'law', 'accounting', 'real estate',
        'construction', 'recruitment', 'logistics', 'security', 'finance',
        'insurance', 'tech', 'software', 'training', 'school']
        .some((t) => businessType.includes(t));

      return {
        score: hasLinkedIn ? 80 : isB2B ? 10 : 50,
        label: !hasLinkedIn ? 'No LinkedIn' : 'Has LinkedIn',
        opportunity: (!hasLinkedIn && isB2B) ? 'high' :
                     !hasLinkedIn ? 'medium' : 'low',
        details: {
          hasLinkedInPage: hasLinkedIn,
          hasTeamPresence: hasTeamPage,
          isB2BBusiness: isB2B,
          verdict: !hasLinkedIn && isB2B
            ? 'B2B business with no LinkedIn presence — missing their most valuable lead channel'
            : !hasLinkedIn
              ? 'Could benefit from LinkedIn for professional credibility'
              : 'LinkedIn page exists',
        },
      };
    }

    case 'influencer_marketer': {
      const hasInstagram = /instagram\.com/i.test(html);
      const hasTikTok = /tiktok\.com/i.test(html);
      const hasYouTube = /youtube\.com/i.test(html);
      const hasInfluencer = /influencer|collab|brand.*ambassador|partnership/i.test(html);
      const socialCount = [hasInstagram, hasTikTok, hasYouTube].filter(Boolean).length;
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isVisualBusiness = ['fashion', 'beauty', 'salon', 'food', 'restaurant',
        'hotel', 'travel', 'fitness', 'gym', 'spa', 'boutique']
        .some((t) => businessType.includes(t));

      return {
        score: socialCount === 0 ? 5 : socialCount === 1 ? 30 : socialCount === 2 ? 60 : 85,
        label: socialCount === 0 ? 'No Social' : `${socialCount} Platform${socialCount > 1 ? 's' : ''}`,
        opportunity: (socialCount <= 1 && isVisualBusiness) ? 'high' :
                     socialCount <= 1 ? 'medium' : 'low',
        details: {
          hasInstagram, hasTikTok, hasYouTube,
          hasInfluencerProgram: hasInfluencer,
          isVisualBusiness,
          verdict: socialCount === 0 && isVisualBusiness
            ? 'Visual business with zero social presence — influencer campaigns would explode their reach'
            : socialCount <= 1
              ? 'Limited social presence — influencer partnerships would amplify their brand'
              : 'Active on multiple platforms',
        },
      };
    }

    case 'pr_specialist': {
      const hasNewsSection = /news|press|media|blog|article/i.test(html);
      const hasPressRelease = /press release|press kit|media kit/i.test(html);
      const hasAwards = /award|recognition|featured|as seen in/i.test(html);
      const rating = (lead.rating as number) || 0;
      const reviews = (lead.reviews as number) || 0;
      const hasNegativeIndicator = rating < 3.5 && reviews > 10;

      const score = Math.round(
        ([hasNewsSection, hasPressRelease, hasAwards, rating >= 4.0, reviews >= 50]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score: hasNegativeIndicator ? 10 : score,
        label: hasNegativeIndicator ? 'Bad Reputation' :
               score < 40 ? 'No PR' : 'Has PR',
        opportunity: hasNegativeIndicator ? 'high' :
                     score < 40 ? 'medium' : 'low',
        details: {
          hasNewsSection,
          hasMediaKit: hasPressRelease,
          hasAwards,
          rating,
          reviewCount: reviews,
          reputationRisk: hasNegativeIndicator,
          verdict: hasNegativeIndicator
            ? `${rating}★ with ${reviews} reviews — reputation management urgently needed`
            : score < 40
              ? 'No PR or media presence — strong credibility building opportunity'
              : 'Some PR presence but could be strengthened',
        },
      };
    }

    case 'review_manager': {
      const rating = (lead.rating as number) || 0;
      const reviews = (lead.reviews as number) || 0;
      const noReviews = reviews === 0;
      const lowReviews = reviews < 10;
      const badRating = rating < 4.0 && reviews > 5;
      const goodRatingLowCount = rating >= 4.0 && reviews < 20;

      let opportunityLevel: 'high' | 'medium' | 'low' = 'low';
      let verdict = '';
      let label = '';

      if (noReviews) {
        opportunityLevel = 'high';
        label = 'Zero Reviews';
        verdict = 'No Google reviews at all — invisible to customers searching online';
      } else if (badRating) {
        opportunityLevel = 'high';
        label = `${rating}★ Rating`;
        verdict = `${rating} star average with ${reviews} reviews — reputation is actively hurting them`;
      } else if (lowReviews) {
        opportunityLevel = 'high';
        label = `Only ${reviews} Reviews`;
        verdict = `Only ${reviews} reviews — competitors with more reviews are winning their customers`;
      } else if (goodRatingLowCount) {
        opportunityLevel = 'medium';
        label = `${rating}★ ${reviews} reviews`;
        verdict = 'Good rating but low volume — needs a review generation system';
      } else {
        opportunityLevel = 'low';
        label = `${rating}★ ${reviews} reviews`;
        verdict = 'Healthy review profile';
      }

      const score = noReviews ? 0 : badRating ? 15 : lowReviews ? 25 :
                    goodRatingLowCount ? 50 : 80;

      return { score, label, opportunity: opportunityLevel, details: { rating, reviews, noReviews, badRating, verdict } };
    }

    // ── DESIGN SPECIALISTS ──

    case 'logo_designer': {
      const hasLogo = /<img[^>]*logo/i.test(html) || /<svg/i.test(html);
      const hasBrandColors = (html.match(/color:\s*#[0-9a-f]{6}/gi) || []).length > 3;
      const hasCustomFont = /font-family|@font-face|fonts\.googleapis/i.test(html);
      const hasGBPPhoto = !!lead.thumbnail;
      const hasFavicon = /favicon|<link[^>]*icon/i.test(html);

      const score = Math.round(
        ([hasLogo, hasBrandColors, hasCustomFont, hasGBPPhoto, hasFavicon]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 30 ? 'No Brand' : score < 60 ? 'Weak Brand' : 'Branded',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasLogo, hasBrandColors, hasCustomFont, hasGBPPhoto, hasFavicon,
          verdict: score < 30
            ? 'No visible branding — complete brand identity package opportunity'
            : 'Inconsistent branding — redesign opportunity',
        },
      };
    }

    case 'print_designer': {
      const hasPrint = /print|brochure|flyer|business.card|menu\.pdf|catalog/i.test(html);
      const hasPDF = /\.pdf/i.test(html);
      const hasDownloadable = /download|brochure|catalog|menu/i.test(html);
      const hasBranding = /<img[^>]*logo/i.test(html) || /<svg/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const needsPrint = ['restaurant', 'salon', 'hotel', 'gym', 'clinic',
        'school', 'cafe', 'bar', 'event', 'wedding']
        .some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasPrint, hasPDF, hasDownloadable, hasBranding]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score: needsPrint && score < 30 ? 10 : score,
        label: score < 30 ? 'No Print' : score < 60 ? 'Basic' : 'Has Materials',
        opportunity: (needsPrint && score < 40) ? 'high' : score < 50 ? 'medium' : 'low',
        details: {
          hasPrintMaterials: hasPrint,
          hasPDFDownloads: hasPDF,
          needsPrintDesign: needsPrint,
          verdict: needsPrint && score < 40
            ? 'Physical-location business with no print materials visible online'
            : 'Could benefit from professional print collateral',
        },
      };
    }

    case 'ui_ux_designer': {
      const hasResponsive = /@media|responsive|viewport-width/i.test(html);
      const hasAccessibility = /aria-|role=|alt=|accessibility/i.test(html);
      const hasModernCSS = /grid|flexbox|css\s*variables/i.test(html);
      const hasCustomFont = /font-family|@font-face|fonts\.googleapis/i.test(html);
      const hasAnimations = /@keyframes|transition:|transform:/i.test(html);
      const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).length;

      const score = Math.round(
        ([hasResponsive, hasAccessibility, hasModernCSS, hasCustomFont, hasAnimations, wordCount > 200]
          .filter(Boolean).length / 6) * 100
      );
      return {
        score,
        label: score < 35 ? 'Poor UX' : score < 65 ? 'Basic UX' : 'Good UX',
        opportunity: score < 40 ? 'high' : score < 65 ? 'medium' : 'low',
        details: {
          hasResponsive, hasAccessibility, hasModernCSS, hasCustomFont, hasAnimations,
          verdict: score < 40
            ? 'Website has significant UX issues — redesign would improve conversions'
            : 'Functional but UX could be significantly improved',
        },
      };
    }

    // ── FOOD & HOSPITALITY TECH ──

    case 'menu_designer': {
      const hasDigitalMenu = /menu|food|dishes|cuisine|our menu/i.test(html);
      const hasOnlineOrder = /order online|delivery|uber eats|jumia food|bolt food/i.test(html);
      const hasPDFMenu = /menu\.pdf|download.*menu/i.test(html);
      const hasMenuImages = (html.match(/<img[^>]*menu/gi) || []).length > 0;
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isFoodBusiness = ['restaurant', 'food', 'eatery', 'cafe', 'bakery',
        'catering', 'fast food', 'bar', 'lounge', 'suya', 'buka']
        .some((t) => businessType.includes(t));

      const hasProperMenu = hasDigitalMenu && (hasMenuImages || hasOnlineOrder);

      return {
        score: !isFoodBusiness ? 50 : !hasDigitalMenu ? 5 : hasProperMenu ? 75 : 35,
        label: !isFoodBusiness ? 'N/A' : !hasDigitalMenu ? 'No Menu' :
               hasProperMenu ? 'Has Menu' : 'Basic Menu',
        opportunity: (isFoodBusiness && !hasDigitalMenu) ? 'high' :
                     (isFoodBusiness && !hasProperMenu) ? 'medium' : 'low',
        details: {
          isFoodBusiness,
          hasDigitalMenu,
          hasOnlineOrdering: hasOnlineOrder,
          hasPDFMenu,
          verdict: isFoodBusiness && !hasDigitalMenu
            ? 'Food business with no digital menu — customers can\'t see what they\'re ordering'
            : isFoodBusiness && !hasProperMenu
              ? 'Has menu text but no visual menu design or online ordering'
              : 'Menu presence found',
        },
      };
    }

    case 'food_photographer': {
      const imgCount = (html.match(/<img/gi) || []).length;
      const hasFoodImages = /food|dish|meal|menu|cuisine/i.test(html);
      const hasGallery = /gallery|photos|portfolio|images/i.test(html);
      const hasVideo = /youtube|vimeo|<video/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isFoodBusiness = ['restaurant', 'food', 'eatery', 'cafe', 'bakery',
        'catering', 'fast food', 'bar', 'lounge', 'hotel']
        .some((t) => businessType.includes(t));

      const score = Math.round(
        ([imgCount > 10, hasFoodImages, hasGallery, hasVideo]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score: isFoodBusiness && score < 30 ? 10 : score,
        label: isFoodBusiness && imgCount < 5 ? 'No Food Photos' :
               score < 40 ? 'Few Photos' : 'Good Visuals',
        opportunity: (isFoodBusiness && imgCount < 5) ? 'high' :
                     score < 40 ? 'medium' : 'low',
        details: {
          imageCount: imgCount,
          hasFoodContent: hasFoodImages,
          hasGallery,
          isFoodBusiness,
          verdict: isFoodBusiness && imgCount < 5
            ? 'Food business with almost no food photography — customers eat with their eyes first'
            : 'Visual content could be dramatically improved',
        },
      };
    }

    case 'booking_specialist': {
      const hasCalendly = /calendly/i.test(html);
      const hasBookingSystem = /booking|appointment|schedule|reserve|cal\.com|acuity/i.test(html);
      const hasWhatsApp = /wa\.me|whatsapp/i.test(html);
      const hasPhone = !!lead.phone;
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const needsBooking = ['salon', 'spa', 'barbershop', 'clinic', 'hospital',
        'gym', 'fitness', 'tutor', 'coach', 'photographer', 'consultant',
        'lawyer', 'dentist', 'doctor', 'beauty', 'massage', 'nail']
        .some((t) => businessType.includes(t));

      const hasOnlineBooking = hasCalendly ||
        (hasBookingSystem && !(/how to book|to book call|booking.*whatsapp/i.test(html)));

      const score = Math.round(
        ([hasCalendly, hasOnlineBooking, !hasPhone || hasBookingSystem]
          .filter(Boolean).length / 3) * 100
      );

      return {
        score,
        label: !hasOnlineBooking && needsBooking ? 'Manual Booking' :
               hasOnlineBooking ? 'Has Booking' : 'No Booking',
        opportunity: (!hasOnlineBooking && needsBooking) ? 'high' :
                     !hasOnlineBooking ? 'medium' : 'low',
        details: {
          hasOnlineBooking,
          hasCalendly,
          onlyWhatsAppOrPhone: hasWhatsApp && !hasOnlineBooking,
          needsBookingSystem: needsBooking,
          verdict: !hasOnlineBooking && needsBooking
            ? 'Appointment-based business with no online booking — losing bookings to manual process'
            : !hasOnlineBooking
              ? 'No automated booking system — all manual'
              : 'Booking system found',
        },
      };
    }

    // ── PROFESSIONAL SERVICES ──

    case 'accountant': {
      const hasBooking = /booking|appointment|schedule|calendly|consultation/i.test(html);
      const hasPricing = /price|pricing|package|plan|cost|fee/i.test(html);
      const hasServices = /service|accounting|bookkeeping|tax|audit|payroll/i.test(html);
      const hasContactForm = /<form/i.test(html);
      const hasTestimonials = /review|testimonial|client/i.test(html);

      const score = Math.round(
        ([hasBooking, hasPricing, hasServices, hasContactForm, hasTestimonials]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 35 ? 'Basic' : score < 65 ? 'Standard' : 'Professional',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasBooking, hasPricing, hasServices, hasContactForm, hasTestimonials,
          verdict: score < 40
            ? 'Missing basic professional presence — needs website overhaul'
            : 'Professional presence exists but could be strengthened',
        },
      };
    }

    case 'hr_consultant': {
      const hasJobBoard = /career|vacancy|job|hire|recruitment|apply/i.test(html);
      const hasTeamPage = /team|about us|our people|staff|leadership/i.test(html);
      const hasLinkedIn = /linkedin\.com/i.test(html);
      const hasContactForm = /<form/i.test(html);
      const hasServices = /service|consulting|training|recruitment|hr/i.test(html);

      const score = Math.round(
        ([hasJobBoard, hasTeamPage, hasLinkedIn, hasContactForm, hasServices]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 35 ? 'No HR Presence' : score < 65 ? 'Basic' : 'Professional',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasJobBoard, hasTeamPage, hasLinkedIn, hasContactForm, hasServices,
          verdict: score < 40
            ? 'No HR or recruitment presence — strong consulting opportunity'
            : 'Basic HR presence — could be professionalized',
        },
      };
    }

    case 'legal_consultant': {
      const hasServices = /service|legal|law|compliance|regulation|attorney/i.test(html);
      const hasBooking = /booking|appointment|schedule|consultation|calendly/i.test(html);
      const hasPricing = /price|pricing|fee|cost|package/i.test(html);
      const hasTestimonials = /review|testimonial|case.*won|client/i.test(html);
      const hasSSL = (lead.website as string)?.startsWith('https') || false;
      const rating = (lead.rating as number) || 0;

      const score = Math.round(
        ([hasServices, hasBooking, hasPricing, hasTestimonials, hasSSL, rating >= 4]
          .filter(Boolean).length / 6) * 100
      );
      return {
        score,
        label: score < 35 ? 'Weak Presence' : score < 65 ? 'Basic' : 'Professional',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasServices, hasBooking, hasPricing, hasTestimonials, hasSSL, rating,
          verdict: score < 40
            ? 'Legal practice with weak online presence — credibility is key in this industry'
            : 'Some presence but could be significantly improved',
        },
      };
    }

    case 'translation': {
      const hasMultilingual = /lang=|hreflang|translate|language/i.test(html);
      const hasLanguages = html.match(/lang="/g)?.length || 0;
      const hasServices = /service|translate|locali[sz]ation|interpret/i.test(html);
      const hasContactForm = /<form/i.test(html);

      const score = Math.round(
        ([hasMultilingual, hasLanguages > 1, hasServices, hasContactForm]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score,
        label: !hasMultilingual ? 'Monolingual' : score < 50 ? 'Basic' : 'Multilingual',
        opportunity: !hasMultilingual ? 'high' : score < 50 ? 'medium' : 'low',
        details: {
          hasMultilingual,
          detectedLanguages: hasLanguages,
          hasServices,
          verdict: !hasMultilingual
            ? 'Website is monolingual — translation would open new markets'
            : 'Some multilingual presence — could be expanded',
        },
      };
    }

    case 'virtual_assistant': {
      const hasBooking = /booking|appointment|schedule|calendly/i.test(html);
      const hasContactForm = /<form/i.test(html);
      const hasChat = /tawk|crisp|intercom|livechat|whatsapp/i.test(html);
      const hasAutomation = /chatbot|automated|autorespond|bot/i.test(html);
      const hasFAQ = /faq|frequently.asked/i.test(html);
      const reviews = (lead.reviews as number) || 0;

      const score = Math.round(
        ([hasBooking, hasContactForm, hasChat, hasAutomation, hasFAQ, reviews > 20]
          .filter(Boolean).length / 6) * 100
      );
      return {
        score,
        label: score < 30 ? 'Manual Ops' : score < 60 ? 'Some Automation' : 'Streamlined',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasBooking, hasContactForm, hasChat, hasAutomation, hasFAQ,
          reviewVolume: reviews,
          verdict: score < 40
            ? 'Running everything manually — VA + automation would save hours weekly'
            : 'Some systems in place but significant gaps remain',
        },
      };
    }

    // ── REAL ESTATE & PROPERTY ──

    case 'property_photographer': {
      const imgCount = (html.match(/<img/gi) || []).length;
      const hasGallery = /gallery|photos|portfolio|property.*image/i.test(html);
      const hasVirtualTour = /virtual.*tour|360|matterport|3d.*tour/i.test(html);
      const hasVideo = /youtube|vimeo|<video/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isPropertyBusiness = ['real estate', 'property', 'estate', 'landlord',
        'developer', 'construction', 'housing'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([imgCount > 8, hasGallery, hasVirtualTour, hasVideo]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score: isPropertyBusiness && score < 20 ? 5 : score,
        label: score < 30 ? 'No Photos' : score < 60 ? 'Few Photos' : 'Good Visuals',
        opportunity: (isPropertyBusiness && imgCount < 5) ? 'high' :
                     score < 40 ? 'medium' : 'low',
        details: {
          imageCount: imgCount,
          hasGallery,
          hasVirtualTour,
          isPropertyBusiness,
          verdict: isPropertyBusiness && imgCount < 5
            ? 'Property business with almost no photography — listings need professional visuals'
            : 'Visual content could be improved for property marketing',
        },
      };
    }

    case 'drone_operator': {
      const hasAerial = /drone|aerial|bird.*eye|overhead/i.test(html);
      const hasVideo = /youtube|vimeo|<video/i.test(html);
      const imgCount = (html.match(/<img/gi) || []).length;
      const hasGallery = /gallery|portfolio|photos/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const needsAerial = ['real estate', 'property', 'construction', 'hotel',
        'resort', 'farm', 'event', 'wedding', 'tourism', 'land']
        .some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasAerial, hasVideo, imgCount > 10, hasGallery]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score: needsAerial && score < 20 ? 5 : score,
        label: score < 20 ? 'No Aerial' : score < 50 ? 'Few Aerial' : 'Aerial Content',
        opportunity: (needsAerial && !hasAerial) ? 'high' : score < 40 ? 'medium' : 'low',
        details: {
          hasAerialContent: hasAerial,
          hasVideo,
          imageCount: imgCount,
          needsAerial,
          verdict: needsAerial && !hasAerial
            ? 'Property/venue business with zero aerial content — drone footage would be a game-changer'
            : 'Some visual content but aerial perspective would elevate it',
        },
      };
    }

    case 'property_videographer': {
      const hasVideo = /youtube|vimeo|<video|<iframe/i.test(html);
      const hasVirtualTour = /virtual.*tour|360|matterport|3d.*walk/i.test(html);
      const hasGallery = /gallery|portfolio|photos/i.test(html);
      const imgCount = (html.match(/<img/gi) || []).length;
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isPropertyBusiness = ['real estate', 'property', 'estate', 'hotel',
        'resort', 'developer', 'construction'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasVideo, hasVirtualTour, hasGallery, imgCount > 10]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score: isPropertyBusiness && score < 20 ? 5 : score,
        label: !hasVideo ? 'No Video' : score < 50 ? 'Basic Video' : 'Video Tours',
        opportunity: (isPropertyBusiness && !hasVideo) ? 'high' :
                     score < 40 ? 'medium' : 'low',
        details: {
          hasVideo,
          hasVirtualTour,
          hasGallery,
          isPropertyBusiness,
          verdict: isPropertyBusiness && !hasVideo
            ? 'Property business with zero video tours — buyers expect video walkthroughs'
            : 'Video presence could be significantly improved',
        },
      };
    }

    // ── HEALTH & WELLNESS ──

    case 'nutrition_coach': {
      const hasBooking = /booking|appointment|schedule|calendly/i.test(html);
      const hasBlog = /blog|article|post|recipe/i.test(html);
      const hasServices = /service|nutrition|wellness|coach|diet|meal.*plan/i.test(html);
      const hasTestimonials = /review|testimonial|transformation|result/i.test(html);
      const hasSocial = /instagram\.com|facebook\.com|tiktok\.com/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isWellness = ['nutrition', 'wellness', 'health', 'fitness', 'diet',
        'coach', 'gym', 'spa', 'yoga', 'clinic'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasBooking, hasBlog, hasServices, hasTestimonials, hasSocial]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 30 ? 'Basic' : score < 60 ? 'Growing' : 'Established',
        opportunity: (isWellness && score < 40) ? 'high' : score < 60 ? 'medium' : 'low',
        details: {
          hasBooking, hasBlog, hasServices, hasTestimonials, hasSocial,
          verdict: isWellness && score < 40
            ? 'Wellness business with weak online presence — content marketing would attract clients'
            : 'Some presence but content and booking could be improved',
        },
      };
    }

    case 'fitness_consultant': {
      const hasBooking = /booking|appointment|schedule|calendly/i.test(html);
      const hasPrograms = /program|plan|class|session|membership|package/i.test(html);
      const hasTestimonials = /review|testimonial|transformation|result/i.test(html);
      const hasSocial = /instagram\.com|facebook\.com|tiktok\.com|youtube\.com/i.test(html);
      const hasPricing = /price|pricing|cost|fee|per.*month/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isFitness = ['gym', 'fitness', 'trainer', 'coach', 'yoga', 'pilates',
        'crossfit', 'martial', 'boxing', 'dance', 'sport'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasBooking, hasPrograms, hasTestimonials, hasSocial, hasPricing]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 30 ? 'Basic' : score < 60 ? 'Growing' : 'Established',
        opportunity: (isFitness && score < 40) ? 'high' : score < 60 ? 'medium' : 'low',
        details: {
          hasBooking, hasPrograms, hasTestimonials, hasSocial, hasPricing,
          verdict: isFitness && score < 40
            ? 'Fitness business missing online booking and social proof — major conversion gaps'
            : 'Some presence but marketing funnel has gaps',
        },
      };
    }

    // ── EVENTS ──

    case 'event_photographer': {
      const imgCount = (html.match(/<img/gi) || []).length;
      const hasGallery = /gallery|portfolio|events|photos/i.test(html);
      const hasVideo = /youtube|vimeo|<video/i.test(html);
      const hasBooking = /booking|contact|inquiry|quote|hire/i.test(html);
      const hasSocial = /instagram\.com|facebook\.com/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isEventBusiness = ['event', 'wedding', 'party', 'conference', 'venue',
        'photography', 'studio'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([imgCount > 10, hasGallery, hasVideo, hasBooking, hasSocial]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score: isEventBusiness && score < 20 ? 5 : score,
        label: score < 30 ? 'No Portfolio' : score < 60 ? 'Basic Portfolio' : 'Strong Portfolio',
        opportunity: (isEventBusiness && imgCount < 5) ? 'high' :
                     score < 40 ? 'medium' : 'low',
        details: {
          imageCount: imgCount,
          hasGallery, hasVideo, hasBooking, hasSocial,
          verdict: isEventBusiness && imgCount < 5
            ? 'Event business with no visible portfolio — clients need to see your work'
            : 'Portfolio exists but could be more prominent',
        },
      };
    }

    case 'event_videographer': {
      const hasVideo = /youtube|vimeo|<video|<iframe/i.test(html);
      const hasReels = /instagram\.com\/reel|reels|tiktok/i.test(html);
      const hasGallery = /gallery|portfolio|events/i.test(html);
      const hasBooking = /booking|contact|inquiry|quote|hire/i.test(html);
      const businessType = (lead.type as string)?.toLowerCase() || '';

      const isEventBusiness = ['event', 'wedding', 'party', 'conference', 'venue',
        'videography', 'production', 'studio'].some((t) => businessType.includes(t));

      const score = Math.round(
        ([hasVideo, hasReels, hasGallery, hasBooking]
          .filter(Boolean).length / 4) * 100
      );
      return {
        score: isEventBusiness && score < 20 ? 5 : score,
        label: !hasVideo ? 'No Video' : score < 50 ? 'Some Video' : 'Video Portfolio',
        opportunity: (isEventBusiness && !hasVideo) ? 'high' :
                     score < 40 ? 'medium' : 'low',
        details: {
          hasVideo, hasReels, hasGallery, hasBooking,
          verdict: isEventBusiness && !hasVideo
            ? 'Event videographer with no video content on their website — showreel is essential'
            : 'Video content exists but could be better showcased',
        },
      };
    }

    case 'mc_entertainer': {
      const hasVideo = /youtube|vimeo|<video|<iframe/i.test(html);
      const hasBooking = /booking|contact|inquiry|hire|availability/i.test(html);
      const hasTestimonials = /review|testimonial|client/i.test(html);
      const hasSocial = /instagram\.com|facebook\.com|tiktok\.com|youtube\.com/i.test(html);
      const hasEvents = /event|wedding|party|conference|concert|show/i.test(html);

      const score = Math.round(
        ([hasVideo, hasBooking, hasTestimonials, hasSocial, hasEvents]
          .filter(Boolean).length / 5) * 100
      );
      return {
        score,
        label: score < 30 ? 'No Presence' : score < 60 ? 'Basic' : 'Professional',
        opportunity: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        details: {
          hasVideo, hasBooking, hasTestimonials, hasSocial, hasEvents,
          verdict: score < 40
            ? 'Entertainer with minimal online presence — video clips and booking system would generate leads'
            : 'Some presence but marketing funnel has gaps',
        },
      };
    }

    default:
      return null;
  }
};

export async function POST(request: NextRequest) {
  const userToken = getToken();
  if (!userToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { lead?: Record<string, unknown>; freelancerType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { lead, freelancerType } = body;

  if (!lead || !freelancerType) {
    return NextResponse.json({ error: 'lead and freelancerType required' }, { status: 400 });
  }

  const result = await runChecks(lead, freelancerType);

  if (!result) {
    return NextResponse.json({ error: 'Unknown freelancer type' }, { status: 400 });
  }

  return NextResponse.json(result);
}
