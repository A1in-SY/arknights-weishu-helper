import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAct2autochessSource } from '../../src/export/load-act2autochess-source.mjs';
import { buildOperatorRecords } from '../../src/export/build-operator-records.mjs';
import { cleanDisplayText } from '../../src/export/clean-display-text.mjs';

const EXPECTED_SAMPLE_SUMMARIES = {
  chess_char_1_01_a: {
    name: '隐现',
    profession: '狙击',
    subProfession: '速射手',
    bondName: '拉特兰',
    bondDesc: '【拉特兰】干员开启技能获得的<@ba.vup>弹药量</>提升<@autochess.gray>（受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【拉特兰】干员>【拉特兰】干员每消耗1发弹药，所有【拉特兰】干员<@ba.vup>攻击力</>提升（有上限）',
    garrisonDesc: '【拉特兰】每叠加5层，本干员攻击速度<@ba.vup>+1</>',
  },
  chess_char_2_05_a: {
    name: '哈洛德',
    profession: '医疗',
    subProfession: '行医',
    bondName: '谢拉格',
    bondDesc: '【谢拉格】干员造成的<@ba.vup>伤害提升</>，对<@ba.vup>寒冷、冻结</>敌人获得额外提升<@autochess.gray>（受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【谢拉格】干员>战场上每25秒过一阵寒风使场上的敌人寒冷一定时间<@autochess.gray>（受层数影响）</>',
    garrisonDesc: '攻击力和生命值+<@ba.vup>20%</>；核心盟约每叠加3层，本干员攻击力和生命值<@ba.vup>+1%</>',
  },
  chess_char_3_03_a: {
    name: '诗怀雅',
    profession: '近卫',
    subProfession: '教官',
    bondName: '炎',
    bondDesc: '【炎】干员<@ba.vup>攻击力</>提升<@autochess.gray>（受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【炎】干员>战斗开始时召唤可自主行动的<@ba.vup>“炎佑”</>，其攻击力生命值分别为开战时【炎】干员攻击力生命值总和的30%，“炎佑”同时攻击3个目标，可使用<@ba.vup>“祛恶之焰”</>，攻击时附带攻击力一定比例的灼燃损伤且周围敌人受到一定比例的元素脆弱\n<在场<@autochess.dgreen>9</>名不同【炎】干员>改为召唤2只<@ba.vup>“炎佑”</>，攻击力提升至<@ba.vup>1.5</>倍，受到的伤害<@ba.vup>-90%</>',
    garrisonDesc: '<获得时>获得1个“盟约之币”',
  },
  chess_char_4_03_a: {
    name: '耶拉',
    profession: '术师',
    subProfession: '驭械术师',
    bondName: '谢拉格',
    bondDesc: '【谢拉格】干员造成的<@ba.vup>伤害提升</>，对<@ba.vup>寒冷、冻结</>敌人获得额外提升<@autochess.gray>（受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【谢拉格】干员>战场上每25秒过一阵寒风使场上的敌人寒冷一定时间<@autochess.gray>（受层数影响）</>',
    garrisonDesc: '<获得时>获得1件“谢拉格不融冰”',
  },
  chess_char_5_01_a: {
    name: '圣约送葬人',
    profession: '近卫',
    subProfession: '收割者',
    bondName: '拉特兰',
    bondDesc: '【拉特兰】干员开启技能获得的<@ba.vup>弹药量</>提升<@autochess.gray>（受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【拉特兰】干员>【拉特兰】干员每消耗1发弹药，所有【拉特兰】干员<@ba.vup>攻击力</>提升（有上限）',
    garrisonDesc: '<战斗中>自身每消耗7发子弹，使已激活的【拉特兰】层数<@ba.vup>+7</>、【远见】层数<@ba.vup>+3</>（每场战斗分别至多触发7次）',
  },
  chess_char_5_19_a: {
    name: '玛恩纳',
    profession: '近卫',
    subProfession: '解放者',
    bondName: '卡西米尔',
    bondDesc: '每次有干员部署时，【卡西米尔】干员攻击力<@ba.vup>+20%</>持续至战斗结束<@autochess.gray>（上限受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【卡西米尔】干员>【卡西米尔】干员阻挡敌人时每<@ba.vup>2</>秒对周围敌人造成<@ba.vup>120%</>攻击力真实伤害和<@ba.vup>0.1</>秒晕眩，未阻挡敌人时攻击附带<@ba.vup>30%</>攻击力的真实伤害',
    garrisonDesc: '【卡西米尔】每叠加5层，本干员部署后100秒内<@ba.vup>基础攻击力</>+10、<@ba.vup>基础生命值</>+50',
  },
  chess_char_6_07_a: {
    name: '维娜·维多利亚',
    profession: '近卫',
    subProfession: '术战者',
    bondName: '维多利亚',
    bondDesc: '携带装备的【维多利亚】干员造成的<@ba.vup>伤害提升</><@autochess.gray>（受层数影响）</>\n<每叠加<@autochess.dgreen>25</>层>获得1件带有随机效果的<@ba.vup>维式重锤</>\n<在场<@autochess.dgreen>6</>名不同【维多利亚】干员>携带装备的【维多利亚】干员<@ba.vup>攻击力</>提升，携带进阶装备时额外提升',
    garrisonDesc: '<休整期结束时>场上每有1名不同阶的【维多利亚】/【奇迹】干员使已激活的【维多利亚】/【奇迹】层数<@ba.vup>+2</>',
  },
  chess_char_6_17_a: {
    name: '耀骑士临光',
    profession: '近卫',
    subProfession: '无畏者',
    bondName: '卡西米尔',
    bondDesc: '每次有干员部署时，【卡西米尔】干员攻击力<@ba.vup>+20%</>持续至战斗结束<@autochess.gray>（上限受层数影响）</>\n<在场<@autochess.dgreen>6</>名不同【卡西米尔】干员>【卡西米尔】干员阻挡敌人时每<@ba.vup>2</>秒对周围敌人造成<@ba.vup>120%</>攻击力真实伤害和<@ba.vup>0.1</>秒晕眩，未阻挡敌人时攻击附带<@ba.vup>30%</>攻击力的真实伤害',
    garrisonDesc: '<战斗开始时>使<@ba.vup>自身</>和<@ba.vup>身前一格</>干员获得特质“【卡西米尔】每叠加3层，本干员再部署时间<@ba.vup>-1.5%</>”',
  },
};

