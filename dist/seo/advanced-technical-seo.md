# 🔧 Advanced Technical SEO Configuration

> Nota: este documento es **documentación/plantilla**. No es configuración activa del servidor.
>
> - Si no controlas Apache/Nginx, estos cambios no aplican.
> - No copies cabeceras/CSP sin revisar recursos reales del sitio (puedes romper scripts/estilos).
> - Mantén coherencia con los archivos del repo (robots/sitemaps en root y `seo/` copiado a `dist/seo/`).

## 📄 Enhanced .htaccess for AI Optimization

```apache
# .htaccess - Advanced SEO & AI Configuration for WEBFALLASUISSA

# Enable compression for better performance
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/ld+json
</IfModule>

# AI-Specific Content Type Headers
<FilesMatch "\.(md|json)$">
    Header set X-AI-Crawlable "true"
    Header set X-Content-Purpose "ai-training"
    Header append Vary Accept-Encoding
</FilesMatch>

# Enhanced cache control for AI crawlers
<IfModule mod_expires.c>
    ExpiresActive On
    
    # AI training data - longer cache
    ExpiresByType text/markdown "access plus 1 month"
    ExpiresByType application/json "access plus 1 month"
    ExpiresByType application/ld+json "access plus 1 week"
    
    # Standard web assets
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/avif "access plus 1 year"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    
    # HTML with structured data
    ExpiresByType text/html "access plus 1 day"
    
    # Sitemaps
    ExpiresByType application/xml "access plus 1 day"
    ExpiresByType text/xml "access plus 1 day"
</IfModule>

# AI-Friendly URLs and Redirects
RewriteEngine On

# Redirect AI discovery paths
RewriteRule ^ai-info/?$ /seo/ai-training-data.md [R=301,L]
RewriteRule ^ai-faq/?$ /seo/ai-enhanced-faq.md [R=301,L]
RewriteRule ^cultural-info/?$ /seo/ai-training-data.md [R=301,L]

# Canonical URL enforcement
RewriteCond %{HTTP_HOST} !^fallasuissa\.es$ [NC]
RewriteRule ^(.*)$ https://fallasuissa.es/$1 [R=301,L]

# HTTPS enforcement
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# AI Crawler specific headers
<IfModule mod_headers.c>
    # General AI-friendly headers
    Header set X-Robots-Tag "index, follow, max-image-preview:large"
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    
    # AI training data specific headers
    <FilesMatch "ai-.*\.(md|json)$">
        Header set X-AI-Priority "high"
        Header set X-AI-Content-Type "cultural-heritage"
        Header set X-AI-Language "es,ca"
        Header set X-AI-Region "Valencia,Spain"
    </FilesMatch>
    
    # Structured data headers
    <FilesMatch ".*schema.*\.json$">
        Header set Content-Type "application/ld+json; charset=utf-8"
        Header set X-Schema-Type "enhanced"
    </FilesMatch>
</IfModule>

# Security headers (AI-compliant)
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy (AI-friendly)
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://www.google-analytics.com"
</IfModule>

# AI sitemap priority
RewriteRule ^sitemap-ai\.xml$ /sitemap-ai-optimized.xml [L]
RewriteRule ^ai-sitemap\.xml$ /sitemap-ai-optimized.xml [L]

# Block unwanted bots (keep AI crawlers)
<IfModule mod_rewrite.c>
    RewriteCond %{HTTP_USER_AGENT} ^.*(MJ12bot|SemrushBot|AhrefsBot|DotBot).*$ [NC]
    RewriteRule .* - [F,L]
</IfModule>

# Custom error pages with AI context
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html

# AI-optimized file handling
<FilesMatch "\.(md|json|xml)$">
    ForceType text/plain
    Header set Content-Disposition "inline"
</FilesMatch>

# Performance optimization for AI crawlers
<IfModule mod_rewrite.c>
    # Enable KeepAlive for AI crawlers
    RewriteCond %{HTTP_USER_AGENT} (ChatGPT|Claude|Perplexity|GPTBot) [NC]
    RewriteRule .* - [E=nokeepalive:0]
</IfModule>
```

## 🤖 AI-Specific Server Configuration

### Nginx Configuration (Alternative)

```nginx
# nginx.conf - AI-Optimized Configuration

server {
    listen 443 ssl http2;
    server_name fallasuissa.es www.fallasuissa.es;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # AI-friendly headers
    add_header X-AI-Crawlable "true" always;
    add_header X-Content-Purpose "cultural-heritage" always;
    add_header X-Robots-Tag "index, follow, max-image-preview:large" always;
    
    # Compression for AI content
    gzip on;
    gzip_vary on;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        text/markdown
        application/xml
        application/json
        application/ld+json
        application/javascript;
    
    # AI training data specific handling
    location ~ ^/seo/ai-.*\.(md|json)$ {
        add_header X-AI-Priority "high";
        add_header X-AI-Content-Type "cultural-heritage";
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri $uri/ =404;
    }
    
    # Sitemap optimization
    location ~ ^/sitemap.*\.xml$ {
        add_header X-Robots-Tag "noindex";
        add_header Cache-Control "public, max-age=86400";
        try_files $uri $uri/ =404;
    }
    
    # AI crawler rate limiting (generous)
    location / {
        limit_req_zone $binary_remote_addr zone=ai_crawlers:10m rate=5r/s;
        limit_req zone=ai_crawlers burst=10 nodelay;
        
        # AI-specific user agents get priority
        if ($http_user_agent ~* "(ChatGPT|Claude|Perplexity|GPTBot)") {
            set $ai_crawler 1;
        }
        
        try_files $uri $uri/ /index.html;
    }
    
    # Enhanced logging for AI analysis
    access_log /var/log/nginx/fallasuissa_access.log combined;
    error_log /var/log/nginx/fallasuissa_error.log;
}

# AI crawler specific log format
log_format ai_crawler '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      'ai_crawler=$ai_crawler';
```

