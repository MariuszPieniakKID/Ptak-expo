import React from 'react';
import { Exhibition } from '../../../../services/api';
import TradeInfo from '../../../../components/TradeInfo';
import styles from './TradeFairInformationContent.module.scss';

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

// duplicate declarations removed