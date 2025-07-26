// PWA Registration Script
export const registerPWA = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Show update notification
const showUpdateNotification = () => {
  const notification = document.createElement('div');
  notification.className = 'pwa-install-prompt';
  notification.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-semibold">Update Available</h3>
      <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
        ✕
      </button>
    </div>
    <p class="text-sm text-gray-600 mb-3">A new version of Upskillr Spark is available.</p>
    <button onclick="window.location.reload()" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
      Update Now
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
};

// Install prompt
export const showInstallPrompt = () => {
  let deferredPrompt: any;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installButton = document.createElement('div');
    installButton.className = 'pwa-install-prompt';
    installButton.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">Install Upskillr Spark</h3>
        <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <p class="text-sm text-gray-600 mb-3">Install our app for a better experience!</p>
      <button onclick="installApp()" class="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
        Install App
      </button>
    `;
    
    document.body.appendChild(installButton);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (installButton.parentElement) {
        installButton.remove();
      }
    }, 15000);
  });
  
  // Global install function
  (window as any).installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      
      // Remove install prompt
      const prompt = document.querySelector('.pwa-install-prompt');
      if (prompt) {
        prompt.remove();
      }
    }
  };
};

// Offline/Online detection
export const setupOfflineDetection = () => {
  const updateOnlineStatus = () => {
    const status = document.createElement('div');
    status.id = 'connection-status';
    status.className = `fixed top-4 right-4 z-50 px-3 py-2 rounded text-sm font-medium ${
      navigator.onLine 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`;
    status.textContent = navigator.onLine ? 'Online' : 'Offline';
    
    // Remove existing status
    const existingStatus = document.getElementById('connection-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    document.body.appendChild(status);
    
    // Auto-remove online status after 3 seconds
    if (navigator.onLine) {
      setTimeout(() => {
        if (status.parentElement) {
          status.remove();
        }
      }, 3000);
    }
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
};

// Initialize PWA features
export const initializePWA = () => {
  registerPWA();
  showInstallPrompt();
  setupOfflineDetection();
}; 