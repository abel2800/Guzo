import re
from pathlib import Path

ROOT = Path(r"d:\New folder\Guzo\apps\guzo-api\src\main\java\et\guzo\domain\entity")
IMPORTS = (
    "import org.hibernate.annotations.JdbcTypeCode;\n"
    "import org.hibernate.type.SqlTypes;\n"
)
PATTERN = re.compile(
    r"@Enumerated\(EnumType\.STRING\)\s*\n"
    r"\s*@Column(\([^\n]*\))?\s*\n"
    r"\s*private\s+(\w+)\s+(\w+)",
    re.MULTILINE,
)


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "@Enumerated" not in text or "JdbcTypeCode" in text and text.count("@Enumerated") == text.count("JdbcTypeCode"):
        # still patch fields missing JdbcTypeCode
        pass

    if "JdbcTypeCode" not in text:
        if "import lombok.Getter;" in text:
            text = text.replace("import lombok.Getter;", IMPORTS + "import lombok.Getter;", 1)
        else:
            text = text.replace("import jakarta.persistence.*;", "import jakarta.persistence.*;\n" + IMPORTS, 1)

    def repl(match: re.Match[str]) -> str:
        block = match.group(0)
        if "JdbcTypeCode" in block:
            return block
        col = match.group(1) or ""
        enum_type = match.group(2)
        field = match.group(3)
        if 'columnDefinition' not in col:
            if col:
                col = col[:-1] + f', columnDefinition = "\\"{enum_type}\\"")'
            else:
                col = f'(columnDefinition = "\\"{enum_type}\\"")'
        return (
            "@Enumerated(EnumType.STRING)\n"
            "    @JdbcTypeCode(SqlTypes.NAMED_ENUM)\n"
            f"    @Column{col}\n"
            f"    private {enum_type} {field}"
        )

    new = PATTERN.sub(repl, text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        return True
    return False


if __name__ == "__main__":
    for file in sorted(ROOT.glob("*.java")):
        if patch_file(file):
            print(f"patched {file.name}")
