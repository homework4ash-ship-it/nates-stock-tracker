/**
 * Side Panel Controller
 * Main UI and Claude AI integration
 */

class SidePanelController {
  constructor() {
    this.currentData = null;
    this.chatHistory = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.startDataRefresh();
    this.loadInitialData();
  }

  setupEventListeners() {
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('closeModal').addEventListener('click', () => this.closeSettings());
    document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

    // Chat
    document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Watchlist
    document.getElementById('addToWatchlistBtn').addEventListener('click', () => this.addCurrentToWatchlist());

    // Close settings modal on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
      if (e.target.id === 'settingsModal') this.closeSettings();
    });
  }

  startDataRefresh() {
    // Update data every 2 seconds
    setInterval(() => this.loadCurrentData(), 2000);
  }

  loadInitialData() {
    this.loadCurrentData();
    this.loadWatchlist();
  }

  async loadCurrentData() {
    try {
      // Get data from active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0] || !tabs[0].url.includes('tradingview.com')) {
        this.displayNoData();
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'getChartData' }, (response) => {
        if (response && !chrome.runtime.lastError) {
          this.currentData = response;
          this.updateDisplay(response);
          // Also get from background for historical context
          chrome.runtime.sendMessage({ action: 'getCurrentChartData' }, () => {});
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  updateDisplay(data) {
    // Symbol and Price
    document.getElementById('symbolDisplay').textContent = data.symbol || '--';
    document.getElementById('currentPrice').textContent = data.priceFormatted || '--';
    
    // Price change
    const changeElement = document.getElementById('priceChange');
    if (data.change !== null) {
      const changeClass = data.change >= 0 ? 'positive' : 'negative';
      changeElement.textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
      changeElement.className = `price-change ${changeClass}`;
    }

    // Data cards
    document.getElementById('timeframeDisplay').textContent = data.timeframe || '--';
    document.getElementById('volumeDisplay').textContent = data.volumeFormatted || '--';
    document.getElementById('high52wDisplay').textContent = data.high52w ? `$${data.high52w.toFixed(2)}` : '--';
    document.getElementById('low52wDisplay').textContent = data.low52w ? `$${data.low52w.toFixed(2)}` : '--';
    document.getElementById('peRatioDisplay').textContent = data.peRatio ? data.peRatio.toFixed(2) : '--';
    document.getElementById('rsiDisplay').textContent = data.rsi ? data.rsi.toFixed(2) : '--';

    // Technical indicators
    document.getElementById('ma20Display').textContent = data.movingAverages.ma20 ? `$${data.movingAverages.ma20.toFixed(2)}` : '--';
    document.getElementById('ma50Display').textContent = data.movingAverages.ma50 ? `$${data.movingAverages.ma50.toFixed(2)}` : '--';
    document.getElementById('ma200Display').textContent = data.movingAverages.ma200 ? `$${data.movingAverages.ma200.toFixed(2)}` : '--';

    // Support and Resistance
    this.updateLevels('resistanceList', data.resistance);
    this.updateLevels('supportList', data.support);
  }

  updateLevels(elementId, levels) {
    const container = document.getElementById(elementId);
    if (levels && levels.length > 0) {
      container.innerHTML = levels.map(level => `<div class="level-item">$${level.toFixed(2)}</div>`).join('');
    } else {
      container.textContent = '--';
    }
  }

  displayNoData() {
    document.getElementById('symbolDisplay').textContent = 'No Data';
    document.getElementById('currentPrice').textContent = '--';
    document.querySelector('.chart-data').innerHTML = '<p style="text-align:center;color:#999;">Navigate to TradingView to view data</p>';
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    this.addChatMessage('user', message);
    input.value = '';
    this.setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sendToClaude',
        message: message,
        context: {
          currentStock: this.currentData?.symbol,
          price: this.currentData?.price,
          change: this.currentData?.change,
          rsi: this.currentData?.rsi,
          movingAverages: this.currentData?.movingAverages
        }
      });

      this.setLoading(false);

      if (response.error) {
        this.addChatMessage('system', `Error: ${response.error}`);
      } else {
        this.addChatMessage('assistant', response.message);
      }
    } catch (error) {
      this.setLoading(false);
      this.addChatMessage('system', `Error: ${error.message}`);
    }
  }

  addChatMessage(role, content) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message-${role}`;
    messageDiv.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  setLoading(loading) {
    this.isLoading = loading;
    const indicator = document.getElementById('loadingIndicator');
    if (loading) {
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  }

  openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
  }

  closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
  }

  async saveSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    chrome.runtime.sendMessage({ action: 'setApiKey', apiKey }, (response) => {
      if (response.success) {
        alert('Settings saved successfully!');
        this.closeSettings();
      }
    });
  }

  async loadWatchlist() {
    chrome.runtime.sendMessage({ action: 'getWatchlist' }, (response) => {
      if (response.watchlist && response.watchlist.length > 0) {
        this.displayWatchlist(response.watchlist);
      }
    });
  }

  displayWatchlist(symbols) {
    const container = document.getElementById('watchlistContainer');
    container.innerHTML = symbols.map(symbol => `
      <div class="watchlist-item">
        <span>${symbol}</span>
        <button class="remove-btn" data-symbol="${symbol}">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const symbol = e.target.dataset.symbol;
        chrome.runtime.sendMessage({ action: 'removeFromWatchlist', symbol }, () => {
          this.loadWatchlist();
        });
      });
    });
  }

  addCurrentToWatchlist() {
    if (!this.currentData || !this.currentData.symbol) {
      alert('No stock data available');
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'addToWatchlist', symbol: this.currentData.symbol },
      (response) => {
        if (response.success) {
          alert(`${this.currentData.symbol} added to watchlist!`);
          this.loadWatchlist();
        } else {
          alert(`${this.currentData.symbol} is already in watchlist`);
        }
      }
    );
  }
}

// Initialize
const controller = new SidePanelController();