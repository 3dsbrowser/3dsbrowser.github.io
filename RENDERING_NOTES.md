# Rendering changes: v0.0332

## Concrete fixes

PICA fixed vertex attributes were silently skipped. Registers 0x232–0x235 now
capture packed float24 values, advance the attribute index, and reset incomplete
uploads when a new index is selected. The interpreter, fast CPU path, shader
worker pool and hardware vertex shader all apply the input permutation to those
values. Array loader offsets advance across every declared field, including
fields whose values are supplied by a fixed attribute.

This corrects a source of wrong vertex colors, normals and positions. It is a
candidate fix for Mario Kart 7's black wheels and empty meshes, not a verified
claim that all of those visual problems are resolved.

Frame-skip target classification now reads framebuffer format from bits 16–18 of
register 0x117 and handles RGBA4. Per-entry-point WebGL timing, previously always
active, is enabled only with `#gltiming`; draw/texture/vertex phase totals remain.

## WebGPU scope

Settings has an optional **WebGPU display (experimental)** toggle. A WGSL
fullscreen triangle presents incoming GPU ImageBitmaps or CPU RGBA frames.
Bitmap subrectangles are copied with `copyExternalImageToTexture`; no CPU pixel
readback is introduced. Unsupported adapters, initialization failures, validation
errors and device loss restore the 2D display path. The setting defaults off
because this path has not been benchmarked on the user's Chromebook.

**PICA geometry, texturing, lighting, depth and blending still use WebGL2**, with
software fallback. The WebGPU display does not replace the PICA rasterizer and
is not evidence of a 3D FPS gain. Copied logs identify both backends separately.
The WASM raster counter being zero can be normal while WebGL is rendering.

A full WebGPU PICA backend must preserve GPU render targets and texture aliases,
port the TEV/lighting shader generator and vertex shaders to WGSL, cache pipeline
state and stage asynchronous readbacks. Merely substituting WebGPU for WebGL
calls cannot preserve the current synchronous guest-memory read contract.

## Reference comparison

Azahar revision `01623d2fb707317410225c0eced82e3e0c84edc1` was inspected:

- `src/video_core/pica/pica_core.cpp`: `SubmitImmediate` decodes fixed uploads.
- `src/video_core/pica/vertex_loader.cpp`: array layout consumes declared fields,
  and default attributes supply configured inputs.
- `src/video_core/renderer_opengl/gl_rasterizer.cpp`: raw array uploads, cached
  attribute enables, `glVertexAttrib4f` for fixed inputs, hardware shader setup.

Those techniques fit this browser renderer's existing translated vertex shaders,
streaming buffers and shader cache. This change repairs the missing fixed-input
part without importing a native emulator core.

The relevant Eden browser-facing package found was
[linuxserver/docker-eden](https://github.com/linuxserver/docker-eden), whose README
says it runs the native Switch emulator and streams its desktop via Selkies.
Its speed is not a browser WASM/WebGPU benchmark. A local Eden web emulation core
was not identified. No Eden source was copied.

## Validation and limits

All tests in `tests/*.test.js` pass. Added regressions cover fixed FIFO decoding,
index reset/advance, permutation, stride, CPU/GPU/worker-pool input agreement,
generic-attribute caching, and mocked WebGPU upload/lifecycle/failure behavior.
All executable inline scripts parse. WebGPU tests use a mocked device: actual
WGSL compilation, browser presentation, screenshots, MK7 output and FPS need
hardware/game testing. No 30 FPS claim is made.
