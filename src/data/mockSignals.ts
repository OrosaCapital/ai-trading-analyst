export interface MockSignal {
  time: number;
  type: 'buy' | 'sell';
  price: number;
  confidence: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown';
  text: string;
}

export const mockSignals: MockSignal[] = [
  {
    time: 1700007200,
    type: 'buy',
    price: 65740,
    confidence: 92,
    position: 'belowBar',
    color: '#10B981',
    shape: 'arrowUp',
    text: 'BUY'
  },
  {
    time: 1700032400,
    type: 'buy',
    price: 66820,
    confidence: 88,
    position: 'belowBar',
    color: '#10B981',
    shape: 'arrowUp',
    text: 'BUY'
  },
  {
    time: 1700054000,
    type: 'sell',
    price: 68020,
    confidence: 85,
    position: 'aboveBar',
    color: '#EF4444',
    shape: 'arrowDown',
    text: 'SELL'
  },
  {
    time: 1700075600,
    type: 'buy',
    price: 68480,
    confidence: 90,
    position: 'belowBar',
    color: '#10B981',
    shape: 'arrowUp',
    text: 'BUY'
  },
  {
    time: 1700097200,
    type: 'buy',
    price: 69240,
    confidence: 94,
    position: 'belowBar',
    color: '#10B981',
    shape: 'arrowUp',
    text: 'BUY'
  }
];
