/**
 * useResponsive Hook
 * 
 * Custom hook for managing responsive behavior and mobile detection
 * across visualization components.
 */

import { useState, useEffect } from 'react';

interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const defaultBreakpoints: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

export const useResponsive = (breakpoints: Partial<ResponsiveBreakpoints> = {}) => {
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < bp.mobile,
        isTablet: width >= bp.mobile && width < bp.tablet,
        isDesktop: width >= bp.tablet,
        width,
        height
      });
    };

    // Initial check
    updateState();

    // Add event listener
    window.addEventListener('resize', updateState);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateState);
  }, [bp.mobile, bp.tablet, bp.desktop]);

  return state;
};

/**
 * useCollapsible Hook
 * 
 * Hook for managing collapsible panel state with mobile auto-collapse
 */
export const useCollapsible = (defaultCollapsed = false, autoCollapseOnMobile = true) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (autoCollapseOnMobile && isMobile && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [isMobile, autoCollapseOnMobile, isCollapsed]);

  const toggle = () => setIsCollapsed(!isCollapsed);
  const collapse = () => setIsCollapsed(true);
  const expand = () => setIsCollapsed(false);

  return {
    isCollapsed,
    toggle,
    collapse,
    expand,
    isMobile
  };
};

/**
 * useTouchGestures Hook
 * 
 * Hook for handling touch gestures like swipe navigation
 */
interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  preventScroll?: boolean;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    preventScroll = false
  } = options;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Determine if horizontal or vertical swipe is more significant
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      // Vertical swipe
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

/**
 * useOptimizedRendering Hook
 * 
 * Hook for optimizing chart and visualization rendering based on screen size
 */
interface RenderingOptions {
  mobileSimplification?: boolean;
  tabletOptimization?: boolean;
  performanceMode?: boolean;
}

export const useOptimizedRendering = (options: RenderingOptions = {}) => {
  const { isMobile, isTablet, width } = useResponsive();
  const {
    mobileSimplification = true,
    tabletOptimization = true,
    performanceMode = false
  } = options;

  const getChartSize = (baseSize: number): number => {
    if (isMobile && mobileSimplification) {
      return Math.max(baseSize * 0.7, 40);
    }
    if (isTablet && tabletOptimization) {
      return baseSize * 0.85;
    }
    return baseSize;
  };

  const getStrokeWidth = (baseWidth: number): number => {
    if (isMobile && mobileSimplification) {
      return Math.max(baseWidth * 0.8, 2);
    }
    return baseWidth;
  };

  const getFontSize = (baseSize: number): number => {
    if (isMobile && mobileSimplification) {
      return Math.max(baseSize * 0.85, 10);
    }
    return baseSize;
  };

  const getGridColumns = (maxColumns: number): number => {
    if (isMobile) return 1;
    if (isTablet) return Math.min(maxColumns, 2);
    return maxColumns;
  };

  const shouldSimplify = isMobile && mobileSimplification;
  const shouldOptimize = (isTablet && tabletOptimization) || performanceMode;

  return {
    isMobile,
    isTablet,
    width,
    getChartSize,
    getStrokeWidth,
    getFontSize,
    getGridColumns,
    shouldSimplify,
    shouldOptimize
  };
};

export default useResponsive;