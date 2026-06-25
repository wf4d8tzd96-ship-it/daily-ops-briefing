import asyncio
import sys
from pathlib import Path

import edge_tts


async def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: tts-edge.py <text-file> <output-mp3> [voice]")

    text_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    voice = sys.argv[3] if len(sys.argv) > 3 else "zh-CN-XiaoxiaoNeural"
    text = text_file.read_text(encoding="utf-8")
    output_file.parent.mkdir(parents=True, exist_ok=True)

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output_file))


if __name__ == "__main__":
    asyncio.run(main())
