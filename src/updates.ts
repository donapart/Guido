/**
 * Update checking functionality for Guido Model Router
 */

import * as vscode from "vscode";
import { logger } from "./utils/logger";

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  isMandatory: boolean;
}

export async function checkForUpdates(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const config = vscode.workspace.getConfiguration("modelRouter");
    const autoCheck = config.get<boolean>("updates.autoCheck", true);
    const notifyOnStart = config.get<boolean>("updates.notifyOnStart", true);

    if (!autoCheck) {
      logger.info("Update checking disabled by user");
      return;
    }

    const currentVersion = context.extension.packageJSON.version;
    logger.info("Checking for updates", { currentVersion });

    // Simulate update check (in a real implementation, this would check against a server)
    const lastCheck = context.globalState.get<number>("lastUpdateCheck", 0);
    const now = Date.now();
    const checkInterval = 24 * 60 * 60 * 1000; // 24 hours

    if (now - lastCheck < checkInterval) {
      logger.info("Update check skipped - too recent");
      return;
    }

    // Store the check time
    await context.globalState.update("lastUpdateCheck", now);

    // For now, just log that we checked
    logger.info("Update check completed", {
      currentVersion,
      lastCheck: new Date(lastCheck).toISOString(),
      nextCheck: new Date(now + checkInterval).toISOString(),
    });

    // In a real implementation, you would:
    // 1. Fetch latest version from your update server
    // 2. Compare with current version
    // 3. Show notification if update is available
    // 4. Provide download link

    if (notifyOnStart) {
      vscode.window
        .showInformationMessage(
          `Guido Model Router v${currentVersion} ist bereit! 🚀`,
          "Dokumentation öffnen",
          "Einstellungen"
        )
        .then((selection) => {
          if (selection === "Dokumentation öffnen") {
            vscode.env.openExternal(
              vscode.Uri.parse(
                "https://github.com/model-router/guido-model-router"
              )
            );
          } else if (selection === "Einstellungen") {
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "modelRouter"
            );
          }
        });
    }
  } catch (error) {
    logger.error("Update check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't show error to user for update check failures
  }
}

export async function forceUpdateCheck(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const currentVersion = context.extension.packageJSON.version;

    vscode.window
      .showInformationMessage(
        `Aktuelle Version: ${currentVersion}`,
        "Manuell prüfen",
        "Einstellungen"
      )
      .then((selection) => {
        if (selection === "Manuell prüfen") {
          vscode.env.openExternal(
            vscode.Uri.parse(
              "https://github.com/model-router/guido-model-router/releases"
            )
          );
        } else if (selection === "Einstellungen") {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "modelRouter"
          );
        }
      });
  } catch (error) {
    logger.error("Force update check failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    vscode.window.showErrorMessage("Update-Prüfung fehlgeschlagen");
  }
}
