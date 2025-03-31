import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Tailwind 설정 인터페이스
interface TailwindConfig {
  theme?: {
    extend?: {
      spacing?: Record<string, string>;
      [key: string]: any;
    };
    spacing?: Record<string, string>;
    [key: string]: any;
  };
  [key: string]: any;
}

// 사용자 정의 단위 저장소
let customUnits: Record<string, string> = {};

// 속성 매핑 정의
const propertyMap: { [key: string]: string } = {
  // 레이아웃 (하이픈 없는 버전 추가)
  "w": "w",
  "h": "h",
  "minw": "min-w",
  "minh": "min-h",
  "maxw": "max-w",
  "maxh": "max-h",
  "width": "w",
  "height": "h",
  
  // 패딩
  "p": "p",
  "px": "px",
  "py": "py",
  "pt": "pt",
  "pb": "pb",
  "pl": "pl",
  "pr": "pr",
  "padding": "p",
  
  // 마진
  "m": "m",
  "mx": "mx",
  "my": "my",
  "mt": "mt",
  "mb": "mb",
  "ml": "ml",
  "mr": "mr",
  "margin": "m",
  
  // 간격
  "g": "gap",
  "gap": "gap",
  "gapx": "gap-x",
  "gapy": "gap-y",
  
  // 위치
  "top": "top",
  "right": "right",
  "bottom": "bottom",
  "left": "left",
  "inset": "inset",
  "insetx": "inset-x",
  "insety": "inset-y",
  
  // 여백, 테두리, 크기 조정
  "spacex": "space-x",
  "spacey": "space-y",
  "border": "border",
  "bordert": "border-t",
  "borderr": "border-r",
  "borderb": "border-b",
  "borderl": "border-l",
  "rounded": "rounded",
  "roundedt": "rounded-t",
  "roundedr": "rounded-r",
  "roundedb": "rounded-b",
  "roundedl": "rounded-l",
  "borderradius": "rounded",
  
  // 그림자 및 투명도
  "opacity": "opacity",
  "shadow": "shadow",
  
  // 변환 및 전환
  "translatex": "translate-x",
  "translatey": "translate-y",
  "rotate": "rotate",
  "scale": "scale",
  "scalex": "scale-x",
  "scaley": "scale-y",
  "skewx": "skew-x",
  "skewy": "skew-y",
  "duration": "duration",
  "delay": "delay",
  
  // 그리드
  "colspan": "col-span",
  "rowspan": "row-span",
  "colstart": "col-start",
  "colend": "col-end",
  "rowstart": "row-start",
  "rowend": "row-end",
  
  // 기타
  "z": "z",
  "order": "order",
  "origin": "origin",
  "outline": "outline",
  "outlineoffset": "outline-offset",
  "blur": "blur",
  "brightness": "brightness",
  "contrast": "contrast",
  "saturate": "saturate",
  "huerotate": "hue-rotate",
  "dropshadow": "drop-shadow",
  "grayscale": "grayscale",
  "invert": "invert",
  "sepia": "sepia",
  
  // 기존 대시 포함 속성들도 추가
  "min-w": "min-w",
  "min-h": "min-h",
  "max-w": "max-w",
  "max-h": "max-h",
  "gap-x": "gap-x",
  "gap-y": "gap-y",
  "inset-x": "inset-x",
  "inset-y": "inset-y",
  "space-x": "space-x",
  "space-y": "space-y",
  "border-t": "border-t",
  "border-r": "border-r",
  "border-b": "border-b",
  "border-l": "border-l",
  "rounded-t": "rounded-t",
  "rounded-r": "rounded-r",
  "rounded-b": "rounded-b",
  "rounded-l": "rounded-l",
  "translate-x": "translate-x",
  "translate-y": "translate-y",
  "scale-x": "scale-x",
  "scale-y": "scale-y",
  "skew-x": "skew-x",
  "skew-y": "skew-y",
  "col-span": "col-span",
  "row-span": "row-span",
  "col-start": "col-start",
  "col-end": "col-end",
  "row-start": "row-start",
  "row-end": "row-end",
  "outline-offset": "outline-offset",
  "hue-rotate": "hue-rotate",
  "drop-shadow": "drop-shadow"
};

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ Tailwind Auto Unit Extension Activated!");

  // Tailwind 설정 파일 찾기 및 파싱
  findAndParseTailwindConfig();
  
  // 워크스페이스 폴더 변경 이벤트 감지
  const workspaceFoldersChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    findAndParseTailwindConfig();
  });
  
  // 파일 저장 이벤트 감지 (tailwind.config.js 파일이 수정된 경우)
  const fileChangeDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.fileName.endsWith('tailwind.config.js') || document.fileName.endsWith('tailwind.config.ts')) {
      findAndParseTailwindConfig();
    }
  });
  
  // 텍스트 변경 이벤트 감지 - 자동완성 개선을 위해 추가
  const textChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.contentChanges.length > 0) {
      // 변경된 텍스트가 있으면 자동완성을 강제로 트리거
      if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
        const document = event.document;
        const position = vscode.window.activeTextEditor.selection.active;
        const languages = ["javascript", "typescriptreact", "javascriptreact", "html", "css", "vue"];
        
        if (languages.includes(document.languageId)) {
          // 현재 라인과 커서 위치 가져오기
          const line = document.lineAt(position.line).text;
          const linePrefix = line.slice(0, position.character);
          
          // class 또는 className 속성 내부인지 확인
          if (/(class|className)=["'][^"']*$/.test(linePrefix)) {
            // 마지막 단어 추출 (공백으로 구분)
            const wordMatch = linePrefix.match(/[\w\-%\.]+$/);
            if (wordMatch) {
              const word = wordMatch[0];
              
              // 즉시 인식하려는 패턴 검사
              // 1. 단일 속성 (w, h, p, m 등) - 처리하지 않음
              
              // 2. 속성+숫자+단위 패턴 (w1p, h2vh, p10rem 등)
              // 단위 문자가 숫자 뒤에 있는 경우에만 자동완성 트리거
              const fullPatternMatch = /^[a-zA-Z][-a-zA-Z]*\d+[a-z%]+$/.test(word);
              
              if (fullPatternMatch) {
                // 타이핑 중에 즉시 자동완성 트리거 (지연 없이)
                vscode.commands.executeCommand('editor.action.triggerSuggest');
              }
            }
          }
        }
      }
    }
  });

  // 자동완성 제공자 등록
  const provider = vscode.languages.registerCompletionItemProvider(
    ["javascript", "typescriptreact", "javascriptreact", "html", "css", "vue"],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const line = document.lineAt(position).text;
        const linePrefix = line.slice(0, position.character);
        
        console.log("입력된 텍스트:", linePrefix);

        // class 또는 className 안에 있는지 확인 (더 정확한 패턴으로 개선)
        if (!/(class|className)=["'][^"']*$/.test(linePrefix)) {
          console.log("class 속성 안에 없음");
          return [];
        }

        // 마지막 단어 추출 - 탭/공백으로 구분된 가장 마지막 단어 추출
        const wordMatch = linePrefix.match(/[\w\-%\.]+$/);
        if (!wordMatch) {
          console.log("단어 없음");
          return [];
        }

        const word = wordMatch[0];
        console.log("찾은 단어:", word);
        
        // --- 단일 속성 처리 (w, h, p, m 등) ---
        // 단독 속성은 더 이상 자동완성하지 않음
        // if (/^[a-zA-Z][-a-zA-Z]*$/.test(word)) { ... }
        
        // --- 속성+숫자+단위 패턴 (w1p, h2vh, p10rem 등) ---
        const propNumberUnitMatch = /^([a-zA-Z][-a-zA-Z]*?)(\d+)([a-z%]+)$/.exec(word);
        if (propNumberUnitMatch) {
          console.log("속성+숫자+단위 패턴 매치됨:", propNumberUnitMatch);
          const [_, propName, numberVal, unitVal] = propNumberUnitMatch;
          
          let property = propName.toLowerCase();
          const number = numberVal;
          const unit = unitVal.toLowerCase();
          
          // 하이픈 없는 속성 변환 매핑
          if (propertyMap[property]) {
            property = propertyMap[property];
          }
          
          console.log("변환된 속성:", property);
          
          const completionItems: vscode.CompletionItem[] = [];
          const wordRange = new vscode.Range(
            position.translate(0, -word.length),
            position
          );
          
          // 단위 매핑
          const unitMap: { [key: string]: string } = {
            px: "px",
            p: "px",
            r: "rem",
            "%": "%", 
            vw: "vw",
            vh: "vh",
            e: "em"
          };
          
          // 숫자가 음수인지 확인 (음수는 속성에 하이픈이 있고, 숫자가 양수인 경우)
          const isNegative = property.endsWith('-') && !number.startsWith('-');
          const absoluteNumber = number;
          
          // 속성명에서 맨 뒤 하이픈 제거 (속성-숫자 형태인 경우)
          const cleanProperty = isNegative ? property.substring(0, property.length - 1) : property;
          
          const mappedUnit = unitMap[unit] || unit;
          
          // 음수일 경우 border-[-1px] 형식, 양수일 경우 border-[1px] 형식
          const bracketContent = isNegative ? `[-${absoluteNumber}${mappedUnit}]` : `[${number}${mappedUnit}]`;
          const newText = `${cleanProperty}-${bracketContent}`;
          
          const item = new vscode.CompletionItem(newText, vscode.CompletionItemKind.Text);
          item.insertText = newText;
          item.detail = `Tailwind 단위 변환: ${isNegative ? '-' : ''}${absoluteNumber}${mappedUnit}`;
          item.range = wordRange;
          item.preselect = true; // 첫 번째 항목 자동 선택
          completionItems.push(item);
          
          console.log("제안 항목:", completionItems.map(item => item.label).join(", "));
          return completionItems;
        }
        
        // --- 속성+숫자+단위 패턴만 처리하도록 변경 ---
        const directPatternMatch = /^([a-zA-Z][-a-zA-Z]*?)(\d+)([a-z%]+)$/.exec(word);
        if (directPatternMatch) {
          console.log("직접 패턴 매치됨:", directPatternMatch);
          const [_, propName, numberVal, unitVal] = directPatternMatch;
          
          // 여기서 속성 이름, 숫자, 단위를 사용하여 자동 완성 생성
          let property = propName.toLowerCase();
          if (propertyMap[property]) {
            property = propertyMap[property];
          }
          
          const completionItems: vscode.CompletionItem[] = [];
          const wordRange = new vscode.Range(
            position.translate(0, -word.length),
            position
          );
          
          // 단위 매핑
          const unitMap: { [key: string]: string } = {
            px: "px",
            p: "px",
            r: "rem",
            "%": "%", 
            vw: "vw",
            vh: "vh",
            e: "em"
          };
          
          // 숫자가 음수인지 확인 (음수는 속성에 하이픈이 있고, 숫자가 양수인 경우)
          const isNegative = property.endsWith('-') && !numberVal.startsWith('-');
          const absoluteNumber = numberVal;
          
          // 속성명에서 맨 뒤 하이픈 제거 (속성-숫자 형태인 경우)
          const cleanProperty = isNegative ? property.substring(0, property.length - 1) : property;
          
          const mappedUnit = unitMap[unitVal] || unitVal;
          
          // 음수일 경우 border-[-1px] 형식, 양수일 경우 border-[1px] 형식
          const bracketContent = isNegative ? `[-${absoluteNumber}${mappedUnit}]` : `[${numberVal}${mappedUnit}]`;
          const newText = `${cleanProperty}-${bracketContent}`;
          
          const item = new vscode.CompletionItem(newText, vscode.CompletionItemKind.Text);
          item.insertText = newText;
          item.detail = `Tailwind 단위 변환: ${isNegative ? '-' : ''}${absoluteNumber}${mappedUnit}`;
          item.range = wordRange;
          item.preselect = true; // 첫 번째 항목 자동 선택
          completionItems.push(item);
          
          console.log("제안 항목:", completionItems.map(item => item.label).join(", "));
          return completionItems;
        }
        
        // 단위 문자가 없는 경우는 처리하지 않음 - w1, h2 같은 패턴에 대해 자동완성 제안하지 않음
        return [];
      }
    },
    // 트리거 문자 - 모든 알파벳, 숫자, 특수문자와 단위 문자들
    ... "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-%.pxremvwh".split("")
  );

  context.subscriptions.push(provider);
  context.subscriptions.push(workspaceFoldersChangeDisposable);
  context.subscriptions.push(fileChangeDisposable);
  context.subscriptions.push(textChangeDisposable);
}

