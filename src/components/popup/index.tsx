/**
 * License: zlib/libpng
 * @author Santo Pfingsten
 * @see https://github.com/Lusito/forget-me-not
 */

import { settings } from "../../lib/settings";
import { translateDocument } from "../../lib/htmlUtils";
import { isFirefox, browserInfo } from "../../lib/browserInfo";
import { connectSettings, permanentDisableSettings, updateFromSettings } from "../../lib/htmlSettings";
import { messageUtil } from "../../lib/messageUtil";
import { wetLayer } from "wet-layer";
import { h } from "tsx-dom";
import { LogTab } from "../popupTabs/logTab";
import { RulesTab } from "../popupTabs/rulesTab";
import { SettingsTab } from "../popupTabs/settingsTab";
import { StartTab } from "../popupTabs/startTab";
import { TabContainer, Tab, validHash } from "../tabContainer";
import { SnoozeButton } from "../snoozeButton";
import { SnoozeBubble } from "../hoverBubbles/snoozeBubble";
import { ManualCleanupBubble } from "../hoverBubbles/manualCleanupBubble";
import { HelpBubble } from "../hoverBubbles/helpBubble";
import { LogoWithLink } from "../logo/logoWithLink";
import "./style.scss";
import { CleanDialog } from "../dialogs/cleanDialog";
import { EXPORT_IGNORE_KEYS, SettingsKey } from "../../lib/settingsSignature";

const removeLocalStorageByHostname = isFirefox && browserInfo.versionAsNumber >= 58;

settings.onReady(() => {
    if (browserInfo.mobile)
        (document.querySelector("html") as HTMLHtmlElement).classList.add("fullscreen");
    else if (window.innerWidth <= 350)
        (document.querySelector("html") as HTMLHtmlElement).classList.add("small_size");

    if (document.location && !validHash.test(document.location.hash.substr(1))) {
        const initialTab = settings.get("initialTab");
        if (initialTab === "last_active_tab")
            document.location.hash = "#" + settings.get("lastTab");
        else if (initialTab)
            document.location.hash = "#" + initialTab;
    }

    const popup = <TabContainer helpUrl="readme.html#tutorial" defaultTab="this_tab">
        <Tab i18n="tabs_this_tab?title" name="this_tab" icon="location.svg"><StartTab /></Tab>
        <Tab i18n="tabs_rules?title" name="rules" icon="shield.svg"><RulesTab /></Tab>
        <Tab i18n="tabs_settings?title" name="settings" icon="settings.svg" panelClass="tab_with_subtabs"><SettingsTab /></Tab>
        <Tab i18n="tabs_log?title" name="log" icon="list.svg"><LogTab /></Tab>
    </TabContainer>;

    connectSettings(popup);
    if (!removeLocalStorageByHostname)
        permanentDisableSettings(["domainLeave.localStorage", "startup.localStorage.applyRules" ], true);

    messageUtil.receive("settingsChanged", (changedKeys: SettingsKey[]) => {
        if (changedKeys.some((key) => EXPORT_IGNORE_KEYS.indexOf(key) === -1))
            updateFromSettings();
    });

    document.body.appendChild(popup);

    const cleanupButton = <button class="manual_cleanup_button">{/*fixme:title/aria*/}</button>;
    const snoozeButton = <SnoozeButton />;
    <CleanDialog button={cleanupButton} />;

    popup.insertBefore(<div id="toolbar">
        {cleanupButton}
        {snoozeButton}
    </div>, popup.querySelector(".tabs_pages"));

    popup.insertBefore(<LogoWithLink target="_blank" />, popup.querySelector(".tabs_pages"));

    if (!browserInfo.mobile) {
        document.body.appendChild(<HelpBubble button={popup.querySelector("#help_button") as HTMLElement} />);
        document.body.appendChild(<ManualCleanupBubble button={cleanupButton} />);
        document.body.appendChild(<SnoozeBubble button={snoozeButton} />);
    }

    function updateTranslations() {
        translateDocument();
        [...document.body.querySelectorAll("input[placeholder]")].forEach((e) => e.setAttribute("aria-label", e.getAttribute("placeholder") || ""));
    }
    updateTranslations();
    wetLayer.addListener(updateTranslations);
    wetLayer.loadFromStorage();
});