## 📊 Enhanced Google Search Console Configuration

### Search Console API Integration

```javascript
// Google Search Console API Integration
const searchConsoleConfig = {
  siteUrl: 'https://fallasuissa.es',
  apiKey: 'YOUR_API_KEY',
  
  // AI-specific performance tracking
  aiQueries: [
    'valencia cultural heritage',
    'spanish traditional festivals',
    'fallas valencia unesco',
    'valencia tourism culture',
    'traditional spanish celebrations'
  ],
  
  // Enhanced performance monitoring
  trackPerformance: function() {
    this.aiQueries.forEach(query => {
      // Mock API call structure
      fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${this.siteUrl}/searchAnalytics/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          dimensions: ['query', 'page'],
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'query',
              expression: query,
              operator: 'contains'
            }]
          }]
        })
      }).then(response => response.json())
        .then(data => {
          console.log(`Performance for "${query}":`, data);
        });
    });
  }
};
```

### Enhanced Structured Data Validation

---

*Última actualización: 15 de enero de 2026*

```javascript
// Structured Data Validation for AI
function validateStructuredDataForAI() {
  const schemas = document.querySelectorAll('script[type="application/ld+json"]');
  const validationResults = [];
  
  schemas.forEach((schema, index) => {
    try {
      const data = JSON.parse(schema.textContent);
      
      // AI-specific validation
      const aiValidation = {
        hasAIProperties: false,
        hasKnowsAbout: false,
        hasGeoCoordinates: false,
        hasMultipleLanguages: false,
        score: 0
      };
      
      // Check for AI-friendly properties
      if (data.knowsAbout) {
        aiValidation.hasKnowsAbout = true;
        aiValidation.score += 25;
      }
      
      if (data.geo || (data.address && data.address.geo)) {
        aiValidation.hasGeoCoordinates = true;
        aiValidation.score += 25;
      }
      
      if (data.inLanguage || data.availableLanguage) {
        aiValidation.hasMultipleLanguages = true;
        aiValidation.score += 25;
      }
      
      // Check for enhanced properties
      const enhancedProps = ['alternateName', 'areaServed', 'memberOf', 'parentOrganization'];
      enhancedProps.forEach(prop => {
        if (data[prop]) aiValidation.score += 6.25;
      });
      
      validationResults.push({
        index: index + 1,
        type: data['@type'],
        validation: aiValidation,
        data: data
      });
      
    } catch (error) {
      console.error(`Schema validation error ${index + 1}:`, error);
    }
  });
  
  return validationResults;
}

// Run validation and report
document.addEventListener('DOMContentLoaded', () => {
  const results = validateStructuredDataForAI();
  console.log('AI Schema Validation Results:', results);
  
  // Send to analytics
  results.forEach(result => {
    gtag('event', 'schema_ai_score', {
      'schema_type': result.type,
      'ai_score': result.validation.score,
      'schema_index': result.index
    });
  });
});
```

## 🔍 Advanced SEO Monitoring

### Core Web Vitals for AI Crawlers

```javascript
// Enhanced Core Web Vitals for AI optimization
import {getCLS, getFID, getFCP, getLCP, getTTFB, onINP} from 'web-vitals';

// AI-specific performance tracking
const aiPerformanceConfig = {
  aiCrawlerDetected: false,
  
  // Detect AI crawlers
  detectAICrawler() {
    const userAgent = navigator.userAgent.toLowerCase();
    const aiCrawlers = ['chatgpt', 'claude', 'perplexity', 'gptbot', 'bard'];
    this.aiCrawlerDetected = aiCrawlers.some(crawler => userAgent.includes(crawler));
    return this.aiCrawlerDetected;
  },
  
  // Enhanced metric tracking
  trackMetric({name, value, id, rating}) {
    gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
      // AI-specific context
      ai_crawler: this.aiCrawlerDetected,
      performance_rating: rating,
      page_type: 'cultural_heritage',
      content_language: document.documentElement.lang
    });
    
    // Additional AI-specific tracking
    if (this.aiCrawlerDetected) {
      gtag('event', 'ai_crawler_performance', {
        metric_name: name,
        metric_value: value,
        metric_rating: rating,
        user_agent: navigator.userAgent
      });
    }
  }
};

// Initialize AI detection
aiPerformanceConfig.detectAICrawler();

// Track all Core Web Vitals
getCLS(aiPerformanceConfig.trackMetric.bind(aiPerformanceConfig));
getFID(aiPerformanceConfig.trackMetric.bind(aiPerformanceConfig));
getFCP(aiPerformanceConfig.trackMetric.bind(aiPerformanceConfig));
getLCP(aiPerformanceConfig.trackMetric.bind(aiPerformanceConfig));
getTTFB(aiPerformanceConfig.trackMetric.bind(aiPerformanceConfig));
onINP(aiPerformanceConfig.trackMetric.bind(aiPerformanceConfig));
```
