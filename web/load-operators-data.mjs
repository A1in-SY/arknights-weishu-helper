export async function loadOperatorsData(fetchImpl = fetch) {
  try {
    const response = await fetchImpl('/data/act2autochess/operators.json');

    if (!response.ok) {
      throw new Error('fetch failed');
    }

    const payload = await response.json();

    if (
      !payload ||
      payload.activityId !== 'act2autochess' ||
      typeof payload.count !== 'number' ||
      !Array.isArray(payload.bonds) ||
      !Array.isArray(payload.strategies) ||
      !Array.isArray(payload.operators)
    ) {
      throw new Error('invalid payload');
    }

    return payload;
  } catch {
    throw new Error('数据未导出，请先运行导出脚本。');
  }
}
