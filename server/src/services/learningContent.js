export const learningLessons = [
  {
    slug: 'simulated-trading-basics',
    title: 'Simulated Trading Basics',
    level: 'beginner',
    summary: 'Learn how virtual cash, market prices, and trade history work inside the simulator.',
    sections: [
      'A market buy uses the latest simulated price available for your account.',
      'Your cash, holdings, and transaction history are virtual and educational only.',
      'Fees are included to make practice trades feel closer to real market mechanics.',
    ],
  },
  {
    slug: 'risk-and-position-sizing',
    title: 'Risk and Position Sizing',
    level: 'beginner',
    summary: 'Practice sizing trades so a single move does not dominate the whole portfolio.',
    sections: [
      'A smaller position leaves more room to learn from mistakes.',
      'Diversifying across coins can reduce dependence on one simulated price path.',
      'Unrealized P/L changes until you sell; realized P/L is locked after a sale.',
    ],
  },
  {
    slug: 'prediction-challenges',
    title: 'Prediction Challenges',
    level: 'intermediate',
    summary: 'Use virtual points to forecast short-term up or down moves.',
    sections: [
      'A challenge records the simulated price when you open it.',
      'When the timer closes, the result is settled against your latest simulated price.',
      'Correct predictions award virtual points; ties refund the stake.',
    ],
  },
  {
    slug: 'portfolio-return',
    title: 'Portfolio Return',
    level: 'intermediate',
    summary: 'Understand how leaderboard ranking compares total virtual account value.',
    sections: [
      'Total value combines available BDT cash and current holding value.',
      'Return percentage compares total value with the starting virtual balance.',
      'The leaderboard is educational and has no prize or payout.',
    ],
  },
];
