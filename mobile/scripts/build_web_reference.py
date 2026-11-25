"""Build self-contained React page data from the preserved original site.

Run from mobile/: python scripts/build_web_reference.py
The source HTML is kept in mobile/reference so the Expo project can be moved
or published without depending on files in its parent directory.
"""

import json
import re
from pathlib import Path

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

BASE = Path(__file__).resolve().parents[1]
SOURCE = BASE / "reference"
DATA = BASE / "src" / "data" / "webPages.json"
IMAGES = BASE / "src" / "data" / "imageSources.ts"
PAGE_CSS = BASE / "public" / "page-css"
SKIP_TAGS = {"script", "style", "noscript"}
BOOLEAN_ATTRIBUTES = {"required", "disabled", "readonly", "checked", "multiple", "allowfullscreen", "hidden", "novalidate"}


def convert_style(value):
    result = {}
    for declaration in value.split(";"):
        if ":" not in declaration:
            continue
        name, setting = declaration.split(":", 1)
        name = name.strip()
        setting = re.sub(r"\s*!important\s*$", "", setting.strip())
        if not name or not setting:
            continue
        key = name if name.startswith("--") else re.sub(r"-([a-z])", lambda match: match[1].upper(), name)
        result[key] = setting
    return result


def convert_attribute(name, value):
    if name.startswith("on") and name != "onclick":
        return None
    if name == "class":
        return "className", " ".join(value)
    if name == "for":
        return "htmlFor", value
    if name == "tabindex":
        return "tabIndex", int(value)
    if name == "readonly":
        return "readOnly", True
    if name == "allowfullscreen":
        return "allowFullScreen", True
    if name == "novalidate":
        return "noValidate", True
    if name == "datetime":
        return "dateTime", value
    if name == "spellcheck":
        return "spellCheck", value
    if name == "referrerpolicy":
        return "referrerPolicy", value
    if name == "autocomplete":
        return "autoComplete", value
    if name == "srcset":
        return "srcSet", value
    if name == "style":
        return "style", convert_style(value)
    if name == "onclick":
        return "legacyAction", value
    if name in BOOLEAN_ATTRIBUTES:
        return name, True
    if name.startswith("aria-") or name.startswith("data-") or name in {
        "id", "href", "src", "alt", "title", "role", "target", "rel", "type",
        "name", "value", "placeholder", "rows", "cols", "action", "method",
        "loading", "width", "height", "download", "min", "max", "step", "scope",
    }:
        if isinstance(value, list):
            value = " ".join(value)
        if name == "src" and value.startswith("img/"):
            value = "/" + value
        if name == "href":
            if value == "index.html":
                value = "/index.html"
            elif value.startswith("index.html#"):
                value = "/" + value
            elif value.endswith(".html") and "/" not in value:
                value = "/" + value
            elif value.startswith("img/") or value.endswith((".pdf", ".docx")):
                value = "/" + value
        return name, value
    return None


def convert_node(node):
    if isinstance(node, Comment):
        return None
    if isinstance(node, NavigableString):
        content = str(node)
        return content if content.strip() else None
    if not isinstance(node, Tag) or node.name in SKIP_TAGS:
        return None
    if node.has_attr("vw") or node.has_attr("vw-access-button"):
        return None
    props = {}
    for name, value in node.attrs.items():
        converted = convert_attribute(name, value)
        if converted:
            props[converted[0]] = converted[1]
    children = []
    for child in node.children:
        converted = convert_node(child)
        if converted is not None:
            children.append(converted)
    return {"tag": node.name, "props": props, "children": children}


def main():
    PAGE_CSS.mkdir(parents=True, exist_ok=True)
    pages = {}
    for html_file in sorted(SOURCE.glob("*.html")):
        slug = html_file.stem
        soup = BeautifulSoup(html_file.read_text(encoding="utf-8"), "html.parser")
        styles = "\n".join(style.get_text() for style in soup.select("style"))
        (PAGE_CSS / f"{slug}.css").write_bytes(styles.encode("utf-8"))
        body = [convert_node(child) for child in soup.body.children]
        pages[slug] = {
            "title": soup.title.get_text(" ", strip=True) if soup.title else slug,
            "bodyClass": " ".join(soup.body.get("class", [])),
            "body": [node for node in body if node is not None],
            "styles": [
                "/styles.css" if "styles.css" in (link.get("href") or "") else "/" + (link.get("href") or "").split("?")[0]
                for link in soup.select('link[rel="stylesheet"]')
                if not (link.get("href") or "").startswith("http")
            ] + [f"/page-css/{slug}.css"],
        }
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_bytes((json.dumps(pages, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8"))
    image_root = BASE / "assets" / "images"
    lines = [
        "// Generated by scripts/build_web_reference.py",
        "import { ImageSourcePropType } from 'react-native';",
        "export const imageSources: Record<string, ImageSourcePropType> = {",
    ]
    for path in sorted(image_root.rglob("*")):
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
            name = path.relative_to(image_root).as_posix()
            lines.append(f"  {json.dumps('img/' + name)}: require({json.dumps('../../assets/images/' + name)}),")
    lines.append("};")
    IMAGES.write_bytes(("\n".join(lines) + "\n").encode("utf-8"))
    print({slug: len(page["body"]) for slug, page in pages.items()})


if __name__ == "__main__":
    main()
