import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCandidateListMarkup } from '../../web/candidate-list.mjs';

test('renderCandidateListMarkup hides profession and subProfession lines in the left list', () => {
  const markup = renderCandidateListMarkup({
    showCandidateList: true,
    candidateItems: [
      {
        operatorKey: 'fixed:char_103_exusiai',
        name: '能天使',
        sourceLabel: '固定编队',
        professionLabel: '狙击',
        subProfessionLabel: '速射手',
        tierLabel: 'V阶',
        avatarUrl: null,
        avatarFallbackUrls: [],
        isSelected: true,
      },
    ],
  });

  assert.match(markup, /固定编队/);
  assert.match(markup, /V阶/);
  assert.doesNotMatch(markup, /狙击/);
  assert.doesNotMatch(markup, /速射手/);
});
