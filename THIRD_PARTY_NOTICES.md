# Third-party notices

## Panda3DS

The PTM ConfigureNew3DSCPU response in index.html adapts behavior from Panda3DS, `src/core/services/ptm.cpp`, revision 3787358bdae41d5532ccd00c8998a527ae949949:
https://github.com/Panda3DS-emu/Panda3DS/blob/3787358bdae41d5532ccd00c8998a527ae949949/src/core/services/ptm.cpp

Panda3DS is distributed under GNU GPL version 3. Its license is included in third_party/Panda3DS-LICENSE.txt. This adaptation changes the C++ implementation to JavaScript for the browser emulator.

## Azahar / Citra

The Y2R planar conversion in index.html adapts fixed-point color conversion and standard coefficients from Azahar/Citra at revision 01623d2fb707317410225c0eced82e3e0c84edc1:
https://github.com/azahar-emu/azahar/blob/01623d2fb707317410225c0eced82e3e0c84edc1/src/core/hw/y2r.cpp
https://github.com/azahar-emu/azahar/blob/01623d2fb707317410225c0eced82e3e0c84edc1/src/core/hle/service/cam/y2r_u.cpp

Copyright 2015–2024 Citra Emulator Project / Azahar Emulator Project. Licensed under GPL version 2 or any later version; see third_party/Azahar-GPL-2.0.txt. The C++ implementation was adapted to JavaScript and only a subset of Y2R layouts is supported.

The PICA fixed-attribute FIFO and vertex-loader behavior in v0.0332 were independently implemented in JavaScript after comparing Azahar at the same revision:
https://github.com/azahar-emu/azahar/blob/01623d2fb707317410225c0eced82e3e0c84edc1/src/video_core/pica/pica_core.cpp
https://github.com/azahar-emu/azahar/blob/01623d2fb707317410225c0eced82e3e0c84edc1/src/video_core/pica/vertex_loader.cpp
https://github.com/azahar-emu/azahar/blob/01623d2fb707317410225c0eced82e3e0c84edc1/src/video_core/renderer_opengl/gl_rasterizer.cpp
No Eden implementation code was copied.
