# Fixes Metro file-watcher crashes on Windows (broken optional native binding paths)
$Root = Split-Path -Parent $PSScriptRoot
$paths = @(
    "$Root\node_modules\@tybys\wasm-util\dist",
    "$Root\node_modules\@unrs\resolver-binding-wasm32-wasi\node_modules\@emnapi\runtime\dist"
)
foreach ($p in $paths) {
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Force -Path $p | Out-Null
    }
}
