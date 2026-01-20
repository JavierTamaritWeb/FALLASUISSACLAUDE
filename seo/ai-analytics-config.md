# 📊 AI Analytics & SEO Tracking for WEBFALLASUISSA

> Nota: este documento es una **propuesta/plantilla**. No pegues estos snippets en producción sin:
> - Consentimiento/cumplimiento (RGPD/LOPDGDD, cookies, etc.)
> - Revisar dependencias reales (si el sitio carga GA/GTAG, píxeles, etc.)
> - Verificar que los eventos/dimensiones existen en tu propiedad

## 🤖 AI-Specific Tracking Configuration

### Google Analytics 4 Enhanced Configuration
```javascript
// Enhanced GA4 Configuration for AI Tracking
gtag('config', 'GA_MEASUREMENT_ID', {
  // AI-specific custom dimensions
  custom_map: {
    'ai_referrer': 'dimension1',
    'search_intent': 'dimension2',
    'cultural_interest': 'dimension3',
    'language_preference': 'dimension4'
  },
  
  // Enhanced ecommerce for cultural events
  enhanced_conversions: true,
  
  // AI-friendly content grouping
  content_group1: 'Cultural_Heritage',
  content_group2: 'Valencia_Tourism',
  content_group3: 'UNESCO_Heritage',
  
  // Cookie consent configuration
  anonymize_ip: true,
  cookie_flags: 'SameSite=None;Secure'
});

// Track AI referrals
function trackAIReferral(source) {
  gtag('event', 'ai_referral', {
    'source': source,
    'page_title': document.title,
    'page_location': window.location.href
  });
}

// Track cultural content engagement
function trackCulturalEngagement(type, content) {
  gtag('event', 'cultural_engagement', {
    'engagement_type': type,
    'content_category': content,
    'language': document.documentElement.lang
  });
}
```

### AI-Optimized Meta Pixel (Facebook)
```javascript
// Enhanced Meta Pixel for AI optimization
fbq('init', 'PIXEL_ID');
fbq('track', 'PageView', {
  content_category: 'Cultural Heritage',
  content_name: 'Fallas Valencia',
  content_type: 'UNESCO Heritage Site',
  content_ids: ['falla_suissa', 'valencia_tourism'],
  value: 0,
  currency: 'EUR'
});

// Custom events for AI understanding
fbq('trackCustom', 'CulturalInterest', {
  heritage_type: 'UNESCO Intangible',
  region: 'Valencia',
  festival: 'Las Fallas'
});
```

### Schema.org Monitoring Script
```javascript
// Validate and monitor structured data
function validateSchemaData() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      console.log(`Schema ${index + 1} validated:`, data['@type']);
      
      // Track schema presence for AI
      gtag('event', 'schema_present', {
        'schema_type': data['@type'] || 'unknown',
        'schema_index': index + 1
      });
    } catch (error) {
      console.error(`Schema validation error ${index + 1}:`, error);
    }
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', validateSchemaData);
```

## 🎯 AI-Specific Performance Metrics

### Core Web Vitals Enhanced for AI
```javascript
// Enhanced Core Web Vitals tracking
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';

function sendToAnalytics({name, value, id}) {
  gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    non_interaction: true,
    // AI-specific context
    ai_optimized: true,
    cultural_content: true
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### AI Crawler Detection
```javascript
// Detect AI crawlers and bots
function detectAICrawler() {
  const userAgent = navigator.userAgent.toLowerCase();
  const aiCrawlers = [
    'chatgpt', 'gptbot', 'claude', 'anthropic', 
    'perplexity', 'bard', 'bing', 'copilot'
  ];
  
  const isAI = aiCrawlers.some(crawler => userAgent.includes(crawler));
  
  if (isAI) {
    // Log AI crawler visit
    console.log('AI Crawler detected:', userAgent);
    
    // Enhanced metadata for AI
    const metaAI = document.createElement('meta');
    metaAI.name = 'ai:detected';
    metaAI.content = 'true';
    document.head.appendChild(metaAI);
    
    // Track in analytics
    gtag('event', 'ai_crawler_visit', {
      'crawler_type': userAgent,
      'page_url': window.location.href
    });
  }
  
  return isAI;
}

// Run detection
detectAICrawler();
```

## 📈 SEO Performance Monitoring

### Search Console API Integration
```javascript
// Search Console performance tracking
function trackSearchPerformance() {
  // Mock implementation for Search Console data
  const searchData = {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    position: 0
  };
  
  // Track in GA4
  gtag('event', 'search_performance', {
    'impressions': searchData.impressions,
    'clicks': searchData.clicks,
    'ctr': searchData.ctr,
    'avg_position': searchData.position
  });
}
```

### Local SEO Tracking
```javascript
// Local SEO and map integration tracking
function trackLocalSEO() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      // Falla Suïssa coordinates
      const fallaLat = 39.4537245;
      const fallaLng = -0.3376502;
      
      // Calculate distance
      const distance = calculateDistance(userLat, userLng, fallaLat, fallaLng);
      
      gtag('event', 'local_proximity', {
        'distance_km': Math.round(distance),
        'is_local': distance < 50 ? 'yes' : 'no',
        'region': distance < 50 ? 'Valencia' : 'External'
      });
    });
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

trackLocalSEO();

---

*Última actualización: 15 de enero de 2026*
```

## 🔍 AI Content Analysis Tools

### Content Sentiment Analysis
```javascript
// Simple sentiment analysis for AI content optimization
function analyzeContentSentiment() {
  const content = document.body.innerText;
  const positiveWords = ['tradición', 'cultura', 'patrimonio', 'unesco', 'valencia', 'fiesta', 'celebración'];
  const negativeWords = ['problema', 'cancelado', 'cerrado'];
  
  let sentiment = 0;
  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    sentiment += (content.match(regex) || []).length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    sentiment -= (content.match(regex) || []).length;
  });
  
  gtag('event', 'content_sentiment', {
    'sentiment_score': sentiment,
    'content_type': 'cultural_heritage'
  });
  
  return sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral';
}

// Run sentiment analysis
document.addEventListener('DOMContentLoaded', analyzeContentSentiment);
```

### AI-Friendly Content Structure
```javascript
// Analyze page structure for AI comprehension
function analyzePageStructure() {
  const structure = {
    headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    paragraphs: document.querySelectorAll('p').length,
    lists: document.querySelectorAll('ul, ol').length,
    images: document.querySelectorAll('img[alt]').length,
    links: document.querySelectorAll('a[href]').length,
    schemas: document.querySelectorAll('script[type="application/ld+json"]').length
  };
  
  gtag('event', 'content_structure', {
    'structure_score': Object.values(structure).reduce((a, b) => a + b, 0),
    'ai_readability': 'high'
  });
  
  return structure;
}

document.addEventListener('DOMContentLoaded', analyzePageStructure);
```