const EXPECTED_MULTI_GARRISON_DETAILS = {
  chess_char_2_05_a: {
    ids: ['garrison_09_a', 'garrison_03_a'],
    descs: [
      '攻击力和生命值+<@ba.vup>20%</>；核心盟约每叠加3层，本干员攻击力和生命值<@ba.vup>+1%</>',
      '攻击力和生命值+<@ba.vup>20%</>',
    ],
  },
  chess_char_2_12_a: {
    ids: ['garrison_75_a', 'garrison_143_a'],
    descs: [
      '<部署时>使已激活的【卡西米尔】层数<@ba.vup>+1</>\n<被击倒时>使已激活的【不屈】层数<@ba.vup>+2</>',
      '<部署时>使已激活的【卡西米尔】层数<@ba.vup>+1</>',
    ],
  },
  chess_char_3_17_a: {
    ids: ['garrison_137_a', 'garrison_01_a'],
    descs: [
      '<战斗中>攻击力和生命值+<@ba.vup>25%</>，造成的伤害变为弱点伤害（基于敌人的防御力和法术抗性变换物理和法术伤害）',
      '<战斗中>造成的伤害变为弱点伤害（基于敌人的防御力和法术抗性变换物理和法术伤害）',
    ],
  },
  chess_char_5_01_a: {
    ids: ['garrison_23_a', 'garrison_55_a'],
    descs: [
      '<战斗中>自身每消耗7发子弹，使已激活的【拉特兰】层数<@ba.vup>+7</>、【远见】层数<@ba.vup>+3</>（每场战斗分别至多触发7次）',
      '【23】<战斗中>自身每消耗7发子弹，使已激活的【拉特兰】层数<@ba.vup>+7</>、【远见】层数<@ba.vup>+3</>（【远见】每场战斗至多21层）',
    ],
  },
  chess_char_5_21_a: {
    ids: ['garrison_141_a', 'garrison_142_a'],
    descs: [
      '<进入休整期时><休整期结束时>使已激活的【远见】层数<@ba.vup>+4</>',
      '<休整期结束时>使已激活的【远见】层数<@ba.vup>+4</>',
    ],
  },
  chess_char_6_07_a: {
    ids: ['garrison_53_a', 'garrison_54_a'],
    descs: [
      '<休整期结束时>场上每有1名不同阶的【维多利亚】/【奇迹】干员使已激活的【维多利亚】/【奇迹】层数<@ba.vup>+2</>',
      '<休整期结束时>场上每有1名不同阶的【维多利亚】/【奇迹】干员使已激活的【维多利亚】/【奇迹】层数<@ba.vup>+2</>',
    ],
  },
  chess_char_6_12_a: {
    ids: ['garrison_09_a', 'garrison_03_a'],
    descs: [
      '攻击力和生命值+<@ba.vup>20%</>；核心盟约每叠加3层，本干员攻击力和生命值<@ba.vup>+1%</>',
      '攻击力和生命值+<@ba.vup>20%</>',
    ],
  },
  chess_char_6_17_a: {
    ids: ['garrison_145_a', 'garrison_144_a'],
    descs: [
      '<战斗开始时>使<@ba.vup>自身</>和<@ba.vup>身前一格</>干员获得特质“【卡西米尔】每叠加3层，本干员再部署时间<@ba.vup>-1.5%</>”',
      '【145】【卡西米尔】每叠加3层，本干员再部署时间<@ba.vup>-1.5%</>',
    ],
  },
};