/**
 * tailwind.config.js 파일을 찾아서 파싱하는 함수
 */
function findAndParseTailwindConfig() {
  // 기본 설정 초기화
  customUnits = {};
  
  // 현재 워크스페이스 폴더가 없으면 종료
  if (!vscode.workspace.workspaceFolders?.length) {
    return;
  }
  
  // 모든 워크스페이스 폴더에서 tailwind.config.js 찾기
  for (const folder of vscode.workspace.workspaceFolders) {
    const configPaths = [
      path.join(folder.uri.fsPath, 'tailwind.config.js'),
      path.join(folder.uri.fsPath, 'tailwind.config.ts')
    ];
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          // Node.js에서는 직접 require를 사용할 수 있지만, VSCode 확장에서는 더 복잡합니다.
          // 여기서는 파일을 직접 읽고 간단한 파싱을 수행합니다.
          const configContent = fs.readFileSync(configPath, 'utf8');
          
          // 테마 설정에서 spacing 값 추출 (간단한 정규식 기반 파싱)
          // 테스트용으로 export한 함수를 내부에서도 사용
          const spacingUnits = parseSpacingFromConfig(configContent);
          customUnits = { ...spacingUnits };
          
          console.log("✅ Tailwind 설정 파일 파싱 완료:", configPath);
          console.log("📐 사용자 정의 단위:", customUnits);
          return; // 첫 번째 발견된 설정 파일만 사용
        } catch (error) {
          console.error("❌ Tailwind 설정 파일 파싱 실패:", error);
        }
      }
    }
  }
  
  console.log("⚠️ Tailwind 설정 파일을 찾을 수 없습니다.");
}

