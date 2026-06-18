/**
 * Content Script - TradingView Data Extractor
 * Handles all data extraction from TradingView charts
 */

const TradingViewExtractor = {
  cache: {
    lastData: null,
    lastUpdate: 0
  },
  
  extractChartData: function() {
    const data = {
      symbol: null,
      price: null,
      priceFormatted: null,
      change: null,
      changePercent: null,
      changeFormatted: null,
      timeframe: null,
      volume: null,
      volumeFormatted: null,
      marketCap: null,
      peRatio: null,
      dividend: null,
      eps: null,
      bid: null,
      ask: null,
      high52w: null,
      low52w: null,
      avgVolume: null,
      beta: null,
      rsi: null,
      macd: null,
      bollingerBands: null,
      movingAverages: {
        ma20: null,
        ma50: null,
        ma200: null
      },
      support: [],
      resistance: [],
      candleData: [],
      chartImage: null,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    try {
      // Extract Symbol
      const symbolElement = this.findElement([
        '[data-testid="symbol"]',
        '.tv-symbol-header__symbol',
        '.symbol-header-title__title',
        '[class*="symbolName"]'
      ]);
      if (symbolElement) {
        data.symbol = symbolElement.textContent.trim().split('\n')[0];
      }

      // Extract Price
      const priceElement = this.findElement([
        '[data-testid="last-price"]',
        '.js-symbol-last',
        '[class*="lastPrice"]',
        '.tv-symbol-header__last'
      ]);
      if (priceElement) {
        const priceText = priceElement.textContent.trim();
        data.priceFormatted = priceText;
        data.price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
      }

      // Extract Change
      const changeElement = this.findElement([
        '[data-testid="change-abs"]',
        '.js-symbol-change',
        '[class*="changeValue"]'
      ]);
      if (changeElement) {
        const changeText = changeElement.textContent.trim();
        data.change = parseFloat(changeText.replace(/[^\d.-]/g, ''));
        data.changeFormatted = changeText;
      }

      // Extract Change Percent
      const changePercentElement = this.findElement([
        '[data-testid="change-percent"]',
        '.js-symbol-change-percent',
        '[class*="changePercent"]'
      ]);
      if (changePercentElement) {
        const percentText = changePercentElement.textContent.trim();
        data.changePercent = parseFloat(percentText.replace(/[^\d.-]/g, ''));
      }

      // Extract Timeframe
      const timeframeElement = this.findElement([
        '[data-testid="timeframe"]',
        '.js-timeframe',
        '[class*="timeframe"]',
        '.chart-toolbar__timeframe'
      ]);
      if (timeframeElement) {
        data.timeframe = timeframeElement.textContent.trim();
      }

      // Extract Volume
      const volumeElement = this.findElement([
        '[data-testid*="volume"]',
        '[class*="volume"]',
        'span:contains("Vol")'
      ]);
      if (volumeElement) {
        const volText = volumeElement.textContent.trim();
        data.volumeFormatted = volText;
        data.volume = this.parseNumberWithSuffix(volText);
      }

      // Extract from Watchlist/Overview if available
      this.extractFundamentals(data);
      this.extractTechnicals(data);
      this.extractLevels(data);
      this.extractCandleData(data);

    } catch (error) {
      console.error('Error extracting chart data:', error);
    }

    return data;
  },

  extractFundamentals: function(data) {
    try {
      const rows = document.querySelectorAll('[class*="overview"] tr, [class*="fundamentals"] tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          
          if (text.includes('market cap')) data.marketCap = value;
          if (text.includes('p/e ratio')) data.peRatio = parseFloat(value);
          if (text.includes('dividend')) data.dividend = value;
          if (text.includes('eps')) data.eps = parseFloat(value);
          if (text.includes('beta')) data.beta = parseFloat(value);
          if (text.includes('52 week high')) data.high52w = parseFloat(value.replace(/[^\d.-]/g, ''));
          if (text.includes('52 week low')) data.low52w = parseFloat(value.replace(/[^\d.-]/g, ''));
          if (text.includes('avg volume')) data.avgVolume = this.parseNumberWithSuffix(value);
        }
      });
    } catch (error) {
      console.error('Error extracting fundamentals:', error);
    }
  },

  extractTechnicals: function(data) {
    try {
      // Look for technical indicators in the chart or sidebar
      const indicators = document.querySelectorAll('[class*="indicator"], [class*="technical"]');
      
      indicators.forEach(indicator => {
        const text = indicator.textContent.toLowerCase();
        
        if (text.includes('rsi')) {
          const match = indicator.textContent.match(/\d+\.?\d*/);
          if (match) data.rsi = parseFloat(match[0]);
        }
        
        if (text.includes('macd')) {
          data.macd = indicator.textContent.trim();
        }
        
        if (text.includes('bollinger')) {
          data.bollingerBands = indicator.textContent.trim();
        }
        
        if (text.includes('ma20') || text.includes('sma20')) {
          const match = indicator.textContent.match(/\d+\.?\d*/);
          if (match) data.movingAverages.ma20 = parseFloat(match[0]);
        }
        
        if (text.includes('ma50') || text.includes('sma50')) {
          const match = indicator.textContent.match(/\d+\.?\d*/);
          if (match) data.movingAverages.ma50 = parseFloat(match[0]);
        }
        
        if (text.includes('ma200') || text.includes('sma200')) {
          const match = indicator.textContent.match(/\d+\.?\d*/);
          if (match) data.movingAverages.ma200 = parseFloat(match[0]);
        }
      });
    } catch (error) {
      console.error('Error extracting technicals:', error);
    }
  },

  extractLevels: function(data) {
    try {
      // Extract support and resistance levels
      const levels = document.querySelectorAll('[class*="level"], [class*="support"], [class*="resistance"]');
      const supportLevels = [];
      const resistanceLevels = [];

      levels.forEach(level => {
        const text = level.textContent.trim();
        const price = parseFloat(text);
        
        if (!isNaN(price)) {
          if (level.textContent.toLowerCase().includes('support')) {
            supportLevels.push(price);
          } else if (level.textContent.toLowerCase().includes('resistance')) {
            resistanceLevels.push(price);
          }
        }
      });

      data.support = supportLevels.sort((a, b) => a - b);
      data.resistance = resistanceLevels.sort((a, b) => b - a);
    } catch (error) {
      console.error('Error extracting levels:', error);
    }
  },

  extractCandleData: function(data) {
    try {
      // Try to extract recent candle data
      const candleElements = document.querySelectorAll('[class*="candle"], [class*="bar"]');
      const candles = [];
      
      candleElements.forEach((candle, index) => {
        if (index < 50) { // Get last 50 candles
          const candleData = {
            index: index,
            open: parseFloat(candle.getAttribute('data-open') || 0),
            high: parseFloat(candle.getAttribute('data-high') || 0),
            low: parseFloat(candle.getAttribute('data-low') || 0),
            close: parseFloat(candle.getAttribute('data-close') || 0),
            volume: parseFloat(candle.getAttribute('data-volume') || 0)
          };
          
          if (candleData.close > 0) candles.push(candleData);
        }
      });
      
      data.candleData = candles;
    } catch (error) {
      console.error('Error extracting candle data:', error);
    }
  },

  captureChart: async function() {
    try {
      const chart = document.querySelector('[class*="chart"]');
      if (chart) {
        const canvas = await html2canvas(chart);
        return canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.error('Error capturing chart:', error);
    }
    return null;
  },

  findElement: function(selectors) {
    for (let selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element;
      }
    }
    return null;
  },

  parseNumberWithSuffix: function(str) {
    const multipliers = { 'K': 1000, 'M': 1000000, 'B': 1000000000, 'T': 1000000000000 };
    const match = str.match(/(\d+\.?\d*)([KMBT]?)/);
    if (match) {
      let num = parseFloat(match[1]);
      const suffix = match[2];
      if (multipliers[suffix]) num *= multipliers[suffix];
      return num;
    }
    return parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
  },

  setupWebSocketListener: function() {
    // Monitor for real-time data updates from TradingView
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
      const ws = new originalWebSocket(...args);
      const originalOnMessage = ws.onmessage;
      
      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'quote' || data.type === 'price') {
            chrome.runtime.sendMessage({ action: 'realtimeUpdate', data: data });
          }
        } catch (e) {}
        
        if (originalOnMessage) originalOnMessage.call(this, event);
      };
      
      return ws;
    };
  }
};

// Initialize WebSocket listener
TradingViewExtractor.setupWebSocketListener();

// Listen for messages from background and sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getChartData') {
    const chartData = TradingViewExtractor.extractChartData();
    sendResponse(chartData);
  } else if (request.action === 'captureChart') {
    TradingViewExtractor.captureChart().then(image => {
      sendResponse({ image });
    });
  }
});

// Send data to sidepanel periodically if connected
setInterval(() => {
  const data = TradingViewExtractor.extractChartData();
  chrome.runtime.sendMessage({
    action: 'chartDataUpdate',
    data: data
  }).catch(() => {}); // Ignore errors if sidepanel not open
}, 2000);