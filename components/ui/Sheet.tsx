// Sheet: thin wrapper over gorhom bottom-sheet with app defaults.
import BottomSheet, {
  BottomSheetView,
  type BottomSheetProps,
} from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';

import { useTheme } from '@/hooks/useTheme';

type SheetProps = Partial<BottomSheetProps> & { children: React.ReactNode };

// Forward ref so screens can expand/close the sheet imperatively.
export const Sheet = forwardRef<BottomSheet, SheetProps>(
  ({ children, ...props }, ref) => {
    const { colors } = useTheme();
    return (
      <BottomSheet
        ref={ref}
        index={-1}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.primary }}
        {...props}
      >
        <BottomSheetView className="flex-1 p-4">{children}</BottomSheetView>
      </BottomSheet>
    );
  },
);
Sheet.displayName = 'Sheet';
