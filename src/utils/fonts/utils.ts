const FONT_CSS_TAG = "data-fonts";
const FONT_CSS_TAG_BASE64 = "base64-fonts";

/**
 * 批量添加自定义字体样式
 * @param fontList
 */
export function addCustomFonts(fontList: any = []) {
  let styleTag = document.createElement("style");
  styleTag.setAttribute(FONT_CSS_TAG, "true");
  let fontRules = fontList
    .map(
      (font: any) => `@font-face {
        font-family: "${font.name}";
        src: local("${font.name}"), url("${font.download}")
    }`,
    )
    .join("\n");
  styleTag.textContent = fontRules;
  document.head.appendChild(styleTag);
  // TODO 加载到系统字体库中
}
