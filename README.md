# Tailwind CSS Auto Bracket

A VS Code extension that automatically generates bracket syntax for Tailwind CSS, making your coding experience smoother and faster.

## Features

- Quick input using unit abbreviations: `w10p` → `w-[10px]`
- Support for various units: px, rem, vh, vw, % and more
- Support for negative values: `border-1p` → `border-[-1px]`
- Support for various properties: width, height, padding, margin and more

![autobracket](https://github.com/user-attachments/assets/3fb365b2-1b20-4ae0-a62f-97cc250fc762)





## How to Use

1. Use inside a className or class attribute.
2. Type the property name, number, and unit abbreviation.
   - Example: `w10p`, `h20vh`, `p5r`, `m10p`
3. Select the autocomplete suggestion or press Enter.

## Supported Property Abbreviations

- Width/Height: `w`, `h`, `minw`, `maxw`, `minh`, `maxh`
- Padding: `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl`
- Margin: `m`, `mx`, `my`, `mt`, `mr`, `mb`, `ml`
- Gap: `gap`, `gapx`, `gapy`
- Border: `border`, `bordert`, `borderr`, `borderb`, `borderl`
- Position: `top`, `right`, `bottom`, `left`, `inset`

## Supported Unit Abbreviations

- `p`: px (Example: `w10p` → `w-[10px]`)
- `r`: rem (Example: `w1.5r` → `w-[1.5rem]`)
- `vh`: viewport height (Example: `h20vh` → `h-[20vh]`)
- `vw`: viewport width (Example: `w50vw` → `w-[50vw]`)
- `%`: percent (Example: `w50%` → `w-[50%]`)
- `e`: em (Example: `w2e` → `w-[2em]`)

## Requirements

- Visual Studio Code 1.60.0 or higher
- Working with JavaScript, TypeScript, React, HTML, CSS, or Vue files

## Extension Settings

This extension doesn't add any settings to customize, it works right out of the box.

## Known Issues

- Only works inside className or class attributes
- Only processes patterns with a valid unit abbreviation (e.g. `w10p`, not just `w10`)

## Release Notes

### 1.0.0

- Initial release
- Automatic bracket syntax generation for Tailwind CSS
- Support for various units (px, rem, vh, vw, %)
- Support for various properties (width, height, padding, margin, etc.)
- Support for negative values

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

This extension follows the [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines) to ensure quality, performance, and compatibility with the VS Code ecosystem.

🔗 You can find and install this extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=GuardianK.tw-auto-bracket).
