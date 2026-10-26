import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

interface MathViewProps {
  content: string;
  fontSize?: number;
  color?: string;
  style?: any;
  textStyle?: any;
  inline?: boolean;
}

/**
 * Universal Mobile Lesson & Rich Media Content Renderer.
 * Responsively renders full WordPress Editor content:
 * - Rich HTML typography (headings h1-h6, paragraphs, formatted text, highlights)
 * - Clickable links (<a href="...">) that open in browser
 * - Cloudinary images & inline image cards (responsive, rounded, shadow)
 * - Responsive tables with horizontal scroll wrapper
 * - Embedded YouTube / video players (16:9 ratio)
 * - Key takeaway alerts, blockquotes, and shortcode cards
 * - KaTeX Math & Science Formulas ($...$ and $$...$$)
 */
export const MathView: React.FC<MathViewProps> = ({
  content = '',
  fontSize = 15,
  color = '#1F2937',
  style,
  textStyle,
  inline = false,
}) => {
  const [webViewHeight, setWebViewHeight] = useState(inline ? 28 : 120);

  if (!content) return null;

  // Check if content contains HTML tags
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  // Check if content has LaTeX math delimiters or formula tags
  const hasLatex =
    content.includes('$') ||
    content.includes('\\frac') ||
    content.includes('\\sqrt') ||
    content.includes('\\times') ||
    content.includes('\\text') ||
    content.includes('\\sum') ||
    content.includes('\\pm');

  // If completely plain text (no HTML and no LaTeX), render formatted native paragraphs
  if (!hasHtml && !hasLatex) {
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    return (
      <View style={style}>
        {paragraphs.map((p, pIdx) => (
          <Text
            key={pIdx}
            style={[
              {
                fontSize,
                color,
                lineHeight: Math.round(fontSize * 1.55),
                letterSpacing: 0.15,
                marginBottom: pIdx === paragraphs.length - 1 ? 0 : 16,
              },
              textStyle,
            ]}
          >
            {p.trim()}
          </Text>
        ))}
      </View>
    );
  }

  // On Web platform (react-native-web)
  if (Platform.OS === 'web') {
    return (
      <View
        style={[styles.container, style]}
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Safe JSON encoding of the HTML/LaTeX string to prevent script injection breaks
  const encodedContent = JSON.stringify(content);

  const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      max-width: 100%;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: ${fontSize}px;
      color: ${color};
      line-height: 1.65;
      word-break: break-word;
      overflow-wrap: break-word;
      overflow-x: hidden;
    }
    #content-container {
      padding: 4px 2px 14px 2px;
      width: 100%;
    }
    p {
      margin: 0 0 14px 0;
      line-height: 1.65;
    }
    p:last-child {
      margin-bottom: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      margin: 18px 0 10px 0;
      font-weight: 800;
      color: ${color};
      line-height: 1.35;
      letter-spacing: -0.01em;
    }
    h1 { font-size: ${fontSize * 1.45}px; }
    h2 { font-size: ${fontSize * 1.3}px; }
    h3 { font-size: ${fontSize * 1.18}px; }
    h4 { font-size: ${fontSize * 1.08}px; }

    /* Clickable Links */
    a {
      color: #0D6D62;
      text-decoration: underline;
      font-weight: 600;
      word-break: break-all;
    }
    a:active {
      opacity: 0.7;
    }

    /* Lists */
    ul, ol {
      margin: 0 0 14px 0;
      padding-left: 22px;
    }
    li {
      margin-bottom: 6px;
      line-height: 1.6;
    }

    /* Blockquotes & Callouts */
    blockquote {
      margin: 14px 0;
      padding: 8px 12px;
      border-left: 3px solid #127A71;
      background: transparent;
      border-radius: 0;
      font-style: italic;
      color: inherit;
    }

    /* Images & Media */
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 8px;
      display: block;
      margin: 14px auto;
      object-fit: contain;
    }

    /* Clean WordPress inline image cards (strip admin delete buttons) */
    .lesson-inline-img-wrapper {
      display: block !important;
      max-width: 100% !important;
      width: 100% !important;
      margin: 12px 0 !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    .lesson-inline-img-wrapper img {
      width: 100% !important;
      max-height: 240px !important;
      object-fit: contain !important;
      margin: 0 !important;
      box-shadow: none !important;
      border-radius: 8px !important;
      background: transparent !important;
    }
    .img-delete-btn {
      display: none !important;
    }

    /* Tables (Responsive scroll wrapper) */
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      margin: 16px 0;
      -webkit-overflow-scrolling: touch;
      border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.1);
    }
    table {
      width: 100% !important;
      border-collapse: collapse;
      font-size: ${fontSize * 0.92}px;
      min-width: 280px;
    }
    th, td {
      border: 1px solid rgba(0,0,0,0.08);
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background: rgba(18, 122, 113, 0.08);
      font-weight: 700;
      color: #0D6D62;
    }
    tr:nth-child(even) {
      background-color: rgba(0,0,0,0.02);
    }

    /* Embedded Videos (YouTube 16:9 ratio) */
    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      max-width: 100%;
      margin: 18px 0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      background: #000;
    }
    .video-container iframe,
    .video-container object,
    .video-container embed {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      border: 0;
    }

    /* Highlights & Marks */
    mark {
      background-color: #FEF08A;
      color: #1F2937;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* KaTeX Math Equations */
    .katex-display {
      margin: 10px 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 6px 0;
      -webkit-overflow-scrolling: touch;
    }
    .katex {
      font-size: 1.08em;
    }
  </style>
</head>
<body>
  <div id="content-container"></div>
  <script>
    try {
      const rawHtml = ${encodedContent};
      const container = document.getElementById('content-container');
      container.innerHTML = rawHtml;

      // Wrap tables that are not wrapped yet to guarantee horizontal touch scrolling on mobile
      const tables = container.querySelectorAll('table');
      tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-wrapper';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });

      // Intercept anchor tag clicks so they open in the mobile device's system browser
      const links = container.querySelectorAll('a');
      links.forEach(a => {
        a.addEventListener('click', function(e) {
          e.preventDefault();
          const href = a.getAttribute('href');
          if (href && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open_url', url: href }));
          }
        });
      });

      // Render KaTeX Math formulas ($...$ or $$...$$)
      if (window.renderMathInElement) {
        renderMathInElement(container, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false}
          ],
          throwOnError: false
        });
      }
    } catch(err) {
      console.error(err);
    }

    function sendHeight() {
      const h = Math.max(
        document.body.scrollHeight || 0,
        document.documentElement.scrollHeight || 0,
        document.getElementById('content-container')?.offsetHeight || 0,
        30
      );
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ height: h }));
      }
    }

    // Measure height on initial load and after potential image/font rendering
    sendHeight();
    setTimeout(sendHeight, 60);
    setTimeout(sendHeight, 180);
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 1200);

    // Watch for dynamic DOM changes (e.g. image loads)
    window.addEventListener('load', sendHeight);
    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height: webViewHeight }, style]}>
      <WebView
        source={{ html: htmlDocument }}
        style={styles.webView}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data?.type === 'open_url' && data.url) {
              Linking.openURL(data.url).catch(() => {});
            } else if (data?.height && data.height > 10) {
              setWebViewHeight(Math.ceil(data.height) + 14);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});

export default MathView;

