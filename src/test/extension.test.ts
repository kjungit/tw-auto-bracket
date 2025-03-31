import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// 테스트를 위해 확장 프로그램의 내부 함수를 가져오기 위한 설정
// 실제 테스트에서는 확장 프로그램의 함수를 직접 가져와야 합니다.
// 테스트를 위해 확장 프로그램 코드를 export 가능한 형태로 수정해야 할 수도 있습니다.
import * as extension from '../extension';

// 테스트용 helper 함수들
function createMockTextDocument(content: string): vscode.TextDocument {
	return {
		getText: () => content,
		getWordRangeAtPosition: () => new vscode.Range(0, 0, 0, content.length),
		lineAt: () => ({ text: content }),
		positionAt: (offset: number) => new vscode.Position(0, offset),
		offsetAt: (position: vscode.Position) => position.character,
		lineCount: 1,
		fileName: 'test.tsx',
		uri: vscode.Uri.file('test.tsx'),
		version: 1,
		isDirty: false,
		isUntitled: false,
		languageId: 'typescriptreact',
		eol: vscode.EndOfLine.LF,
		save: () => Promise.resolve(true),
	} as any;
}

function createMockPosition(character: number): vscode.Position {
	return new vscode.Position(0, character);
}

suite('Tailwind Auto Bracket Extension Tests', () => {
	vscode.window.showInformationMessage('시작: Tailwind Auto Bracket 확장 프로그램 테스트');

	// 정규식 패턴 테스트 함수
	function testRegexPatternMatch(input: string, expectedProperty: string, expectedNumber: string, expectedUnit: string) {
		// 테스트할 정규식 패턴
		const pattern = /^([a-zA-Z][-a-zA-Z0-9]*?)([-]?\d+)([pvherw]|vh|vw|%)?$/;
		const match = pattern.exec(input);
		
		if (expectedProperty === '') {
			// 매치가 없어야 하는 경우
			assert.strictEqual(match, null);
			return;
		}
		
		// 매치가 있어야 하는 경우
		assert.notStrictEqual(match, null);
		if (match) {
			assert.strictEqual(match[1], expectedProperty);
			assert.strictEqual(match[2], expectedNumber);
			if (expectedUnit === '') {
				assert.strictEqual(match[3], undefined);
			} else {
				assert.strictEqual(match[3], expectedUnit);
			}
		}
	}

	test('기본 속성 패턴 테스트', () => {
		testRegexPatternMatch('w20', 'w', '20', '');
		testRegexPatternMatch('h30', 'h', '30', '');
		testRegexPatternMatch('p10', 'p', '10', '');
		testRegexPatternMatch('m5', 'm', '5', '');
	});

	test('단위가 있는 패턴 테스트', () => {
		testRegexPatternMatch('w20p', 'w', '20', 'p');
		testRegexPatternMatch('h30vh', 'h', '30', 'vh');
		testRegexPatternMatch('p10vw', 'p', '10', 'vw');
		testRegexPatternMatch('m5%', 'm', '5', '%');
	});
	
	test('복합 속성 패턴 테스트', () => {
		testRegexPatternMatch('min-w20', 'min-w', '20', '');
		testRegexPatternMatch('max-h30vh', 'max-h', '30', 'vh');
		testRegexPatternMatch('gap-x10p', 'gap-x', '10', 'p');
		testRegexPatternMatch('translate-y5vw', 'translate-y', '5', 'vw');
	});
	
	test('음수 값 테스트', () => {
		testRegexPatternMatch('m-10', 'm', '-10', '');
		testRegexPatternMatch('top-20p', 'top', '-20', 'p');
		testRegexPatternMatch('left-30vh', 'left', '-30', 'vh');
		testRegexPatternMatch('translate-x-5vw', 'translate-x', '-5', 'vw');
	});
	
	test('대소문자 테스트', () => {
		testRegexPatternMatch('W20', 'W', '20', '');
		testRegexPatternMatch('MinW30', 'MinW', '30', '');
		testRegexPatternMatch('maxH40vh', 'maxH', '40', 'vh');
	});

	test('유효하지 않은 패턴 테스트', () => {
		testRegexPatternMatch('x', '', '', '');
		testRegexPatternMatch('123', '', '', '');
		testRegexPatternMatch('w-', '', '', '');
		testRegexPatternMatch('-10px', '', '', '');
		testRegexPatternMatch('p10px', '', '', ''); // px가 아닌 p만 지원
	});

	// 이하는 확장 프로그램의 내부 함수를 직접 호출할 수 있을 때 활성화
	test('속성 변환 테스트', () => {
		// mapProperty가 확장 프로그램에서 export된 함수
		assert.strictEqual(extension.mapProperty('w'), 'w');
		assert.strictEqual(extension.mapProperty('minw'), 'min-w');
		assert.strictEqual(extension.mapProperty('MAXH'), 'max-h'); // 대소문자 구분 없음
		assert.strictEqual(extension.mapProperty('translatex'), 'translate-x');
	});

	test('Tailwind Config 파싱 테스트', () => {
		// 테스트용 config 문자열
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
		
		// parseSpacingFromConfig가 확장 프로그램에서 export된 함수
		const units = extension.ParseSpacingFromConfig(configContent);
		assert.deepStrictEqual(units, expectedUnits);
	});

	// 실제 VSCode API를 통한 통합 테스트 
	// 이 테스트는 확장이 활성화된 상태에서만 실행됩니다
	test('확장 프로그램 활성화 테스트', async () => {
		// 확장 프로그램이 활성화되었는지 확인
		const extension = vscode.extensions.getExtension('your-publisher.tailwindcss-auto-bracket');
		assert.notStrictEqual(extension, undefined, '확장 프로그램이 설치되지 않았습니다');
		
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		
		assert.strictEqual(extension?.isActive, true, '확장 프로그램이 활성화되지 않았습니다');
	}).skip(); // 실제 테스트 환경에서 실행할 때는 .skip() 제거
});
