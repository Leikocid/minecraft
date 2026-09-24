import zlib, struct, sys
# Palette: blade (d dark steel outer / m mid steel highlight), crimson edge glow
# (e dark red / r bright red) along the blade's inner curve, handle (h light /
# H dark) — same handle browns as the Web Sword icon for a consistent set.
PAL = {
    '.': None,
    'd': (55, 58, 64),
    'm': (105, 110, 118),
    'e': (120, 15, 25),
    'r': (190, 35, 45),
    'h': (140, 90, 50),
    'H': (90, 55, 25),
}
GRID = [
    "........ddm.....",
    ".......e..dm....",
    "......e....dm...",
    "......r.....dm..",
    ".......r....dm..",
    "...........dm...",
    "..........dm....",
    "........hd......",
    ".......Hh.......",
    "......Hh........",
    ".....Hh.........",
    "....Hh..........",
    "...Hh...........",
    "..Hh............",
    ".Hh.............",
    "Hh..............",
]
assert len(GRID) == 16 and all(len(r) == 16 for r in GRID), "grid must be 16x16"
def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    def chunk(t, b): return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
def rgba(c):
    v = PAL[c]; return (0, 0, 0, 0) if v is None else v + (255,)
rows = [[b for c in r for b in rgba(c)] for r in GRID]
write_png(sys.argv[1], 16, 16, rows)
S = 12
big = []
for r in GRID:
    line = [b for c in r for b in rgba(c) * S]
    big += [line] * S
write_png(sys.argv[2], 16 * S, 16 * S, big)
print("written")
