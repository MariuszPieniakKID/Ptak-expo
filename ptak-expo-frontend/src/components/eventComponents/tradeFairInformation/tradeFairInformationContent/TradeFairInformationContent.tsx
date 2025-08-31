import React from 'react';
import { Exhibition } from '../../../../services/api';
import styles from './TradeFairInformationContent.module.scss';
import TradeInfo from './tradeInfo/TradeInfo';

interface TradeFairInformationContentProps {
  event: Exhibition;
}

const TradeFairInformationContent: React.FC<TradeFairInformationContentProps> = ({ event }) => {
  return (
    <div className={styles.container}>
      <TradeInfo exhibitionId={event.id} />
    </div>
  );
};

export default TradeFairInformationContent;
