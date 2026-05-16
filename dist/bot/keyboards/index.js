"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainMenuKeyboard = mainMenuKeyboard;
exports.findPartnerKeyboard = findPartnerKeyboard;
exports.searchingKeyboard = searchingKeyboard;
exports.chattingKeyboard = chattingKeyboard;
exports.postChatKeyboard = postChatKeyboard;
exports.genderKeyboard = genderKeyboard;
exports.ageRangeKeyboard = ageRangeKeyboard;
exports.interestsKeyboard = interestsKeyboard;
exports.reportReasonsKeyboard = reportReasonsKeyboard;
exports.vipMenuKeyboard = vipMenuKeyboard;
exports.vipSettingsKeyboard = vipSettingsKeyboard;
exports.settingsKeyboard = settingsKeyboard;
exports.referralKeyboard = referralKeyboard;
exports.helpKeyboard = helpKeyboard;
exports.continueKeyboard = continueKeyboard;
exports.cancelKeyboard = cancelKeyboard;
exports.confirmDeleteKeyboard = confirmDeleteKeyboard;
const grammy_1 = require("grammy");
const types_1 = require("../../types");
function mainMenuKeyboard(_isVip) {
    return new grammy_1.InlineKeyboard()
        .text('🔍 Find Partner', 'find_partner')
        .text('⭐ VIP Membership', 'vip_membership')
        .row()
        .text('📨 Invite & Earn', 'invite_earn')
        .text('⚙️ Settings', 'settings')
        .row()
        .text('❓ Help', 'help');
}
function findPartnerKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('🔍 Find Partner', 'find_partner')
        .text('📋 Main Menu', 'main_menu');
}
function searchingKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('⏹️ Stop Searching', 'stop_searching');
}
function chattingKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('➡️ Next', 'next_partner')
        .row()
        .text('🛑 Stop Chat', 'stop_chat')
        .text('🚩 Report', 'report_menu');
}
function postChatKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('🔍 Find New Partner', 'find_partner')
        .text('🚩 Report Last User', 'report_last')
        .row()
        .text('📋 Main Menu', 'main_menu');
}
function genderKeyboard() {
    const keyboard = new grammy_1.InlineKeyboard();
    for (const gender of types_1.GENDERS) {
        keyboard.text(gender.label, `set_gender_${gender.value}`);
    }
    return keyboard;
}
function ageRangeKeyboard() {
    const keyboard = new grammy_1.InlineKeyboard();
    for (const age of types_1.AGE_RANGES) {
        keyboard.text(age.label, `set_age_${age.value}`);
    }
    return keyboard;
}
function interestsKeyboard(selectedInterests = []) {
    const keyboard = new grammy_1.InlineKeyboard();
    for (let i = 0; i < types_1.INTERESTS_LIST.length; i++) {
        const interest = types_1.INTERESTS_LIST[i];
        if (!interest)
            continue;
        const isSelected = selectedInterests.includes(interest);
        const label = isSelected ? `✅ ${interest}` : interest;
        keyboard.text(label, `toggle_interest_${interest}`);
        if ((i + 1) % 2 === 0) {
            keyboard.row();
        }
    }
    keyboard.row();
    keyboard.text('✅ Done', 'interests_done');
    return keyboard;
}
function reportReasonsKeyboard() {
    const keyboard = new grammy_1.InlineKeyboard();
    for (const reason of types_1.REPORT_REASONS) {
        keyboard.text(reason.label, `report_reason_${reason.value}`);
    }
    return keyboard;
}
function vipMenuKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('🛒 Buy VIP', 'buy_vip')
        .text('⚙️ VIP Settings', 'vip_settings')
        .row()
        .text('📋 Main Menu', 'main_menu');
}
function vipSettingsKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('👫 Preferred Gender', 'vip_prefer_gender')
        .text('📅 Preferred Age', 'vip_prefer_age')
        .row()
        .text('🌍 Preferred Country', 'vip_prefer_country')
        .text('🎯 Preferred Interests', 'vip_prefer_interests')
        .row()
        .text('⬅️ Back', 'vip_membership');
}
function settingsKeyboard(isVip) {
    const keyboard = new grammy_1.InlineKeyboard()
        .text('👤 Update Gender', 'update_gender')
        .text('📅 Update Age', 'update_age')
        .row()
        .text('🎯 Update Interests', 'update_interests')
        .row()
        .text('🗑️ Delete Account', 'delete_account')
        .row();
    if (isVip) {
        keyboard.text('⭐ VIP Settings', 'vip_settings').row();
    }
    keyboard.text('⬅️ Back', 'main_menu');
    return keyboard;
}
function referralKeyboard(referralLink) {
    return new grammy_1.InlineKeyboard()
        .url('🔗 Copy Referral Link', referralLink)
        .row()
        .text('📋 Main Menu', 'main_menu');
}
function helpKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('📋 Main Menu', 'main_menu');
}
function continueKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('Continue', 'onboarding_continue');
}
function cancelKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('❌ Cancel', 'cancel_action');
}
function confirmDeleteKeyboard() {
    return new grammy_1.InlineKeyboard()
        .text('🗑️ Yes, Delete', 'confirm_delete')
        .text('❌ No, Keep', 'main_menu');
}
//# sourceMappingURL=index.js.map