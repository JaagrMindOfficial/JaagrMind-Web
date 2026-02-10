'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { logger } from '@/lib/logger';

export function RouteLogger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    logger.info('Route', `User navigated to: ${url}`);
  }, [pathname, searchParams]);

  return null;
}
