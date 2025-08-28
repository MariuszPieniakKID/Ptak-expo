import React from 'react';
import { Exhibition } from '../../../../services/api';

import styles from './InvitationsContent.module.scss';
import Invitations from '../../../Invitations';

interface InvitationsContentProps {
  event: Exhibition;
}

const InvitationsContent: React.FC<InvitationsContentProps> = ({ event }) => {
  return (
    <div className={styles.container}>
      <Invitations exhibitionId={event.id} />
    </div>
  );
};

export default InvitationsContent;