import { useState } from 'react';
import { PredictionMarket } from '@/components/ui/be-ui-prediction-market';

export default function PredictionMarketPreview() {
  const [order, setOrder] = useState({ mode: 'buy', outcomeId: 'up', amount: '115' });

  return (
    <div className="flex w-full items-center justify-center">
      <PredictionMarket
        outcomes={[
          { id: 'up', label: 'Up', price: 0.5 },
          { id: 'down', label: 'Down', price: 0.5 },
        ]}
        value={order}
        onValueChange={setOrder}
        balance={500}
        positions={{ up: 0, down: 0 }}
        quickAmounts={[10, 50, 100, 500]}
        orderTypeLabel="15 min"
      />
    </div>
  );
}
