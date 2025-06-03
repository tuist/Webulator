class SimulatorElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.deviceName = 'iPhone 16';
  }

  static get observedAttributes() {
    return ['name'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name' && newValue) {
      this.deviceName = newValue;
      this.render();
    }
  }

  connectedCallback() {
    this.deviceName = this.getAttribute('name') || 'iPhone 16';
    this.render();
  }

  getDeviceSpecs(deviceName) {
    const specs = {
      'iPhone 16': {
        width: '393px',
        height: '852px',
        scale: '0.5',
        borderRadius: '47px',
        notchWidth: '126px',
        notchHeight: '30px',
        homeIndicatorWidth: '134px'
      },
      'iPhone 16 Pro': {
        width: '393px',
        height: '852px',
        scale: '0.5',
        borderRadius: '47px',
        notchWidth: '126px',
        notchHeight: '30px',
        homeIndicatorWidth: '134px'
      },
      'iPhone 15': {
        width: '393px',
        height: '852px',
        scale: '0.5',
        borderRadius: '47px',
        notchWidth: '126px',
        notchHeight: '30px',
        homeIndicatorWidth: '134px'
      }
    };
    return specs[deviceName] || specs['iPhone 16'];
  }

  render() {
    const specs = this.getDeviceSpecs(this.deviceName);
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .device-frame {
          position: relative;
          height: 80vh;
          width: calc(80vh / 2.17);
          max-height: 800px;
          max-width: calc(800px / 2.17);
          min-height: 400px;
          min-width: calc(400px / 2.17);
          background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
          border-radius: 50px;
          padding: 8px;
          box-shadow: 
            0 0 0 2px #333,
            0 0 0 3px #111,
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .screen {
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 42px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .dynamic-island {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 30px;
          background: #000;
          border-radius: 15px;
          z-index: 10;
          box-shadow: 
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .content-area {
          width: 100%;
          height: 100%;
          background: #f0f0f0;
          border-radius: 42px;
          position: relative;
          overflow: hidden;
        }

        .home-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 134px;
          height: 5px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 3px;
          z-index: 10;
        }

        .status-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 44px;
          background: rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          font-size: 14px;
          font-weight: 600;
          z-index: 5;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .status-right {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .signal-dots {
          display: flex;
          gap: 2px;
        }

        .signal-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #000;
        }

        .content-iframe {
          position: absolute;
          top: 44px;
          left: 0;
          right: 0;
          bottom: 20px;
          border: none;
          width: 100%;
          background: #fff;
        }

        .device-label {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 14px;
          color: #666;
          font-weight: 500;
          white-space: nowrap;
        }

        .loading-screen {
          position: absolute;
          top: 44px;
          left: 0;
          right: 0;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #fff;
          color: #333;
        }

        .apple-logo {
          width: 50px;
          height: 50px;
          background: #000;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'/%3E%3C/svg%3E") no-repeat center;
          mask-size: contain;
          margin-bottom: 20px;
        }

        .loading-text {
          font-size: 16px;
          margin-bottom: 10px;
        }

        .loading-subtitle {
          font-size: 12px;
          color: #666;
        }
      </style>

      <div class="device-frame">
        <div class="screen">
          <div class="dynamic-island"></div>
          
          <div class="status-bar">
            <div class="status-left">
              <span>9:41</span>
            </div>
            <div class="status-right">
              <div class="signal-dots">
                <div class="signal-dot"></div>
                <div class="signal-dot"></div>
                <div class="signal-dot"></div>
                <div class="signal-dot"></div>
              </div>
              <span>WiFi</span>
            </div>
          </div>

          <div class="content-area">
            <div class="loading-screen" id="loadingScreen">
              <div class="apple-logo"></div>
              <div class="loading-text">Webulator</div>
              <div class="loading-subtitle">Loading your app...</div>
            </div>
            <iframe class="content-iframe" id="contentFrame" style="display: none;"></iframe>
          </div>

          <div class="home-indicator"></div>
        </div>
        <div class="device-label">${this.deviceName}</div>
      </div>
    `;

    // Bind methods
    this.loadContent = this.loadContent.bind(this);
  }

  loadContent(url) {
    const iframe = this.shadowRoot.getElementById('contentFrame');
    const loadingScreen = this.shadowRoot.getElementById('loadingScreen');
    
    if (url) {
      iframe.src = url;
      iframe.onload = () => {
        setTimeout(() => {
          loadingScreen.style.display = 'none';
          iframe.style.display = 'block';
        }, 1000);
      };
    }
  }

  navigate(url) {
    this.loadContent(url);
  }

  showLoading() {
    const iframe = this.shadowRoot.getElementById('contentFrame');
    const loadingScreen = this.shadowRoot.getElementById('loadingScreen');
    
    iframe.style.display = 'none';
    loadingScreen.style.display = 'flex';
  }
}

// Register the custom element
customElements.define('webulator-simulator', SimulatorElement); 