/**
 * tailwind.config.js 파일 내용에서 spacing 설정을 추출하는 함수
 */
function parseSpacingFromConfig(configContent: string): Record<string, string> {
  const units: Record<string, string> = {};
  
  try {
    // 기본 spacing 설정 추출
    const spacingMatch = configContent.match(/spacing\s*:\s*{([^}]*)}/);
    if (spacingMatch && spacingMatch[1]) {
      const spacingBlock = spacingMatch[1];
      const spacingEntries = spacingBlock.match(/'(\d+)':\s*'([^']+)'/g);
      
      if (spacingEntries) {
        for (const entry of spacingEntries) {
          const [key, value] = entry.split(':').map(part => part.trim().replace(/'/g, ''));
          units[key] = value;
        }
      }
    }
    
    // extend 내의 spacing 설정 추출
    const extendMatch = configContent.match(/extend\s*:\s*{([^}]*)spacing\s*:\s*{([^}]*)}/);
    if (extendMatch && extendMatch[2]) {
      const extendBlock = extendMatch[2];
      const extendEntries = extendBlock.match(/'(\d+)':\s*'([^']+)'/g);
      
      if (extendEntries) {
        for (const entry of extendEntries) {
          const [key, value] = entry.split(':').map(part => part.trim().replace(/'/g, ''));
          units[key] = value;
        }
      }
    }
  } catch (error) {
    console.error('Tailwind 설정 파싱 오류:', error);
  }
  
  return units;
}

