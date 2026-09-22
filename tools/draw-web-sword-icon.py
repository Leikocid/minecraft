import zlib, struct, sys
# Palette: diamond blade (b light / B mid / d dark edge), guard (g light / G dark),
# handle (h light / H dark), cobweb threads (w white / W grey) laid over the
# blade and the guard.
PAL = {
    '.': None,
    'b': (203, 242, 242), 'B': (120, 217, 217), 'd': (48, 130, 130),
    'g': (225, 225, 225), 'G': (150, 150, 150),
    'h': (140, 90, 50),   'H': (90, 55, 25),
    'w': (245, 245, 245), 'W': (205, 205, 205),
}
GRID = [
    "..............bd",
    "............BWd.",
    "...........Bwd..",
    "..........BWd...",
    ".........Bwd....",
    "........BWd.....",
    ".......Bwd......",
    "......BGdw......",
    ".....GgwgG......",
    ".....hw.........",
    "....hH..........",
    "...hH...........",
    "..hH............",
    ".hH.............",
    "hH..............",
    "H...............",
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
