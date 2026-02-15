import { defineEventHandler } from 'h3';
import { getAllUsers } from '../../utils/users';

export default defineEventHandler(async (event) => {
  const users = getAllUsers();
  
  return {
    users
  };
});
