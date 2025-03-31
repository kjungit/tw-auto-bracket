import * as assert from 'assert';
import * as extension from '../extension';

// 기본 유닛 테스트
describe('Tailwind Auto Bracket Extension Tests', () => {
  it('mapProperty 함수 테스트', () => {
    assert.strictEqual(extension.mapProperty('w'), 'w');
    assert.strictEqual(extension.mapProperty('minw'), 'min-w');
    assert.strictEqual(extension.mapProperty('MAXH'), 'max-h');
    assert.strictEqual(extension.mapProperty('translatex'), 'translate-x');
  });
  
  it('parseSpacingFromConfig 함수 테스트', () => {
    const configContent = `
      module.exports = {
        theme: {
          spacing: {
            '1': '0.25rem',
            '2': '0.5rem',
            '4': '1rem',
          },
          extend: {
            spacing: {
              '72': '18rem',
              '84': '21rem',
              '96': '24rem',
            }
          }
        }
      }
    `;
    
    const expectedUnits = {
      '1': '0.25rem',
      '2': '0.5rem',
      '4': '1rem',
      '72': '18rem',
      '84': '21rem',
      '96': '24rem'
    };
    
    const units = extension.ParseSpacingFromConfig(configContent);
    assert.deepStrictEqual(units, expectedUnits);
  });
});

// 직접 실행
if (require.main === module) {
  console.log('직접 테스트 실행 중...');
  let passedTests = 0;
  let failedTests = 0;
  
  // 수동 테스트 실행
  try {
    assert.strictEqual(extension.mapProperty('w'), 'w');
    assert.strictEqual(extension.mapProperty('minw'), 'min-w');
    assert.strictEqual(extension.mapProperty('MAXH'), 'max-h');
    assert.strictEqual(extension.mapProperty('translatex'), 'translate-x');
    passedTests += 4;
    console.log('✅ mapProperty 함수 테스트 통과');
  } catch (error) {
    failedTests++;
    console.error('❌ mapProperty 함수 테스트 실패:', error);
  }
  
  try {
    const configContent = `
      module.exports = {
        theme: {
          spacing: {
            '1': '0.25rem',
            '2': '0.5rem',
            '4': '1rem',
          },
          extend: {
            spacing: {
              '72': '18rem',
              '84': '21rem',
              '96': '24rem',
            }
          }
        }
      }
    `;
    
    const expectedUnits = {
      '1': '0.25rem',
      '2': '0.5rem',
      '4': '1rem',
      '72': '18rem',
      '84': '21rem',
      '96': '24rem'
    };
    
    const units = extension.ParseSpacingFromConfig(configContent);
    assert.deepStrictEqual(units, expectedUnits);
    passedTests++;
    console.log('✅ parseSpacingFromConfig 함수 테스트 통과');
  } catch (error) {
    failedTests++;
    console.error('❌ parseSpacingFromConfig 함수 테스트 실패:', error);
  }
  
  console.log(`\n테스트 결과: ${passedTests}개 통과, ${failedTests}개 실패`);
  
  if (failedTests > 0) {
    process.exit(1);
  }
} 