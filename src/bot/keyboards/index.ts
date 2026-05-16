import { InlineKeyboard } from 'grammy';
import { GENDERS, AGE_RANGES, INTERESTS_LIST, REPORT_REASONS } from '../../types';

export function mainMenuKeyboard(_isVip: boolean): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔍 Find Partner', 'find_partner')
    .text('⭐ VIP Membership', 'vip_membership')
    .row()
    .text('📨 Invite & Earn', 'invite_earn')
    .text('⚙️ Settings', 'settings')
    .row()
    .text('❓ Help', 'help');
}

export function findPartnerKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔍 Find Partner', 'find_partner')
    .text('📋 Main Menu', 'main_menu');
}

export function searchingKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('⏹️ Stop Searching', 'stop_searching');
}

export function chattingKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('➡️ Next', 'next_partner')
    .row()
    .text('🛑 Stop Chat', 'stop_chat')
    .text('🚩 Report', 'report_menu');
}

export function postChatKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔍 Find New Partner', 'find_partner')
    .text('🚩 Report Last User', 'report_last')
    .row()
    .text('📋 Main Menu', 'main_menu');
}

export function genderKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const gender of GENDERS) {
    keyboard.text(gender.label, `set_gender_${gender.value}`);
  }
  return keyboard;
}

export function ageRangeKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const age of AGE_RANGES) {
    keyboard.text(age.label, `set_age_${age.value}`);
  }
  return keyboard;
}

export function interestsKeyboard(selectedInterests: string[] = []): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (let i = 0; i < INTERESTS_LIST.length; i++) {
    const interest = INTERESTS_LIST[i];
    if (!interest) continue;
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

export function reportReasonsKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (const reason of REPORT_REASONS) {
    keyboard.text(reason.label, `report_reason_${reason.value}`);
  }
  return keyboard;
}

export function vipMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🛒 Buy VIP', 'buy_vip')
    .text('⚙️ VIP Settings', 'vip_settings')
    .row()
    .text('📋 Main Menu', 'main_menu');
}

export function vipSettingsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('👫 Preferred Gender', 'vip_prefer_gender')
    .text('📅 Preferred Age', 'vip_prefer_age')
    .row()
    .text('🌍 Preferred Country', 'vip_prefer_country')
    .text('🎯 Preferred Interests', 'vip_prefer_interests')
    .row()
    .text('⬅️ Back', 'vip_membership');
}

export function settingsKeyboard(isVip: boolean): InlineKeyboard {
  const keyboard = new InlineKeyboard()
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

export function referralKeyboard(referralLink: string): InlineKeyboard {
  return new InlineKeyboard()
    .url('🔗 Copy Referral Link', referralLink)
    .row()
    .text('📋 Main Menu', 'main_menu');
}

export function helpKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📋 Main Menu', 'main_menu');
}

export function continueKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Continue', 'onboarding_continue');
}

export function cancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('❌ Cancel', 'cancel_action');
}

export function confirmDeleteKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🗑️ Yes, Delete', 'confirm_delete')
    .text('❌ No, Keep', 'main_menu');
}