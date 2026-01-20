// js/pwa-manager.js
// Gestor de funcionalidades PWA

class PWAManager {
  constructor() {
    this.isInstalled = this.checkInstallStatus();
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    // Configurar Service Worker
    this.setupServiceWorker();
    
    // Configurar install prompt
    this.setupInstallPrompt();
    
    // Configurar notificaciones
    this.setupNotifications();
    
    // Configurar background sync
    this.setupBackgroundSync();
    
    // Configurar update checker
    this.setupUpdateChecker();
    
    // Configurar offline status
    this.setupOfflineStatus();
  }

  checkInstallStatus() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  async setupServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker no soportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Siempre verificar actualizaciones
      });

      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Verificar si hay SW en espera
      if (registration.waiting) {
        this.showUpdateAvailable();
      }

      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  }

  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.showUpdateAvailable();
      }
    });
  }

  showUpdateAvailable() {
    // Crear notificación de actualización
    const updateNotification = document.createElement('div');
    updateNotification.className = 'pwa-update-notification';
    updateNotification.innerHTML = `
      <div class="update-content">
        <span>🔄 Nueva versión disponible</span>
        <button id="update-btn">Actualizar</button>
        <button id="dismiss-btn">×</button>
      </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    // Manejar botones
    document.getElementById('update-btn').addEventListener('click', () => {
      this.updateApp();
    });
    
    document.getElementById('dismiss-btn').addEventListener('click', () => {
      updateNotification.remove();
    });
  }

  updateApp() {
    // Enviar mensaje al SW para que se active
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Recargar página
    window.location.reload();
  }

  setupInstallPrompt() {
    // Capturar evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Detectar instalación exitosa
    window.addEventListener('appinstalled', (e) => {
      console.log('PWA instalada exitosamente');
      this.hideInstallButton();
      this.trackInstallation();
    });
  }

  showInstallButton() {
    if (this.isInstalled) return;

    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-button';
    installButton.innerHTML = `
      <span>📱</span>
      <span>Instalar App</span>
    `;
    
    installButton.addEventListener('click', () => {
      this.promptInstall();
    });
    
    // Añadir botón al header
    const header = document.querySelector('.header__barra');
    if (header) {
      header.appendChild(installButton);
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.remove();
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;

    // Mostrar prompt de instalación
    this.deferredPrompt.prompt();
    
    // Esperar respuesta del usuario
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalación');
    } else {
      console.log('Usuario rechazó instalación');
    }
    
    this.deferredPrompt = null;
  }

  async setupNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Verificar permisos
    let permission = Notification.permission;
    
    if (permission === 'default') {
      // Pedir permisos de forma no intrusiva
      this.showNotificationOptIn();
    }
  }

  showNotificationOptIn() {
    const optInBanner = document.createElement('div');
    optInBanner.className = 'notification-opt-in';
    optInBanner.innerHTML = `
      <div class="opt-in-content">
        <span>🔔 ¿Recibir notificaciones de eventos?</span>
        <button id="allow-notifications">Permitir</button>
        <button id="deny-notifications">No gracias</button>
      </div>
    `;
    
    document.body.appendChild(optInBanner);
    
    document.getElementById('allow-notifications').addEventListener('click', async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.subscribeToNotifications();
      }
      optInBanner.remove();
    });
    
    document.getElementById('deny-notifications').addEventListener('click', () => {
      optInBanner.remove();
    });
  }

  async subscribeToNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Configurar push subscription (necesitaría servidor VAPID)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
      });
      
      // Enviar subscription al servidor
      await this.sendSubscriptionToServer(subscription);
      
      console.log('Suscrito a notificaciones push');
    } catch (error) {
      console.error('Error suscribiendo a notificaciones:', error);
    }
  }

  setupBackgroundSync() {
    // Registrar background sync para formularios offline
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Configurar sync para envío de formularios
        window.addEventListener('online', () => {
          registration.sync.register('form-sync');
        });
      });
    }
  }

  setupUpdateChecker() {
    // Verificar actualizaciones periódicamente
    setInterval(() => {
      this.checkForUpdates();
    }, 30000); // Cada 30 segundos
  }

  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  }

  setupOfflineStatus() {
    // Mostrar estado offline/online
    const showOfflineStatus = () => {
      const offlineBanner = document.createElement('div');
      offlineBanner.id = 'offline-banner';
      offlineBanner.className = 'offline-status';
      offlineBanner.textContent = '📴 Sin conexión - Modo offline';
      document.body.prepend(offlineBanner);
    };
    
    const hideOfflineStatus = () => {
      const offlineBanner = document.getElementById('offline-banner');
      if (offlineBanner) {
        offlineBanner.remove();
      }
    };
    
    window.addEventListener('offline', showOfflineStatus);
    window.addEventListener('online', hideOfflineStatus);
    
    // Verificar estado inicial
    if (!navigator.onLine) {
      showOfflineStatus();
    }
  }

  // Utilidades
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  async sendSubscriptionToServer(subscription) {
    // Enviar subscription al servidor para push notifications
    // Implementar según tu backend
    console.log('Subscription:', subscription);
  }

  trackInstallation() {
    // Tracking de instalación para analytics
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  }

  // API pública
  getInstallationStatus() {
    return this.isInstalled;
  }

  manualInstallPrompt() {
    this.promptInstall();
  }
}

// Inicializar PWA Manager
document.addEventListener('DOMContentLoaded', () => {
  window.pwaManager = new PWAManager();
});

// CSS para componentes PWA
const pwaStyles = document.createElement('style');
pwaStyles.textContent = `
  .pwa-install-button {
    background: linear-gradient(135deg, #ff6f61, #ff8a80);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 8px rgba(255, 111, 97, 0.3);
  }
  
  .pwa-install-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 111, 97, 0.4);
  }
  
  .pwa-update-notification {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #333;
    color: white;
    padding: 12px;
    z-index: 10000;
    transform: translateY(-100%);
    animation: slideDown 0.3s ease forwards;
  }
  
  .update-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .update-content button {
    background: #ff6f61;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 8px;
  }
  
  .notification-opt-in {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
  }
  
  .opt-in-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .offline-status {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f44336;
    color: white;
    text-align: center;
    padding: 8px;
    z-index: 10001;
    animation: slideDown 0.3s ease;
  }
  
  @keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
  
  @media (max-width: 768px) {
    .update-content,
    .opt-in-content {
      flex-direction: column;
      text-align: center;
    }
    
    .notification-opt-in {
      left: 10px;
      right: 10px;
    }
  }
`;
document.head.appendChild(pwaStyles);