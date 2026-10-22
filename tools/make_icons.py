# 生成 PWA 图标（纯 Python，无依赖）：蓝底 + 白色同心圆靶心 + 三个掌握度圆点。
import struct, zlib, os

BG = (27, 77, 255)
WHITE = (255, 255, 255)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size):
    cx, cy = size / 2, size * 0.44
    r_outer = size * 0.26
    r_inner = size * 0.165
    r_center = size * 0.07
    dot_y = size * 0.78
    dot_r = size * 0.045
    dot_xs = [size * 0.35, size * 0.5, size * 0.65]

    rows = []
    for y in range(size):
        row = bytearray([0])  # filter type 0
        for x in range(size):
            px = BG
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5

            def ring(r, w):
                return abs(d - r) <= w

            aa = size * 0.012  # 简单抗锯齿带宽
            ring_w = size * 0.028
            color = None
            if d <= r_center:
                color = WHITE
            elif ring(r_inner, ring_w):
                color = WHITE
            elif ring(r_outer, ring_w):
                color = WHITE
            # 抗锯齿边缘
            elif d <= r_center + aa:
                color = lerp(WHITE, BG, (d - r_center) / aa)
            elif abs(d - r_inner) <= ring_w + aa:
                color = lerp(WHITE, BG, (abs(d - r_inner) - ring_w) / aa)
            elif abs(d - r_outer) <= ring_w + aa:
                color = lerp(WHITE, BG, (abs(d - r_outer) - ring_w) / aa)
            if color is None:
                # 底部三个圆点（前两个实心=已掌握，第三个空心=进行中）
                for i, dx in enumerate(dot_xs):
                    dd = ((x - dx) ** 2 + (y - dot_y) ** 2) ** 0.5
                    if i < 2:
                        if dd <= dot_r:
                            color = WHITE
                        elif dd <= dot_r + aa:
                            color = lerp(WHITE, BG, (dd - dot_r) / aa)
                    else:
                        w = size * 0.016
                        if abs(dd - dot_r) <= w:
                            color = WHITE
                        elif abs(dd - dot_r) <= w + aa:
                            color = lerp(WHITE, BG, (abs(dd - dot_r) - w) / aa)
                    if color:
                        break
            px = color or BG
            row += bytes(px)
        rows.append(bytes(row))
    return b''.join(rows)


def write_png(path, size):
    raw = make_icon(size)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c))

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print(path, len(png), 'bytes')


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', 'icons')
    os.makedirs(out, exist_ok=True)
    write_png(os.path.join(out, 'icon-192.png'), 192)
    write_png(os.path.join(out, 'icon-512.png'), 512)