function getPhase(record, key) {
  return record.phases.find((item) => item.key === key);
}

function findByBaseChessId(operators, chessId) {
  return operators.find((item) => getPhase(item, 'base')?.chessId === chessId);
}

function findByOperatorKey(operators, operatorKey) {
  return operators.find((item) => item.operatorKey === operatorKey);
}

test('buildOperatorRecords exports fixed plus DIY operator records with stable record keys', async () => {
  const source = await loadAct2autochessSource();
  const result = buildOperatorRecords(source);

  assert.equal(result.activityId, 'act2autochess');
  assert.equal(result.count, 197);
  assert.equal(result.bonds.length, 23);
  assert.ok(result.strategies.length > 0);
  assert.equal(result.operators.length, 197);
  assert.equal(new Set(result.operators.map((item) => item.operatorKey)).size, 197);
  assert.ok(findByOperatorKey(result.operators, 'fixed:chess_char_3_01_a'));
  assert.ok(findByOperatorKey(result.operators, 'diy:char_613_acmedc'));
  assert.equal(findByOperatorKey(result.operators, 'diy:5:char_613_acmedc'), undefined);
  assert.equal(findByOperatorKey(result.operators, 'diy:6:char_613_acmedc'), undefined);
});

test('buildOperatorRecords exports strategy definitions with local icon paths and preserved newlines', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());
  const strategy = result.strategies.find((item) => item.strategyId === 'band_duyaoy');

  assert.deepEqual(strategy, {
    strategyId: 'band_duyaoy',
    name: '杜遥夜',
    iconId: 'icon_duyaoy',
    iconPath: '/data/act2autochess/assets/strategies/band_duyaoy.png',
    totalHp: 29,
    unlockDesc: null,
    effectId: 'aceffect_band_28',
    effectName: '广交豪杰',
    effectDesc: '【广交豪杰】每回合前2次主动刷新为特殊刷新：优先刷新出1名炎干员\n在炎部分干员缺席时体验可能不完整',
  });
});

