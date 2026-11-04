
import { useEffect } from 'react';
import { useStatusBarContext } from '../shared/context/hooks/StatusBarHooks';

const AppqaLaunch = () => {
  const statusbarContext = useStatusBarContext();
  useEffect(() => {
    const sessionVar = statusbarContext.userSessionId

    if (sessionVar?.length) {
      const currentUrl = new URL(window.location.origin);
      currentUrl.searchParams.set('isnew', 'true');
      currentUrl.searchParams.set('id', sessionVar);
      currentUrl.searchParams.set('appqaLaunch', 'true');

      // Open without noopener to allow tabs to be closed programmatically
      window.open(
        currentUrl.toString(),
        '_blank',
        "noopener"
      );
    }

    // optional: go back automatically
    window.history.back();

  }, [statusbarContext.userSessionId]);

  return null;
};

export default AppqaLaunch;
