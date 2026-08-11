import type { TranslationDict } from "./id";

/**
 * Kamus Bahasa Inggris -- di-type pake `TranslationDict` (bentuk `id.ts`)
 * BUKAN `as const` sendiri, biar tsc maksa struktur & tipe key-nya PERSIS
 * sama kayak kamus Indonesia. Lupa nerjemahin 1 key aja bakal keliatan
 * sebagai error compile, bukan silent fallback ke undefined di runtime.
 */
export const en: TranslationDict = {
  common: {
    cancel: "Cancel",
    later: "Later",
  },
  settings: {
    title: "Settings",
    sections: {
      language: "Language",
      notifications: "Notifications",
      backup: "Backup & Restore",
      about: "About",
    },
    language: {
      id: "Indonesia",
      en: "English",
    },
    backup: {
      description:
        "All your data (savings goals, transactions, habits, history, tasks) stays local on this device only — no cloud, no account. Export a backup regularly to keep your data safe if you switch devices or uninstall the app.",
      exportButton: "Export Backup",
      exportAccessibilityLabel: "Export backup data",
      importButton: "Import Backup",
      importAccessibilityLabel: "Import backup data from a file",
      shareDialogTitle: "Save heibi backup",
      exportSuccessTitle: "Backup created",
      exportSuccessMessage: "Sharing isn't available on this device, but the backup file was saved at:\n{{uri}}",
      exportErrorTitle: "Export failed",
      exportErrorMessage: "Something went wrong while creating the backup file. Try again.",
      importOpenErrorTitle: "Couldn't open file",
      importOpenErrorMessage: "Something went wrong while opening the file picker.",
      importParseErrorTitle: "Couldn't read file",
      importParseErrorMessage: "This file isn't valid JSON or couldn't be opened.",
      importInvalidTitle: "Invalid backup",
      importInvalidFallback: "This file can't be restored.",
      confirmTitle: "Restore from backup?",
      confirmMessage:
        "All data CURRENTLY in the app will be COMPLETELY REPLACED with this backup's contents — {{goals}} goals, {{habits}} habits, {{todos}} tasks. This can't be undone.",
      confirmRestore: "Restore",
      restoreSuccessTitle: "Restored successfully",
      restoreSuccessMessage: "Your backup data is now active.",
      restoreErrorTitle: "Restore failed",
      restoreErrorMessage:
        "Something went wrong while writing the backup data. Your old data is likely still intact — try again.",
    },
    about: {
      github: "GitHub",
      githubAccessibilityLabel: "Open the heibi GitHub repository",
      coffee: "Buy me a coffee",
      coffeeSubtitle: "via Saweria",
      coffeeAccessibilityLabel: "Open the Saweria donation page",
      appVersion: "App version",
    },
  },
  reminder: {
    savings: {
      title: "Savings Reminder",
      description: "Get a daily notification so you never forget to save.",
      toggleLabel: "Enable daily reminder",
    },
    planner: {
      title: "Task Reminder",
      description: "Get a daily notification to check today's unfinished tasks.",
      toggleLabel: "Enable daily reminder",
    },
    unavailableNotice: "Not available in Expo Go. This feature needs a development build.",
    expoGoTitle: "Not available in Expo Go",
    expoGoMessage:
      "Reminders need a development build — expo-notifications isn't fully supported in Expo Go since SDK 53.",
    permissionTitle: "Notification permission needed",
    permissionMessage: "Enable notification permission for this app in your device settings so reminders can show up.",
    permissionOpenSettings: "Open Settings",
    disabledTitle: "Reminder disabled",
    disabledMessage:
      "Notification permission for this app appears to be off now. Turn it back on if you want to use reminders.",
    scheduleErrorTitle: "Couldn't enable reminder",
    scheduleErrorMessage: "Try again, or use a development build if it keeps failing.",
    customChipLabel: "Set custom time",
    customChipAccessibilityLabel: "Set a custom reminder time",
    presetAccessibilityLabel: "Schedule reminder for {{time}}",
  },
};
