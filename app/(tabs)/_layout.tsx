import { Tabs, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fab } from "../../src/components/Fab";
import { FloatingTabBar } from "../../src/components/FloatingTabBar";
import { UndoSnackbar } from "../../src/components/UndoSnackbar";
import { resolveBottomNavigationLayout } from "../../src/components/navigation/bottom-navigation-layout";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useTheme } from "../../src/theme/useTheme";

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const navigationLayout = resolveBottomNavigationLayout(insets.bottom);

  // FAB berubah tujuan/label tergantung tab aktif — Today nambah habit
  // (todo baru dibikin inline langsung di Today screen, gak butuh FAB),
  // Goals nambah goal, History gak ada aksi tambah yang masuk akal jadi FAB
  // disembunyikan di situ.
  let fabConfig: { onPress: () => void; label: string } | null = null;
  if (pathname === "/" || pathname === "/index") {
    fabConfig = { onPress: () => router.push("/habit/add"), label: t.layout.addHabitFab };
  } else if (pathname === "/goals") {
    fabConfig = { onPress: () => router.push("/goal/add"), label: t.layout.addGoalFab };
  }

  return (
    <>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          animation: "none",
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Today" }} />
        <Tabs.Screen name="goals" options={{ title: "Goals" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
      <UndoSnackbar bottomOffset={navigationLayout.snackbarBottomOffset} />
      {fabConfig && (
        <Fab
          onPress={fabConfig.onPress}
          accessibilityLabel={fabConfig.label}
          bottomOffset={navigationLayout.fabBottomOffset}
        />
      )}
    </>
  );
}
