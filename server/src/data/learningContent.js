export const LEARNING_CONTENT = [
  {
    slug: 'what-is-crypto',
    title: 'What Is Cryptocurrency?',
    category: 'Basics',
    summary: 'A quick primer on what makes crypto different from a regular bank balance.',
    body:
      'Cryptocurrency is a digital asset that lives on a decentralized ledger (a blockchain) instead of a bank\'s ' +
      'database. Ownership is tracked by the network itself, and prices move purely on supply and demand between ' +
      'buyers and sellers — there is no central authority setting the price. This simulator mirrors that dynamic ' +
      'with a randomized price walk for BTC, ETH, SOL, DOGE, XRP, and BNB, all priced in virtual BDT.',
  },
  {
    slug: 'how-trading-works',
    title: 'How Buying and Selling Works',
    category: 'Basics',
    summary: 'What actually happens when you place a market buy or sell order.',
    body:
      'A market order executes immediately at the current price rather than waiting for a specific target price. ' +
      'When you buy, your cash balance decreases and your holding\'s quantity and average buy price update. When ' +
      'you sell, your holding decreases, your cash balance increases, and any difference between the sale price ' +
      'and your average buy price is booked as realized profit or loss. All trades here execute against your own ' +
      'simulated price feed — never real money, and never a shared order book.',
  },
  {
    slug: 'reading-price-charts',
    title: 'Reading Price Charts',
    category: 'Technical Analysis',
    summary: 'How to interpret the line chart on a coin\'s detail page.',
    body:
      'The chart on each coin page combines historical daily candles with live simulated ticks so you can see both ' +
      'the longer trend and the most recent movement in one view. A rising line means the price is trending up over ' +
      'that window; a falling line means it\'s trending down. Session high/low stats show the widest swing your own ' +
      'simulation has produced since you started watching — useful context before placing a trade or a prediction.',
  },
  {
    slug: 'market-volatility',
    title: 'Understanding Market Volatility',
    category: 'Risk',
    summary: 'Why crypto prices swing harder than most other assets.',
    body:
      'Volatility measures how much a price moves over time. Crypto markets are known for large swings because ' +
      'trading volume is smaller and sentiment shifts quickly. This simulator lets you choose a difficulty level — ' +
      'beginner, intermediate, or expert — which changes how aggressively your personal price feed swings. Higher ' +
      'volatility means bigger potential gains, but also bigger potential losses, on the exact same trade.',
  },
  {
    slug: 'risk-management',
    title: 'Risk Management Basics',
    category: 'Risk',
    summary: 'Simple habits that separate disciplined trading from gambling.',
    body:
      'Never risk more of your balance on a single trade than you can afford to lose, even in a simulator — the ' +
      'habits you build here are the point. Diversifying across a few coins instead of one reduces how much a ' +
      'single bad move can hurt your total portfolio value. And treat every trade as a decision you can explain: ' +
      'if you can\'t articulate why you\'re buying or selling, that\'s usually a sign to wait.',
  },
  {
    slug: 'predictions-and-gamification',
    title: 'Predictions, Points, and Achievements',
    category: 'Using This Simulator',
    summary: 'How the prediction challenges, virtual points, and achievements fit together.',
    body:
      'Beyond trading, you can stake virtual points on a short-term prediction: will a coin\'s price be higher or ' +
      'lower when the challenge closes? Correct calls pay out double your stake; incorrect calls forfeit it. ' +
      'Achievements unlock automatically as you trade and predict — they\'re just a record of milestones, not a ' +
      'requirement. The leaderboard ranks everyone by portfolio return percentage, so it stays fair even though ' +
      'every player is trading against their own independent simulated market.',
  },
];
