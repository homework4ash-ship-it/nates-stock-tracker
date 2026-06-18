# Nate's Stock Tracker

An advanced Chrome extension for real-time TradingView stock analysis with AI-powered insights from Claude.

## Features

### 📊 Real-Time Data Extraction
- Symbol and current price tracking
- Live price changes and percentage movements
- Trading volume monitoring
- 52-week highs/lows
- P/E ratios and other fundamentals

### 📈 Technical Analysis
- RSI (Relative Strength Index)
- MACD indicators
- Bollinger Bands
- Moving Averages (MA20, MA50, MA200)
- Support and Resistance levels
- Candlestick data extraction

### 🤖 AI-Powered Analysis
- Real-time Claude AI integration
- Side panel chat for immediate analysis
- Context-aware responses based on current stock data
- Historical analysis and trend identification

### ⭐ Watchlist Management
- Add/remove stocks from personal watchlist
- Quick access to tracked stocks
- Price history tracking

### 📱 User-Friendly Interface
- Beautiful side panel with real-time updates
- Organized data cards and indicators
- Dark/light mode support
- Responsive design

## Installation

1. Clone this repository
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension directory

## Setup

### Get an Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API keys
4. Create a new API key
5. Copy the key

### Configure the Extension

1. Open a TradingView chart
2. Press `Ctrl+Shift+Y` (or `Cmd+Shift+Y` on Mac)
3. Click the ⚙️ settings icon
4. Paste your Anthropic API key
5. Click "Save Settings"

## Usage

1. **Navigate to TradingView**: Go to any stock chart on tradingview.com
2. **Open Side Panel**: Press `Ctrl+Shift+Y` or click the extension icon
3. **View Data**: All real-time stock data updates automatically
4. **Ask Claude**: Type questions in the chat to get AI analysis
5. **Track Stocks**: Add stocks to your watchlist with the "Add Current" button

## Example Queries

- "Is this stock oversold based on RSI?"
- "What are the support and resistance levels suggesting?"
- "Should I buy or sell based on current technicals?"
- "Explain the divergence in this indicator"
- "What's the trend for this stock?"

## Data Extraction

The extension extracts and monitors:
- Current price and change
- Volume and average volume
- Technical indicators (RSI, MACD, Bollinger Bands)
- Moving averages (20, 50, 200 day)
- Support and resistance levels
- Candlestick data
- Fundamental metrics (P/E, Beta, Dividend)
- 52-week highs and lows

## Real-Time Updates

Data refreshes every 2 seconds while the side panel is open, ensuring you always have the latest:
- Price changes
- Volume updates
- Indicator changes
- Technical signals

## Privacy & Security

- Your API key is stored locally and never transmitted except to Anthropic
- All chat history is kept in your browser session
- No data is sent to external servers except for Claude API calls
- The extension requests only necessary permissions

## Troubleshooting

### No data showing?
- Ensure you're on a TradingView chart page
- Wait 2-3 seconds for the first data load
- Check browser console for errors (F12 → Console)

### Claude not responding?
- Verify your API key is correct
- Check that your Anthropic account has available credits
- Look for error messages in the chat panel

### Missing indicators?
- Some indicators may not be available on all charts
- Try switching to a different timeframe
- Make sure the indicators are visible on your TradingView chart

## Architecture

- **manifest.json**: Extension configuration
- **content.js**: Data extraction from TradingView DOM
- **background.js**: Service worker handling API calls and data management
- **sidepanel.html/js/css**: Main UI for real-time analysis and chat
- **popup.html/css**: Quick info popup

## API Integration

This extension uses the Anthropic Claude API for AI analysis. Requires:
- Valid Anthropic API key
- Active internet connection
- Sufficient API credits

## Future Enhancements

- [ ] Multiple chart analysis
- [ ] Alert notifications for price levels
- [ ] Export analysis to PDF
- [ ] Historical chart comparison
- [ ] Custom indicator support
- [ ] Trading journal integration
- [ ] Voice commands
- [ ] Real-time news integration

## License

MIT License - See LICENSE file for details

## Support

For issues or feature requests, please open an issue on GitHub.

---

**Note**: This extension is for educational and informational purposes. Always do your own research and consult with financial advisors before making trading decisions.