import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanDisplayText } from '../../src/export/clean-display-text.mjs';

test('cleanDisplayText strips client-only markup and preserves readable text', () => {
  assert.equal(
    cleanDisplayText('【炎】干员<@ba.vup>攻击力</>提升\n<在场<@autochess.dgreen>6</>名不同【炎】干员>效果改变'),
    '【炎】干员攻击力提升\n在场6名不同【炎】干员效果改变',
  );

  assert.equal(
    cleanDisplayText('<@ba.acrem>选择策略【娜仁图亚】时，<在场6名不同【萨尔贡】干员>的效果会有所改变</>'),
    '选择策略【娜仁图亚】时，在场6名不同【萨尔贡】干员的效果会有所改变',
  );
});
