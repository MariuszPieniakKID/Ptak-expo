import React from "react";
import {useParams} from "react-router-dom";
import {Box} from "@mui/material";
import EventLayout from "../../components/eventLayout/EventLayout";
import LeftColumn from "../../components/event-left/LeftColumn";
import {MarketingPage} from "./MarketingPage";

const MarketingRoutePage: React.FC = () => {
  const {eventId} = useParams();

  return (
    <EventLayout
      left={<LeftColumn eventId={eventId || "0"} isDarkBg={true} />}
      right={
        <Box sx={{paddingTop: "2rem"}}>
          <MarketingPage />
        </Box>
      }
      colorLeft="#6F87F6"
    />
  );
};

export default MarketingRoutePage;