export function deactivate() {}

// 테스트를 위해 export하는 함수
export function mapProperty(property: string): string {
  // 대소문자 구분 없이 처리
  const lowerProperty = property.toLowerCase();
  
  // 속성 매핑 로직
  // min-w, max-h 등의 속성을 처리
  if (lowerProperty.startsWith('min') && !lowerProperty.includes('-')) {
    return `min-${lowerProperty.substring(3)}`;
  }
  if (lowerProperty.startsWith('max') && !lowerProperty.includes('-')) {
    return `max-${lowerProperty.substring(3)}`;
  }
  
  // translate-x, translate-y 등 변환
  if (lowerProperty.startsWith('translate') && !lowerProperty.includes('-') && 
      (lowerProperty.endsWith('x') || lowerProperty.endsWith('y'))) {
    return `translate-${lowerProperty.substring(lowerProperty.length - 1)}`;
  }
  
  // gap-x, gap-y 처리
  if (lowerProperty.startsWith('gap') && !lowerProperty.includes('-') && 
      (lowerProperty.endsWith('x') || lowerProperty.endsWith('y'))) {
    return `gap-${lowerProperty.substring(lowerProperty.length - 1)}`;
  }
  
  return lowerProperty;
}

// 테스트를 위해 export하는 함수
export function ParseSpacingFromConfig(configContent: string): Record<string, string> {
  const units: Record<string, string> = {};
  
  try {
    // 기본 spacing 설정 추출
    const spacingMatch = configContent.match(/spacing\s*:\s*{([^}]*)}/);
    if (spacingMatch && spacingMatch[1]) {
      const spacingBlock = spacingMatch[1];
      const spacingEntries = spacingBlock.match(/'(\d+)':\s*'([^']+)'/g);
      
      if (spacingEntries) {
        for (const entry of spacingEntries) {
          const [key, value] = entry.split(':').map(part => part.trim().replace(/'/g, ''));
          units[key] = value;
        }
      }
    }
    
    // extend 내의 spacing 설정 추출
    const extendMatch = configContent.match(/extend\s*:\s*{([^}]*)spacing\s*:\s*{([^}]*)}/);
    if (extendMatch && extendMatch[2]) {
      const extendBlock = extendMatch[2];
      const extendEntries = extendBlock.match(/'(\d+)':\s*'([^']+)'/g);
      
      if (extendEntries) {
        for (const entry of extendEntries) {
          const [key, value] = entry.split(':').map(part => part.trim().replace(/'/g, ''));
          units[key] = value;
        }
      }
    }
  } catch (error) {
    console.error('Tailwind 설정 파싱 오류:', error);
  }
  
  return units;
}
