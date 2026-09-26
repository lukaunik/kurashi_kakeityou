import React from 'react';
import { Card } from '../CommonUI.jsx';
import { Donut } from '../Charts.jsx';

export function AssetPortfolioCard({ assetPortfolio }) {
  return (
    <div className="min-w-0">
      <Card>
        <h3 className="font-bold text-ink-900 text-sm mb-3">総資産ポートフォリオ（銘柄・資産別）</h3>
        <Donut rows={assetPortfolio} title="資産構成" />
      </Card>
    </div>
  );
}