test('buildOperatorRecords fills required operator fields for a sample operator', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());
  const record = findByBaseChessId(result.operators, 'chess_char_3_01_a');

  assert.equal(record.operatorKey, 'fixed:chess_char_3_01_a');
  assert.deepEqual(record.source, { kind: 'fixed', label: '固定编队', isInferred: false });
  assert.equal(record.charId, 'char_103_angel');
  assert.equal(record.name, '能天使');
  assert.equal(record.appellation, 'Exusiai');
  assert.deepEqual(record.profession, { code: 'SNIPER', label: '狙击' });
  assert.deepEqual(record.subProfession, { code: 'fastshot', label: '速射手' });
  assert.deepEqual(record.rarity, { code: 'TIER_6', label: '六星', value: 6 });
  assert.deepEqual(record.assets, {
    avatarId: 'char_103_angel',
    portraitId: 'char_103_angel_1',
    avatarPath: '/data/act2autochess/assets/operators/char_103_angel.png',
  });
  assert.deepEqual(record.shop.tier, { value: 3, label: 'III阶' });
  assert.equal(typeof record.shop.purchasePrice, 'number');
  assert.equal(typeof record.shop.sellPrice, 'number');
  assert.equal(record.bonds.length, 2);
  assert.equal(record.bonds[0].category.key, 'core');
  assert.equal(record.bonds[1].category.key, 'extra');
  assert.deepEqual(record.phases.map((item) => item.key), ['base', 'elite']);
  assert.equal('upgrade' in record, false);
  assert.equal('bondIds' in record, false);
  assert.equal('garrisonIds' in record, false);
});

test('buildOperatorRecords exports normalized bond definitions with activation thresholds', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());
  const laterano = result.bonds.find((item) => item.bondId === 'lateranoShip');
  const stead = result.bonds.find((item) => item.bondId === 'steadShip');

  assert.deepEqual(laterano, {
    bondId: 'lateranoShip',
    name: '拉特兰',
    iconId: 'icon_lateranoShip',
    identifier: 5,
    category: { key: 'core', label: '核心盟约' },
    desc: '【拉特兰】干员开启技能获得的弹药量提升（受层数影响）\n在场6名不同【拉特兰】干员【拉特兰】干员每消耗1发弹药，所有【拉特兰】干员攻击力提升（有上限）',
    activationThreshold: 3,
    activationType: 'BATTLE',
    activationCondition: 'BOARD',
  });
  assert.equal(stead.activationThreshold, 2);
});

test('buildOperatorRecords derives a single DIY Touch record with support bond and no fake phases', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());
  const diy = findByOperatorKey(result.operators, 'diy:char_613_acmedc');

  assert.deepEqual(diy.source, { kind: 'diy', label: '自选编队', isInferred: true });
  assert.equal(diy.charId, 'char_613_acmedc');
  assert.equal(diy.name, 'Touch');
  assert.equal(diy.rarity.code, 'TIER_6');
  assert.deepEqual(diy.shop.tier, { value: 0, label: '无阶级' });
  assert.equal(diy.shop.purchasePrice, 4);
  assert.deepEqual(diy.bonds.map((item) => item.bondId), ['emptyShip']);
  assert.deepEqual(diy.phases, []);
});

test('buildOperatorRecords uses the published DIY core-bond mapping for listed self-select operators', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());
  const diy = findByOperatorKey(result.operators, 'diy:char_112_siege');

  assert.equal(diy.name, '推进之王');
  assert.deepEqual(diy.bonds.map((item) => item.bondId), ['victoriaShip']);
});

