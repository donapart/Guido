"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveChatTargets = getActiveChatTargets;
const chatPanel_1 = require("./chatPanel");
const chatDockView_1 = require("./chatDockView");
function getActiveChatTargets() {
    const targets = [];
    if (chatPanel_1.ChatPanel.current)
        targets.push(chatPanel_1.ChatPanel.current);
    if (chatDockView_1.ChatDockViewProvider.current)
        targets.push(chatDockView_1.ChatDockViewProvider.current);
    return targets;
}
//# sourceMappingURL=chatTargets.js.map