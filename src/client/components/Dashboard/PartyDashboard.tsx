import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MessageBoard from './MessageBoard';
import BudgetPieChart from '../BudgetBuddy/BudgetPieChart';
import AddMember from './AddMember';
import AddItinerary from './AddItinerary';
import { user } from '../../../../types/models.ts';

interface PartyDashboardProps {
  user: user;
}

const PartyDashboard: React.FC<PartyDashboardProps>= ({ user }) => {
  const { partyId } = useParams();
  console.log(partyId)
  const numericPartyId = parseInt(partyId || '', 10);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const partyName = searchParams.get('name');
  
  const [partyInfo, setPartyInfo] = useState<{id: number, name: string}[]>([])
  const [partyMembers, setPartyMembers] = useState<string[]>([]);
  // const userId = user.id //? delete

  if(!partyId || !partyName) {
    return <div>Loading party dashboard...</div>
  }
  useEffect(() => {
    getUsersForParty(numericPartyId);
  },[numericPartyId])



  const getUsersForParty = async (partyId: number) => {
    console.log(partyId)
    try {
      const response = await axios.get(`/api/group/usersInParty/${partyId}`);
      const users = response.data;
      const usernames = users.map((user:user) => user.username)
      console.log(usernames);
      setPartyMembers(usernames);
    } catch (error) {
      console.error('failed to find members for one or all parties')
    }
  };

  return (
    <Box>
      <Typography>
        {partyName}
      </Typography>
      <AddItinerary user={user} partyId={numericPartyId} partyName={partyName}/>
      <Box>
        <MessageBoard user={user}/>
      </Box>
      <AddMember user={user} partyId={numericPartyId} partyName={partyName} />
      <Box position= 'absolute' bottom = '10%'>
        {/* <BudgetPieChart /> */}
      </Box>
    </Box>
  )
};

export default PartyDashboard;