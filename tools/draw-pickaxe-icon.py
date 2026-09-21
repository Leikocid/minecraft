import zlib, struct, sys
# Palette: gold edge (g light / G mid / k dark), iron head (i / I / d), wooden handle (w / W / x)
PAL = {
    '.': None,
    'g': (255, 240, 138), 'G': (233, 184, 56), 'k': (165, 115, 28),
    'i': (240, 240, 240), 'I': (198, 198, 198), 'd': (122, 122, 122),
    'w': (160, 112, 58),  'W': (122, 82, 48),   'x': (78, 50, 24),
}
GRID = [
    "................",
    "........gGGGg...",
    "......gGiiiiiGg.",
    ".....GIiIIIIIiIG",
    "....GIdk.wWkdIiG",
    "...GIdk.wWx.kdIG",
    "..GIdk.wWx...kdG",
    "..GIk.wWx....kIG",
    "...Gk.wWx.....GG",
    ".....wWx........",
    "....wWx.........",
    "...wWx..........",
    "..wWx...........",
    ".wWx............",
    "wWx.............",
    "................",
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
