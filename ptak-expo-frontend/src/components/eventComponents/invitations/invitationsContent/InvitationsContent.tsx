import React from 'react';
import { Exhibition } from '../../../../services/api';
import Invitations from '../../../../components/Invitations';
import styles from './InvitationsContent.module.scss';

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