test('buildOperatorRecords preserves bond order and phase-local garrison ordering', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());
  const multi = findByBaseChessId(result.operators, 'chess_char_6_17_a');
  const basePhase = getPhase(multi, 'base');
  const elitePhase = getPhase(multi, 'elite');

  assert.deepEqual(multi.bonds.map((item) => item.bondId), ['kazimierzShip', 'raidShip']);
  assert.equal(basePhase.chessId, 'chess_char_6_17_a');
  assert.equal(elitePhase.chessId, 'chess_char_6_17_b');
  assert.deepEqual(basePhase.garrisons.map((item) => item.garrisonId), ['garrison_145_a', 'garrison_144_a']);
  assert.deepEqual(elitePhase.garrisons.map((item) => item.garrisonId), ['garrison_145_b', 'garrison_144_b']);
  assert.ok(basePhase.garrisons.every((item) => typeof item.garrisonDesc === 'string' && item.garrisonDesc.length > 0));
  assert.ok(elitePhase.garrisons.every((item) => typeof item.garrisonDesc === 'string' && item.garrisonDesc.length > 0));
  assert.deepEqual(basePhase.garrisons[0].triggerTimings, ['战斗开始时']);
  assert.deepEqual(basePhase.garrisons[1].triggerTimings, ['常驻/被动']);
  assert.deepEqual(elitePhase.garrisons[0].triggerTimings, ['战斗开始时']);
});

test('buildOperatorRecords exports upgraded garrison variants as a symmetric phase array', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());

  assert.deepEqual(
    getPhase(findByBaseChessId(result.operators, 'chess_char_3_01_a'), 'elite'),
    {
      key: 'elite',
      label: '精锐',
      chessId: 'chess_char_3_01_b',
      garrisons: [
        {
          garrisonId: 'garrison_26_b',
          garrisonDesc: '获得时使下个休整期额外获得2资金',
          triggerTimings: ['获得时'],
        },
      ],
    },
  );

  assert.deepEqual(
    getPhase(findByBaseChessId(result.operators, 'chess_char_5_01_a'), 'elite'),
    {
      key: 'elite',
      label: '精锐',
      chessId: 'chess_char_5_01_b',
      garrisons: [
        {
          garrisonId: 'garrison_23_b',
          garrisonDesc: '战斗中自身每消耗7发子弹，使已激活的【拉特兰】层数+14、【远见】层数+6（每场战斗至多触发7次）',
          triggerTimings: ['战斗中'],
        },
        {
          garrisonId: 'garrison_55_b',
          garrisonDesc: '【23】战斗中自身每消耗7发子弹，使已激活的【拉特兰】层数+14、【远见】层数+6（【远见】每场战斗至多42层）',
          triggerTimings: ['常驻/被动'],
        },
      ],
    },
  );

  assert.deepEqual(
    getPhase(findByBaseChessId(result.operators, 'chess_char_6_17_a'), 'elite'),
    {
      key: 'elite',
      label: '精锐',
      chessId: 'chess_char_6_17_b',
      garrisons: [
        {
          garrisonId: 'garrison_145_b',
          garrisonDesc: '战斗开始时使自身和身前一格干员获得特质“【卡西米尔】每叠加3层，本干员再部署时间-3%”',
          triggerTimings: ['战斗开始时'],
        },
        {
          garrisonId: 'garrison_144_b',
          garrisonDesc: '【卡西米尔】每叠加3层，本干员再部署时间-3%',
          triggerTimings: ['常驻/被动'],
        },
      ],
    },
  );
});

test('buildOperatorRecords matches the fixed manual verification samples', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());

  for (const [chessId, expected] of Object.entries(EXPECTED_SAMPLE_SUMMARIES)) {
    const record = findByBaseChessId(result.operators, chessId);
    assert.ok(record, `Missing sample record: ${chessId}`);
    assert.equal(record.name, expected.name);
    assert.equal(record.profession.label, expected.profession);
    assert.equal(record.subProfession.label, expected.subProfession);
    assert.equal(record.bonds[0]?.name, expected.bondName);
    assert.equal(record.bonds[0]?.desc, cleanDisplayText(expected.bondDesc));
    assert.equal(getPhase(record, 'base').garrisons[0]?.garrisonDesc, cleanDisplayText(expected.garrisonDesc));
  }
});

