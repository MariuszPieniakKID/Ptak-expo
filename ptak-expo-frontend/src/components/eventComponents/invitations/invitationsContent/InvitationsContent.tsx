import React from 'react';
import { Exhibition } from '../../../../services/api';

import styles from './InvitationsContent.module.scss';
import Invitation from './invitation/Invitation';

interface InvitationsContentProps {
  event: Exhibition;
}

const InvitationsContent: React.FC<InvitationsContentProps> = ({ event }) => {
  return (
    <div className={styles.container}>
      <Invitation exhibitionId={event.id} />

    </div>
  );
};

export default InvitationsContent;