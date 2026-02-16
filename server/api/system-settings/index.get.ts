import { defineEventHandler } from 'h3';
import { getAllSystemSettings } from '../../utils/systemSettings';

export default defineEventHandler(async () => {
  const settings = getAllSystemSettings();
  
  // Convert string values to appropriate types where necessary
  const processedSettings = {
    allowGuestLogin: settings.allow_guest_login === 'true'
  };
  
  return {
    settings: processedSettings
  };
});