test('buildOperatorRecords emits the required report fields and new phase invariants', async () => {
  const { report, operators } = buildOperatorRecords(await loadAct2autochessSource());

  for (const key of [
    'activityId',
    'fixedOperatorCount',
    'diyCandidateCharCount',
    'diyOperatorCount',
    'exportedCount',
    'diySlotChessIds',
    'missingCharIdMappings',
    'missingBondMappings',
    'missingGarrisonMappings',
    'duplicateChessIds',
    'multiGarrisonChessIds',
  ]) {
    assert.ok(key in report);
  }

  assert.equal(report.activityId, 'act2autochess');
  assert.equal(report.fixedOperatorCount, 116);
  assert.equal(report.diyCandidateCharCount, 81);
  assert.equal(report.diyOperatorCount, 81);
  assert.equal(report.exportedCount, 197);
  assert.deepEqual(report.missingCharIdMappings, []);
  assert.deepEqual(report.missingBondMappings, []);
  assert.deepEqual(report.missingGarrisonMappings, []);
  assert.deepEqual(report.duplicateChessIds, []);
  assert.deepEqual(report.diySlotChessIds, [
    'chess_char_5_diy1_a',
    'chess_char_5_diy2_a',
    'chess_char_6_diy1_a',
    'chess_char_6_diy2_a',
  ]);
  assert.deepEqual(report.multiGarrisonChessIds, [
    'chess_char_2_05_a',
    'chess_char_2_12_a',
    'chess_char_3_17_a',
    'chess_char_5_01_a',
    'chess_char_5_21_a',
    'chess_char_6_07_a',
    'chess_char_6_12_a',
    'chess_char_6_17_a',
  ]);

  for (const operator of operators) {
    assert.equal(typeof operator.operatorKey, 'string');
    assert.ok(operator.source?.kind === 'fixed' || operator.source?.kind === 'diy');
    assert.equal(typeof operator.charId, 'string');
    assert.equal('upgrade' in operator, false);
    assert.equal('bondIds' in operator, false);
    assert.equal('garrisonIds' in operator, false);
    if (operator.source.kind === 'fixed') {
      assert.equal(operator.phases.length, 2);
      assert.deepEqual(operator.phases.map((item) => item.key), ['base', 'elite']);
    } else {
      assert.equal(operator.phases.length, 0);
      assert.ok(operator.bonds.length > 0);
      assert.deepEqual(operator.shop.tier, { value: 0, label: '无阶级' });
    }
    for (const phase of operator.phases) {
      assert.ok(typeof phase.chessId === 'string');
      assert.ok(Array.isArray(phase.garrisons));
      assert.ok(phase.garrisons.every((item) => typeof item.garrisonId === 'string' && typeof item.garrisonDesc === 'string'));
      assert.ok(phase.garrisons.every((item) => Array.isArray(item.triggerTimings) && item.triggerTimings.length > 0));
      assert.ok(phase.garrisons.every((item) => item.triggerTimings.every((label) => typeof label === 'string' && label.length > 0)));
      assert.ok(phase.garrisons.every((item) => !item.garrisonDesc.includes('<@') && !item.garrisonDesc.includes('</>')));
    }
  }
});

test('buildOperatorRecords exports the fixed multi-garrison details for all 8 operators in the base phase', async () => {
  const result = buildOperatorRecords(await loadAct2autochessSource());

  for (const [chessId, expected] of Object.entries(EXPECTED_MULTI_GARRISON_DETAILS)) {
    const record = findByBaseChessId(result.operators, chessId);
    assert.ok(record, `Missing multi-garrison record: ${chessId}`);
    assert.deepEqual(getPhase(record, 'base').garrisons.map((item) => item.garrisonId), expected.ids);
    assert.deepEqual(getPhase(record, 'base').garrisons.map((item) => item.garrisonDesc), expected.descs.map(cleanDisplayText));
  }
});
