/**
 * Background Service Worker
 * Handles communication between content script, sidepanel, and Claude API
 */

const STORAGE_KEYS = {
  API_KEY: 'anthropic_api_key',
  WATCH_LIST: 'watchlist',
  HISTORY: 'price_history',
  ALERTS: 'alerts'
};

class StockTrackerBackground {
  constructor() {
    this.chatHistory = [];
    this.currentChartData = null;
    this.watchlist = [];
    this.priceHistory = {};
    this.initialize();
  }

  async initialize() {
    const stored = await chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.WATCH_LIST]);
    if (stored[STORAGE_KEYS.WATCH_LIST]) {
      this.watchlist = stored[STORAGE_KEYS.WATCH_LIST];
    }
  }

  async sendToClaude(userMessage, context = {}) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return { error: 'API key not configured. Please set your Anthropic API key in settings.' };
    }

    this.chatHistory.push({
      role: 'user',
      content: userMessage
    });

    const systemPrompt = `You are Nate's Stock Tracker AI, an expert financial analyst and trading assistant. 
You have access to real-time TradingView data and provide insightful analysis on stocks, technical indicators, and market trends.

Current Chart Data:
${JSON.stringify(this.currentChartData, null, 2)}

Context Information:
${JSON.stringify(context, null, 2)}

Provide clear, actionable insights. Include technical analysis, support/resistance levels, trend analysis, and trading recommendations when relevant.
Always consider risk management and mention potential risks.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: this.chatHistory
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.content[0].text;

      this.chatHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return {
        success: true,
        message: assistantMessage,
        usage: data.usage
      };
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        error: error.message || 'Failed to communicate with Claude API'
      };
    }
  }

  async getApiKey() {
    const stored = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
    return stored[STORAGE_KEYS.API_KEY] || null;
  }

  async setApiKey(apiKey) {
    await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: apiKey });
  }

  addToWatchlist(symbol) {
    if (!this.watchlist.includes(symbol)) {
      this.watchlist.push(symbol);
      chrome.storage.local.set({ [STORAGE_KEYS.WATCH_LIST]: this.watchlist });
      return true;
    }
    return false;
  }

  removeFromWatchlist(symbol) {
    const index = this.watchlist.indexOf(symbol);
    if (index > -1) {
      this.watchlist.splice(index, 1);
      chrome.storage.local.set({ [STORAGE_KEYS.WATCH_LIST]: this.watchlist });
      return true;
    }
    return false;
  }

  storePrice(symbol, price, timestamp) {
    if (!this.priceHistory[symbol]) {
      this.priceHistory[symbol] = [];
    }
    this.priceHistory[symbol].push({ price, timestamp });
    if (this.priceHistory[symbol].length > 1000) {
      this.priceHistory[symbol].shift();
    }
    chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: this.priceHistory });
  }

  getPriceHistory(symbol) {
    return this.priceHistory[symbol] || [];
  }
}

const tracker = new StockTrackerBackground();

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Listen for messages from sidepanel and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'chartDataUpdate') {
    tracker.currentChartData = request.data;
    if (request.data.symbol && request.data.price) {
      tracker.storePrice(request.data.symbol, request.data.price, request.data.timestamp);
    }
  } else if (request.action === 'sendToClaude') {
    tracker.sendToClaude(request.message, request.context).then(response => {
      sendResponse(response);
    });
    return true;
  } else if (request.action === 'setApiKey') {
    tracker.setApiKey(request.apiKey).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'getWatchlist') {
    sendResponse({ watchlist: tracker.watchlist });
  } else if (request.action === 'addToWatchlist') {
    const success = tracker.addToWatchlist(request.symbol);
    sendResponse({ success });
  } else if (request.action === 'removeFromWatchlist') {
    const success = tracker.removeFromWatchlist(request.symbol);
    sendResponse({ success });
  } else if (request.action === 'getPriceHistory') {
    const history = tracker.getPriceHistory(request.symbol);
    sendResponse({ history });
  } else if (request.action === 'getCurrentChartData') {
    sendResponse({ data: tracker.currentChartData });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-side-panel') {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Periodic cleanup of old price history
setInterval(() => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  Object.keys(tracker.priceHistory).forEach(symbol => {
    tracker.priceHistory[symbol] = tracker.priceHistory[symbol].filter(entry => {
      return new Date(entry.timestamp).getTime() > oneDayAgo;
    });
  });
}, 60 * 60 * 1000);